import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FELICITY COFFEE ROASTERS | Specialty Coffee",
  description: "Specialty coffee roasters in Hayama, Japan.",
};

export default function EnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
