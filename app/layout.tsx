import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { StoreProvider } from "@/components/store-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CookieConsent } from "@/components/cookie-consent";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Olgunsoy Havluculuk",
    template: "%s | Olgunsoy Havluculuk",
  },
  description: "Toptanci ve perakende havlu alisveris platformu",
  keywords: [
    "havlu",
    "toptan havlu",
    "perakende havlu",
    "otel havlusu",
    "banyo havlusu",
    "Olgunsoy Havluculuk",
  ],
  applicationName: "Olgunsoy Havluculuk",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Olgunsoy Havluculuk",
    title: "Olgunsoy Havluculuk",
    description: "Toptanci ve perakende havlu alisveris platformu",
    url: "/",
    images: [
      {
        url: absoluteUrl("/logo.png"),
        width: 512,
        height: 512,
        alt: "Olgunsoy Havluculuk",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Olgunsoy Havluculuk",
    description: "Toptanci ve perakende havlu alisveris platformu",
    images: [absoluteUrl("/logo.png")],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <StoreProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <CookieConsent />
        </StoreProvider>
      </body>
    </html>
  );
}
