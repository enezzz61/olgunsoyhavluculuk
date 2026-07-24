import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { StoreProvider } from "@/components/store-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CookieConsent } from "@/components/cookie-consent";
import { isDatabaseConfigured } from "@/lib/prisma";
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
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.jpg", type: "image/jpeg" },
    ],
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
        url: absoluteUrl("/favicon.ico.jpg"),
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
    images: [absoluteUrl("/favicon.ico.jpg")],
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
    logo: absoluteUrl("/favicon.ico.jpg"),
    sameAs: [],
  };

  const databaseReady = isDatabaseConfigured();

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
        <Script id="iyzico-buyer-protection-inline" strategy="afterInteractive">
          {`window.iyz = { token: '6e7cdd7e-3b6c-4226-96c7-d558ef1ea261', position: 'bottomLeft', ideaSoft: false, pwi: true };`}
        </Script>
        <Script
          src="https://static.iyzipay.com/buyer-protection/buyer-protection.js"
          strategy="afterInteractive"
        />
        {databaseReady ? (
          <StoreProvider>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <CookieConsent />
          </StoreProvider>
        ) : (
          <>
            <SiteHeader />
            <main className="flex-1">
              <section className="page-shell">
                <div className="mx-auto max-w-2xl px-4 py-20 md:px-8">
                  <div className="panel space-y-4 text-center">
                    <p className="hero-kicker">Sistem Durumu</p>
                    <h1 className="section-title">Bağlantı Sağlanamadı</h1>
                    <p className="section-sub">
                      MongoDB bağlantısı sağlanamadığı için site şu anda kullanılamıyor. Lütfen veritabanı bağlantısını kontrol edin.
                    </p>
                  </div>
                </div>
              </section>
            </main>
            <SiteFooter />
            <CookieConsent />
          </>
        )}
      </body>
    </html>
  );
}
