import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { RumObserver } from "@/components/rum-observer";
import { TopNav } from "@/components/top-nav";

export const metadata: Metadata = {
  title: "CV Platform",
  description: "State-of-the-art CV platform skeleton",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <RumObserver />
        <Suspense fallback={<div className="h-16 border-b border-slate-200/80 bg-white/80" />}>
          <TopNav />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
