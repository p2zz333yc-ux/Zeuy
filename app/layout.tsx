import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { site } from "@/config/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${site.domain}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `${site.brand} — ${site.tagline}`,
  description: site.subtitle,
  keywords: [
    "applicateur huile cheveux",
    "cuir chevelu",
    "rituel capillaire",
    "massage cuir chevelu",
    site.brand,
  ],
  openGraph: {
    title: `${site.brand} — ${site.tagline}`,
    description: site.subtitle,
    url: siteUrl,
    siteName: site.brand,
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.brand} — ${site.tagline}`,
    description: site.subtitle,
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: siteUrl,
  },
};

export const viewport = {
  themeColor: "#e11d48",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-cream-100 font-sans text-ink-900">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
