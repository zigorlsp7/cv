"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getUiTheme } from "@/lib/architecture-variants";
import { LanguageSwitcher } from "@/components/language-switcher";
import { UserAuthMenu } from "@/components/user-auth-menu";
import { useI18n } from "@/i18n/client";
const NAV_ITEMS = [
  { href: "/", labelKey: "nav.cv" },
  { href: "/architecture", labelKey: "nav.architecture" },
  { href: "/accessibility", labelKey: "nav.accessibility" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TopNav() {
  const pathname = usePathname();
  const theme = getUiTheme();
  const { t } = useI18n();

  return (
    <header className={`sticky top-0 z-50 ${theme.navHeader}`}>
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-8">
        <Link
          href="/"
          className={`text-sm font-semibold tracking-[0.1em] ${theme.navBrand}`}
        >
          {t("nav.brand")}
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
                    {t(item.labelKey)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <UserAuthMenu />
        </div>
      </div>
    </header>
  );
}
