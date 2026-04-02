import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/app/providers";
import { CartDrawer } from "@/app/components/CartDrawer";

export const metadata: Metadata = {
  metadataBase: new URL("https://felicity.cafe"),
  title: {
    default: "FELICITY COFFEE ROASTERS | 葉山の自家焙煎スペシャルティコーヒー",
    template: "%s | FELICITY COFFEE ROASTERS",
  },
  description:
    "神奈川県葉山町の自家焙煎コーヒー専門店。エチオピア・パナマゲイシャ・グアテマラなど世界各地のスペシャルティコーヒー豆を焙煎・販売。オンライン通販あり。",
  keywords: [
    "葉山コーヒー",
    "自家焙煎",
    "スペシャルティコーヒー",
    "コーヒー豆 通販",
    "葉山カフェ",
    "コーヒーロースター 神奈川",
    "シングルオリジン",
    "Felicity Coffee Roasters",
    "葉山 焙煎",
    "コーヒー豆 葉山",
  ],
  alternates: {
    canonical: "https://felicity.cafe",
    languages: {
      ja: "https://felicity.cafe",
      en: "https://felicity.cafe/en",
    },
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    alternateLocale: "en_US",
    url: "https://felicity.cafe",
    siteName: "FELICITY COFFEE ROASTERS",
    title: "FELICITY COFFEE ROASTERS | 葉山の自家焙煎スペシャルティコーヒー",
    description:
      "神奈川県葉山町の自家焙煎コーヒー専門店。エチオピア・パナマゲイシャ・グアテマラなど世界各地のスペシャルティコーヒー豆を焙煎・販売。",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "FELICITY COFFEE ROASTERS 葉山の自家焙煎コーヒー",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FELICITY COFFEE ROASTERS | 葉山の自家焙煎スペシャルティコーヒー",
    description:
      "神奈川県葉山町の自家焙煎コーヒー専門店。スペシャルティコーヒー豆を焙煎・販売。",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="ja" suppressHydrationWarning className="m-0 p-0">
      <head>
        <Script src="https://js.stripe.com/v3/" strategy="beforeInteractive" />
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');`}
            </Script>
          </>
        )}
      </head>
      <body className="m-0 p-0">
        <Providers>
          {children}
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}
