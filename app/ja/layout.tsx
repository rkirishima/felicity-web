import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FELICITY COFFEE ROASTERS | スペシャルティコーヒー",
  description: "葉山のスペシャルティコーヒー専門店。",
};

export default function JaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
