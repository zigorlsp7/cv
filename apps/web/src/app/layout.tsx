import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { RumObserver } from "@/components/rum-observer";
import { TopNav } from "@/components/top-nav";
import { I18nProvider } from "@/i18n/client";
import { getLocale, getMessages, getTranslator } from "@/i18n/server";

export const metadata: Metadata = {
  title: "CV Platform",
  description: "State-of-the-art CV platform skeleton",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const t = await getTranslator(locale);

  return (
    <html lang={locale}>
      <body className="antialiased">
        <I18nProvider locale={locale} messages={messages}>
          <a className="skip-link" href="#main-content">
            {t("skip.content")}
          </a>
          <RumObserver />
          <Suspense fallback={<div className="h-16 border-b border-slate-200/80 bg-white/80" />}>
            <TopNav />
          </Suspense>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
