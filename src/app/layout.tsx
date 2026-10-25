import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { siteName, siteUrl } from "@/server/env";
import { cn } from "@/lib/utils";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: siteName() + " — Fotografia",
    template: "%s — " + siteName(),
  },
  description:
    "Fotografia autoral em edições limitadas. Coleções, arquivo e fotos para baixar em alta resolução.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: siteName(),
    title: siteName() + " — Fotografia",
    description: "Fotografia autoral, coleções e arquivo.",
  },
  robots: { index: true, follow: true },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={cn(GeistSans.variable, fraunces.variable)}>
      <body>{children}</body>
    </html>
  );
}
