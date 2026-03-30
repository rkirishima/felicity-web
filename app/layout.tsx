import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/app/providers";
import { CartDrawer } from "@/app/components/CartDrawer";

export const metadata: Metadata = {
  title: "Felicity | Specialty Coffee in Hayama",
  description: "Specialty coffee café in Hayama, Japan.",
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
  return (
    <html lang="ja" suppressHydrationWarning className="m-0 p-0">
      <head>
        <Script src="https://js.stripe.com/v3/" strategy="beforeInteractive" />
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
