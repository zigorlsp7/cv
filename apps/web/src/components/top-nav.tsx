"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getUiTheme } from "@/lib/architecture-variants";

const NAV_ITEMS = [
  { href: "/", label: "CV" },
  { href: "/architecture", label: "Architecture" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TopNav() {
  const pathname = usePathname();
  const theme = getUiTheme();

  return (
    <header className={`sticky top-0 z-50 ${theme.navHeader}`}>
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-8">
        <Link
          href="/"
          className={`text-sm font-semibold tracking-[0.1em] ${theme.navBrand}`}
        >
          CV PLATFORM
        </Link>

        <nav aria-label="Primary">
          <ul className={`flex items-center gap-2 rounded-full p-1 ${theme.navPill}`}>
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                      active ? theme.navLinkActive : theme.navLinkIdle
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
