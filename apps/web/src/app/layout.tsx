import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased">{children}</body>
    </html>
  );
}
