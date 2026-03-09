"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getUiTheme } from "@/lib/architecture-variants";

type SessionResponse = {
  ok: boolean;
  authenticated: boolean;
  googleAuthConfigured: boolean;
  user?: {
    email: string;
    name: string | null;
    picture: string | null;
    role: "admin" | "user";
  };
};

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5 19c1.2-3 3.7-4.5 7-4.5S17.8 16 19 19" />
      <circle cx="12" cy="12" r="9.25" />
    </svg>
  );
}

export function UserAuthMenu() {
  const theme = getUiTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json() as Promise<SessionResponse>)
      .then((payload) => {
        if (!active) return;
        setSession(payload);
      })
      .catch(() => {
        if (!active) return;
        setSession({
          ok: true,
          authenticated: false,
          googleAuthConfigured: false,
        });
      });

    return () => {
      active = false;
    };
  }, []);

  const redirectPath = useMemo(() => {
    const path = pathname && pathname.length > 0 ? pathname : "/";
    return encodeURIComponent(path);
  }, [pathname]);

  const logout = async () => {
    setBusy(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      setSession((prev) =>
        prev
          ? { ...prev, authenticated: false, user: undefined }
          : { ok: true, authenticated: false, googleAuthConfigured: true },
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cv-auth-signed-out"));
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  if (!session) {
    return (
      <div
        data-testid="user-auth-menu-trigger"
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${theme.navPill}`}
        aria-hidden="true"
      >
        <UserIcon className="h-5 w-5" />
      </div>
    );
  }

  if (!session.authenticated) {
    const disabled = !session.googleAuthConfigured;
    const className = `inline-flex h-9 w-9 items-center justify-center rounded-full ${
      disabled ? theme.chipSecondary : theme.navPill
    }`;

    if (disabled) {
      return (
        <button
          type="button"
          data-testid="user-auth-menu-trigger"
          data-auth-state="google-auth-disabled"
          aria-label="Google sign-in is not configured"
          title="Google sign-in is not configured"
          className={className}
          disabled
        >
          <UserIcon className="h-5 w-5" />
        </button>
      );
    }

    return (
      <a
        href={`/api/auth/google/start?redirect=${redirectPath}`}
        data-testid="user-auth-menu-trigger"
        data-auth-state="google-auth-link"
        aria-label="Login or register with Google"
        title="Login or register with Google"
        className={className}
      >
        <UserIcon className="h-5 w-5" />
      </a>
    );
  }

  const displayName = session.user?.name || session.user?.email || "User";
  const initial = displayName.charAt(0).toUpperCase();
  const isAdmin = session.user?.role === "admin";

  return (
    <details className="relative">
      <summary
        data-testid="user-auth-menu-trigger"
        className={`flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full ${theme.navPill}`}
        aria-label="User account"
        title={displayName}
      >
        {session.user?.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.picture}
            alt={displayName}
            className="h-7 w-7 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="text-xs font-semibold">{initial}</span>
        )}
      </summary>

      <div
        className={`absolute right-0 z-50 mt-2 w-64 rounded-xl border border-slate-200 p-3 shadow-xl ${theme.card}`}
      >
        <p className={`truncate text-sm font-semibold ${theme.title}`}>{displayName}</p>
        {session.user?.email ? (
          <p className={`truncate text-xs ${theme.muted}`}>{session.user.email}</p>
        ) : null}
        <p className={`mt-1 text-xs font-semibold ${theme.muted}`}>
          {isAdmin ? "Role: admin" : "Role: user"}
        </p>
        <button
          type="button"
          onClick={logout}
          disabled={busy}
          className={`mt-3 w-full rounded-full px-3 py-1.5 text-xs font-semibold ${theme.chipPrimary}`}
        >
          {busy ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </details>
  );
}
