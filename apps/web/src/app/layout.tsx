import type { Metadata } from "next";
import "./globals.css";
import { RumObserver } from "@/components/rum-observer";

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
        <RumObserver />
        {children}
      </body>
    </html>
  );
}
