import { NextResponse } from "next/server";
import {
  consumeGoogleOauthState,
  createAuthSession,
  getGoogleOauthConfig,
  getRequestOrigin,
} from "@/lib/auth-session";

type GoogleTokenResponse = {
  access_token?: string;
  token_type?: string;
};

type GoogleUserInfoResponse = {
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";

function callbackRedirect(base: string, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, base));
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const requestOrigin = getRequestOrigin(request);
  const { state: expectedState, redirectPath } = await consumeGoogleOauthState();
  const config = getGoogleOauthConfig(request);

  if (!config) {
    return callbackRedirect(requestOrigin, "/");
  }

  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  if (!code || !state || !expectedState || state !== expectedState) {
    return callbackRedirect(requestOrigin, "/");
  }

  const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });

  if (!tokenResponse.ok) {
    return callbackRedirect(requestOrigin, "/");
  }

  const tokenPayload = (await tokenResponse.json()) as GoogleTokenResponse;
  const accessToken = tokenPayload.access_token?.trim();
  if (!accessToken) {
    return callbackRedirect(requestOrigin, "/");
  }

  const userInfoResponse = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!userInfoResponse.ok) {
    return callbackRedirect(requestOrigin, "/");
  }

  const userInfo = (await userInfoResponse.json()) as GoogleUserInfoResponse;
  const email = userInfo.email?.trim().toLowerCase();
  if (!email || userInfo.email_verified !== true) {
    return callbackRedirect(requestOrigin, "/");
  }

  const sessionCreated = await createAuthSession({
    email,
    name: userInfo.name ?? null,
    picture: userInfo.picture ?? null,
  });
  if (!sessionCreated) {
    return callbackRedirect(requestOrigin, "/");
  }

  return callbackRedirect(requestOrigin, redirectPath);
}
