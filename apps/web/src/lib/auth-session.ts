import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export type AuthRole = "admin" | "user";

export type AuthSession = {
  email: string;
  name: string | null;
  picture: string | null;
  role: AuthRole;
  exp: number;
  ver: 1;
};

type AuthSessionUser = {
  email: string;
  name?: string | null;
  picture?: string | null;
  role: AuthRole;
};

type GoogleOauthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

const SESSION_COOKIE_NAME = "cv-auth-session";
const GOOGLE_STATE_COOKIE_NAME = "cv-google-oauth-state";
const GOOGLE_REDIRECT_COOKIE_NAME = "cv-google-oauth-redirect";
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const OAUTH_STATE_TTL_SECONDS = 10 * 60;

function readSessionSecret(): string | null {
  const configured = process.env.AUTH_SESSION_SECRET?.trim();
  if (configured) return configured;
  return null;
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  if (leftBytes.length !== rightBytes.length) return false;
  return timingSafeEqual(leftBytes, rightBytes);
}

function toSignedValue(payload: string, secret: string): string {
  return `${payload}.${sign(payload, secret)}`;
}

function readSignedPayload(raw: string | undefined, secret: string): string | null {
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  if (!payload || !signature) return null;
  if (!safeEqual(signature, sign(payload, secret))) return null;
  return payload;
}

function normalizeEmail(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function adminEmailSet(): Set<string> {
  return new Set(
    (() => { const v = process.env.ADMIN_GOOGLE_EMAILS; if (v === undefined) { throw new Error("ADMIN_GOOGLE_EMAILS is required"); } return v; })()
      .split(",")
      .map((entry) => normalizeEmail(entry))
      .filter((entry) => entry.length > 0),
  );
}

function resolveRole(email: string): AuthRole {
  return adminEmailSet().has(normalizeEmail(email)) ? "admin" : "user";
}

function normalizeOauthHostname(url: URL): URL {
  if (
    url.hostname === "0.0.0.0" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "[::]" ||
    url.hostname === "::"
  ) {
    url.hostname = "localhost";
  }
  return url;
}

export function getRequestOrigin(request: Request): string {
  const requestUrl = new URL(request.url);
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();

  if (forwardedHost) {
    const proto = forwardedProto || requestUrl.protocol.replace(":", "");
    return normalizeOauthHostname(new URL(`${proto}://${forwardedHost}`)).origin;
  }

  const host = request.headers.get("host")?.trim();
  if (host) {
    requestUrl.host = host;
  }
  if (forwardedProto) {
    requestUrl.protocol = `${forwardedProto}:`;
  }

  return normalizeOauthHostname(requestUrl).origin;
}

function toSession(user: AuthSessionUser): AuthSession {
  return {
    email: normalizeEmail(user.email),
    name: user.name?.trim() || null,
    picture: user.picture?.trim() || null,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    ver: 1,
  };
}

export function isGoogleAuthConfigured(): boolean {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  return Boolean(clientId && clientSecret);
}

export function getGoogleOauthConfig(request: Request): GoogleOauthConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  const explicitRedirect = process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim();
  if (!explicitRedirect) return null;

  let redirectUri;
  try {
    redirectUri = normalizeOauthHostname(new URL(explicitRedirect)).toString();
  } catch {
    return null;
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}

export function sanitizeRedirectPath(value: string | null | undefined): string {
  if (!value) return "/";
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  return value;
}

export async function setGoogleOauthState(
  state: string,
  redirectPath: string,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(GOOGLE_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: OAUTH_STATE_TTL_SECONDS,
  });
  cookieStore.set(GOOGLE_REDIRECT_COOKIE_NAME, sanitizeRedirectPath(redirectPath), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: OAUTH_STATE_TTL_SECONDS,
  });
}

export async function consumeGoogleOauthState(): Promise<{
  state: string | null;
  redirectPath: string;
}> {
  const cookieStore = await cookies();
  const state = cookieStore.get(GOOGLE_STATE_COOKIE_NAME)?.value ?? null;
  const redirectPath = sanitizeRedirectPath(
    cookieStore.get(GOOGLE_REDIRECT_COOKIE_NAME)?.value,
  );

  cookieStore.set(GOOGLE_STATE_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  cookieStore.set(GOOGLE_REDIRECT_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return { state, redirectPath };
}

export async function createAuthSession(user: {
  email: string;
  name?: string | null;
  picture?: string | null;
}): Promise<boolean> {
  const secret = readSessionSecret();
  if (!secret) return false;

  const normalizedEmail = normalizeEmail(user.email);
  if (!normalizedEmail) return false;

  const session = toSession({
    email: normalizedEmail,
    name: user.name ?? null,
    picture: user.picture ?? null,
    role: resolveRole(normalizedEmail),
  });
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, toSignedValue(payload, secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return true;
}

export async function clearAuthSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const secret = readSessionSecret();
  if (!secret) return null;

  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const payload = readSignedPayload(raw, secret);
  if (!payload) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Partial<AuthSession>;
    const email = normalizeEmail(parsed.email);
    if (!email) return null;
    if (parsed.ver !== 1) return null;
    if (parsed.role !== "admin" && parsed.role !== "user") return null;
    if (typeof parsed.exp !== "number") return null;
    if (parsed.exp <= Math.floor(Date.now() / 1000)) return null;

    return {
      email,
      name: parsed.name?.trim() || null,
      picture: parsed.picture?.trim() || null,
      role: parsed.role,
      exp: parsed.exp,
      ver: 1,
    };
  } catch {
    return null;
  }
}

export async function isAdminSession(): Promise<boolean> {
  const session = await getAuthSession();
  return session?.role === "admin";
}
