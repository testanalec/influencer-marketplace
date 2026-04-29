import type { Metadata } from "next";
import Script from "next/script";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const SITE_URL = "https://influmarket.in";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "InfluMarket — India's Influencer Marketplace",
    template: "%s | InfluMarket",
  },
  description:
    "Connect brands with verified influencers across India. Find the perfect creator for your campaign or discover brand deals. Fashion, Beauty, Tech, Travel & more.",
  keywords: [
    "influencer marketplace India",
    "brand influencer collaboration",
    "hire influencers India",
    "influencer marketing platform",
    "Instagram influencers India",
    "YouTube influencers India",
    "brand deals for influencers",
  ],
  authors: [{ name: "InfluMarket", url: SITE_URL }],
  creator: "InfluMarket",
  publisher: "InfluMarket",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: "InfluMarket",
    title: "InfluMarket — India's Influencer Marketplace",
    description:
      "Connect brands with verified influencers across India. Find creators for Fashion, Beauty, Tech, Travel & more.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "InfluMarket — India's Influencer Marketplace" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "InfluMarket — India's Influencer Marketplace",
    description: "Connect brands with verified influencers across India.",
    images: ["/og-image.png"],
  },
  alternates: { canonical: SITE_URL },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "InfluMarket",
  url: SITE_URL,
  logo: `${SITE_URL}/og-image.png`,
  description: "India's influencer marketplace connecting brands with verified creators.",
  sameAs: [],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body>
        {/* Google Analytics */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
