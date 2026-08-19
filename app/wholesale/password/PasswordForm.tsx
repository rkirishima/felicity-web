'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const MIN_LENGTH = 10;

const label = 'block text-[12px] text-[#8C7B6B] font-mono tracking-[0.08em] uppercase mb-2';
const input =
  'w-full bg-[#F4EFE4] border border-[#DDD5C5] px-4 py-3 text-[15px] text-[#2C2416] rounded-sm focus:outline-none focus:border-[#8C7B6B]';

export function PasswordForm({ company, firstTime }: { company: string; firstTime: boolean }) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('新しいパスワードが一致しません。');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/wholesale/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'パスワードを変更できませんでした。');
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
          <p className="text-[13px] text-[#8C7B6B] font-mono tracking-[0.18em] uppercase mb-3">{company}</p>
          <h1 className="text-[24px] text-[#2C2416] font-light tracking-[0.08em]">パスワードの変更</h1>
          <p className="mt-3 text-[13px] text-[#8C7B6B] font-light leading-relaxed">
            {firstTime
              ? '当社が発行した初期パスワードを、御社でお決めいただいたものに変更してください。'
              : '新しいパスワードを設定してください。'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#EDE5D8] p-8 rounded-sm space-y-5">
          <div>
            <label className={label} htmlFor="currentPassword">
              {firstTime ? '初期パスワード' : '現在のパスワード'}
            </label>
            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className={input}
            />
          </div>

          <div>
            <label className={label} htmlFor="newPassword">新しいパスワード</label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={MIN_LENGTH}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className={input}
            />
            <p className="mt-2 text-[11px] text-[#8C7B6B] font-light">{MIN_LENGTH}文字以上</p>
          </div>

          <div>
            <label className={label} htmlFor="confirmPassword">新しいパスワード（確認）</label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={MIN_LENGTH}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={input}
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
            {submitting ? '変更中...' : 'パスワードを変更する'}
          </button>
        </form>
      </div>
    </main>
  );
}
