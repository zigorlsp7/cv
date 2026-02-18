import { NextResponse } from "next/server";
import { clearAuthSession, getAuthSession, isGoogleAuthConfigured } from "@/lib/auth-session";

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({
      ok: true,
      authenticated: false,
      googleAuthConfigured: isGoogleAuthConfigured(),
    });
  }

  return NextResponse.json({
    ok: true,
    authenticated: true,
    googleAuthConfigured: isGoogleAuthConfigured(),
    user: {
      email: session.email,
      name: session.name,
      picture: session.picture,
      role: session.role,
    },
  });
}

export async function DELETE() {
  await clearAuthSession();
  return NextResponse.json({ ok: true, authenticated: false });
}
