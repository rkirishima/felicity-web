import Link from 'next/link';
import { Header } from '@/app/components/Header';

export const metadata = {
  title: 'ご登録完了 | FELICITY × PAUSE サブスク',
};

export default function SubscribeSuccessPage() {
  return (
    <main className="min-h-screen bg-[#F4EFE4]">
      <Header locale="ja" pathname="/subscribe" contactLabel="お問い合わせ" />
      <div className="min-h-screen flex items-center justify-center px-8">
        <div className="text-center space-y-8 max-w-md">
          <div className="text-6xl">✿</div>
          <div className="space-y-3">
            <h1 className="text-[clamp(28px,4vw,40px)] font-light text-[#2C2416]">
              ご登録ありがとうございます
            </h1>
            <p className="text-[14px] text-[#8C7B6B] leading-relaxed">
              来月から、コーヒーとお花をお届けします。<br />
              確認メールをご確認ください。
            </p>
          </div>
          <div className="bg-[#EDE5D8] rounded-sm p-6 text-left space-y-3">
            <p className="text-[12px] font-mono tracking-[0.1em] text-[#8C7B6B] uppercase">次のステップ</p>
            <ul className="space-y-2 text-[13px] text-[#2C2416]">
              <li>✓ 登録確認メールをご確認ください</li>
              <li>✓ 初回発送は来月からです</li>
              <li>✓ 発送前にお知らせメールをお送りします</li>
            </ul>
          </div>
          <Link
            href="/"
            className="inline-block bg-[#2C2416] text-white font-mono text-[11px] tracking-[0.15em] uppercase px-8 py-3 hover:bg-[#1a1410] transition-colors rounded-sm"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
