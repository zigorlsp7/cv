import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  getGoogleOauthConfig,
  getRequestOrigin,
  sanitizeRedirectPath,
  setGoogleOauthState,
} from "@/lib/auth-session";

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";

export async function GET(request: Request) {
  const config = getGoogleOauthConfig(request);
  const fallbackUrl = new URL("/", getRequestOrigin(request));
  if (!config) {
    return NextResponse.redirect(fallbackUrl);
  }

  const requestUrl = new URL(request.url);
  const redirectPath = sanitizeRedirectPath(requestUrl.searchParams.get("redirect"));
  const state = randomUUID();
  await setGoogleOauthState(state, redirectPath);

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  return NextResponse.redirect(`${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`);
}
