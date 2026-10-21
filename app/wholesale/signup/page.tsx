import type { Metadata } from 'next';
import { SignupForm } from './SignupForm';

// 新規のお申し込みフォーム。公開ページ（/wholesale）から来てもらう入口で、
// 検索から直接ここに来る必要はないのでインデックスはさせない。
export const metadata: Metadata = {
  title: '業販のお申し込み',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function WholesaleSignupPage() {
  return <SignupForm />;
}
