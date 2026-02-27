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
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-2 px-4 py-2 md:flex-nowrap md:justify-between md:gap-4 md:px-8">
        <Link
          href="/"
          className={`shrink-0 text-sm font-semibold tracking-[0.1em] ${theme.navBrand}`}
        >
          {t("nav.brand")}
        </Link>

        <div className="order-2 ml-auto flex items-center gap-2 md:order-3 md:ml-0">
          <LanguageSwitcher />
          <UserAuthMenu />
        </div>

        <nav aria-label="Primary" className="order-3 w-full md:order-2 md:w-auto">
          <ul
            className={`flex items-center gap-1 overflow-x-auto rounded-2xl p-1 md:gap-2 md:overflow-visible md:rounded-full ${theme.navPill}`}
          >
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`block whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm md:px-4 ${
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
      </div>
    </header>
  );
}
