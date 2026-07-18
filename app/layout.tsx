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
  referrer: "origin-when-cross-origin",
  keywords: [
    "havlu",
    "toptan havlu",
    "perakende havlu",
    "otel havlusu",
    "banyo havlusu",
    "Olgunsoy Havluculuk",
  ],
  category: "shopping",
  creator: "Olgunsoy Havluculuk",
  publisher: "Olgunsoy Havluculuk",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  authors: [{ name: "Olgunsoy Havluculuk" }],
  applicationName: "Olgunsoy Havluculuk",
  icons: {
    icon: [{ url: "/logo.jpg" }],
    apple: [{ url: "/logo.jpg" }],
  },
  alternates: {
    canonical: "/",
    languages: {
      "tr-TR": "/",
    },
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
        url: absoluteUrl("/logo.jpg"),
        width: 1200,
        height: 630,
        alt: "Olgunsoy Havluculuk",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Olgunsoy Havluculuk",
    description: "Toptanci ve perakende havlu alisveris platformu",
    images: [absoluteUrl("/logo.jpg")],
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
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteUrl = getSiteUrl();
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Olgunsoy Havluculuk",
    url: siteUrl,
    logo: absoluteUrl("/logo.jpg"),
    sameAs: [],
  };

  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
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
