import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MIHARI — Corporate Action Intelligence",
  description:
    "AI monitoring and onchain protection for tokenized stocks on Robinhood Chain.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
