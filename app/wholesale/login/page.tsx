'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function WholesaleLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/wholesale/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'ログインできませんでした。');
        return;
      }
      router.push('/wholesale');
      router.refresh();
    } catch {
      setError('通信エラーが発生しました。時間をおいてお試しください。');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <p className="text-[13px] text-[#8C7B6B] font-mono tracking-[0.18em] uppercase mb-3">
            Felicity Coffee Roasters
          </p>
          <h1 className="text-[24px] text-[#2C2416] font-light tracking-[0.08em]">業販ログイン</h1>
          <p className="mt-3 text-[13px] text-[#8C7B6B] font-light">
            取引先さま専用ページです。
            <br />
            ご登録のメールアドレスでログインしてください。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#EDE5D8] p-8 rounded-sm space-y-5">
          <div>
            <label htmlFor="email" className="block text-[12px] text-[#8C7B6B] font-mono tracking-[0.08em] uppercase mb-2">
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#F4EFE4] border border-[#DDD5C5] px-4 py-3 text-[15px] text-[#2C2416] rounded-sm focus:outline-none focus:border-[#8C7B6B]"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-[12px] text-[#8C7B6B] font-mono tracking-[0.08em] uppercase mb-2">
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#F4EFE4] border border-[#DDD5C5] px-4 py-3 text-[15px] text-[#2C2416] rounded-sm focus:outline-none focus:border-[#8C7B6B]"
            />
          </div>

          {error && (
            <p role="alert" className="text-[13px] text-[#A34A3A] font-light">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#7AAFC4] text-[#2C2416] font-mono text-[13px] tracking-[0.08em] uppercase px-8 py-3 rounded-sm hover:bg-[#6A9DB3] transition-colors disabled:opacity-50"
          >
            {submitting ? '確認中...' : 'ログイン'}
          </button>
        </form>

        <p className="mt-8 text-center text-[12px] text-[#8C7B6B] font-light leading-relaxed">
          初回ログイン時にパスワードの変更をお願いしております。
          <br />
          アカウントの発行・パスワードの再設定は{' '}
          <a
            href="mailto:info@felicity.cafe?subject=%E6%A5%AD%E8%B2%A9%E3%82%A2%E3%82%AB%E3%82%A6%E3%83%B3%E3%83%88%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6"
            className="text-[#2C2416] underline underline-offset-2 hover:text-[#7AAFC4] transition-colors"
          >
            info@felicity.cafe
          </a>{' '}
          までご連絡ください。
        </p>
      </div>
    </main>
  );
}
