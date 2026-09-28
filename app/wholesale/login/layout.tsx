import type { Metadata } from 'next';

// 取引先しか使わない画面。robots.txt でも /wholesale/ 配下は Disallow している。
export const metadata: Metadata = {
  title: '業販ログイン | FELICITY COFFEE ROASTERS',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function WholesaleLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
