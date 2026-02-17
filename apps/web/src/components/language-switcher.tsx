"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/i18n/actions";
import { SUPPORTED_LOCALES } from "@/i18n/config";
import { useI18n } from "@/i18n/client";

export function LanguageSwitcher() {
  const router = useRouter();
  const { locale, t } = useI18n();
  const [isPending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
      <span className="sr-only">{t("nav.languageLabel")}</span>
      <select
        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
        value={locale}
        onChange={(event) => {
          const next = event.target.value as (typeof SUPPORTED_LOCALES)[number];
          startTransition(async () => {
            await setLocale(next);
            router.refresh();
          });
        }}
        disabled={isPending}
        aria-label={t("nav.languageLabel")}
      >
        {SUPPORTED_LOCALES.map((language) => (
          <option key={language} value={language}>
            {t(`nav.language.${language}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
