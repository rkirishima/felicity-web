import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "チェックアウト | FELICITY COFFEE ROASTERS",
  description: "お支払い方法を選択してご注文を確定してください。",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "https://felicity.cafe/checkout",
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
