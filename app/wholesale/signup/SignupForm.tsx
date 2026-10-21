'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PREFECTURES } from '@/lib/prefectures';

const MIN_LENGTH = 10;

const label = 'block text-[12px] text-[#8C7B6B] font-mono tracking-[0.08em] uppercase mb-2';
const input =
  'w-full bg-[#F4EFE4] border border-[#DDD5C5] px-4 py-3 text-[15px] text-[#2C2416] rounded-sm focus:outline-none focus:border-[#8C7B6B]';
const hint = 'mt-2 text-[11px] text-[#8C7B6B] font-light';

const EMPTY = {
  company: '',
  storeName: '',
  contactName: '',
  email: '',
  phone: '',
  postalCode: '',
  prefecture: '',
  city: '',
  streetAddress: '',
  building: '',
  note: '',
  password: '',
  confirmPassword: '',
  website: '', // ボット避け。画面には出さない。
};

export function SignupForm() {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('パスワードが一致しません。');
      return;
    }
    if (!/^\d{3}-?\d{4}$/.test(form.postalCode.trim())) {
      setError('郵便番号は 123-4567 の形式で入力してください。');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const { confirmPassword: _unused, ...payload } = form;
      const res = await fetch('/api/wholesale/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'お申し込みを送信できませんでした。');
        return;
      }
      setDone(true);
      window.scrollTo({ top: 0 });
    } catch {
      setError('通信エラーが発生しました。時間をおいてお試しください。');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-md text-center">
          <p className="text-[13px] text-[#8C7B6B] font-mono tracking-[0.18em] uppercase mb-3">Thank you</p>
          <h1 className="text-[24px] text-[#2C2416] font-light tracking-[0.06em]">お申し込みを受け付けました</h1>
          <p className="mt-6 text-[14px] text-[#2C2416] font-light leading-[1.9]">
            内容を確認のうえ、ご利用いただけるようになりましたら
            <br />
            {form.email} 宛にお知らせいたします。
            <br />
            通常1〜2営業日ほどお時間をいただいております。
          </p>
          <p className="mt-6 text-[13px] text-[#8C7B6B] font-light leading-relaxed">
            受付のメールが届かない場合は、迷惑メールフォルダをご確認いただくか、
            info@felicity.cafe までご連絡ください。
          </p>
          <Link
            href="/wholesale"
            className="mt-10 inline-block text-[12px] text-[#8C7B6B] font-mono tracking-[0.08em] uppercase hover:text-[#2C2416] transition-colors"
          >
            ← 業販のご案内に戻る
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-20">
      <div className="w-full max-w-xl mx-auto">
        <div className="mb-10 text-center">
          <p className="text-[13px] text-[#8C7B6B] font-mono tracking-[0.18em] uppercase mb-3">Felicity Coffee Roasters</p>
          <h1 className="text-[24px] text-[#2C2416] font-light tracking-[0.08em]">業販のお申し込み</h1>
          <p className="mt-4 text-[13px] text-[#8C7B6B] font-light leading-relaxed">
            カフェ・レストラン・ホテル・オフィスなど、事業者さま向けのお申し込みです。
            <br />
            内容を確認のうえ、ご利用開始をメールでお知らせします。卸価格はご利用開始後にご確認いただけます。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#EDE5D8] p-6 sm:p-8 rounded-sm space-y-5">
          <div>
            <label className={label} htmlFor="storeName">店舗名</label>
            <input id="storeName" value={form.storeName} onChange={set('storeName')} required autoComplete="organization" className={input} placeholder="例：FELICITY CAFE" />
          </div>
          <div>
            <label className={label} htmlFor="company">会社名</label>
            <input id="company" value={form.company} onChange={set('company')} required className={input} placeholder="例：株式会社〇〇（個人事業の方は屋号またはお名前）" />
            <p className={hint}>納品書・領収書の宛名になります。</p>
          </div>
          <div>
            <label className={label} htmlFor="contactName">ご担当者名</label>
            <input id="contactName" value={form.contactName} onChange={set('contactName')} required autoComplete="name" className={input} />
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={label} htmlFor="email">メールアドレス</label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                value={form.email}
                onChange={set('email')}
                required
                className={input}
              />
              <p className={hint}>ログインIDになります。</p>
            </div>
            <div>
              <label className={label} htmlFor="phone">電話番号</label>
              <input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} required className={input} />
            </div>
          </div>

          <div className="pt-2 border-t border-[#DDD5C5]" />
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={label} htmlFor="postalCode">郵便番号</label>
              <input id="postalCode" inputMode="numeric" autoComplete="postal-code" value={form.postalCode} onChange={set('postalCode')} required placeholder="123-4567" className={input} />
            </div>
            <div>
              <label className={label} htmlFor="prefecture">都道府県</label>
              <select id="prefecture" value={form.prefecture} onChange={set('prefecture')} required autoComplete="address-level1" className={input}>
                <option value="">選択してください</option>
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={label} htmlFor="city">市区町村</label>
            <input id="city" value={form.city} onChange={set('city')} required autoComplete="address-level2" className={input} />
          </div>
          <div>
            <label className={label} htmlFor="streetAddress">番地</label>
            <input id="streetAddress" value={form.streetAddress} onChange={set('streetAddress')} required autoComplete="address-line1" className={input} />
          </div>
          <div>
            <label className={label} htmlFor="building">建物名・部屋番号（任意）</label>
            <input id="building" value={form.building} onChange={set('building')} autoComplete="address-line2" className={input} />
            <p className={hint}>豆のお届け先として、ご注文時にあらかじめ入力されます。</p>
          </div>

          <div className="pt-2 border-t border-[#DDD5C5]" />
          <div>
            <label className={label} htmlFor="note">ご希望の豆・月あたりのご使用量など（任意）</label>
            <textarea id="note" rows={4} value={form.note} onChange={set('note')} className={input} placeholder="例：エスプレッソ用に月5kgほど。サンプルを希望します。" />
          </div>

          <div className="pt-2 border-t border-[#DDD5C5]" />
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={label} htmlFor="password">パスワード</label>
              <input id="password" type="password" autoComplete="new-password" minLength={MIN_LENGTH} value={form.password} onChange={set('password')} required className={input} />
              <p className={hint}>{MIN_LENGTH}文字以上</p>
            </div>
            <div>
              <label className={label} htmlFor="confirmPassword">パスワード（確認）</label>
              <input id="confirmPassword" type="password" autoComplete="new-password" minLength={MIN_LENGTH} value={form.confirmPassword} onChange={set('confirmPassword')} required className={input} />
            </div>
          </div>

          {/* ボット避け。人には見えないので、埋まっていれば機械の送信。 */}
          <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
            <label htmlFor="website">Website</label>
            <input id="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
          </div>

          {error && (
            <p role="alert" className="text-[13px] text-[#A34A3A] font-light">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#7AAFC4] text-[#2C2416] font-mono text-[13px] tracking-[0.08em] uppercase px-8 py-4 rounded-sm hover:bg-[#6A9DB3] transition-colors disabled:opacity-50"
          >
            {submitting ? '送信中...' : 'この内容で申し込む'}
          </button>
        </form>

        <p className="mt-8 text-center text-[12px] text-[#8C7B6B] font-light leading-relaxed">
          すでにアカウントをお持ちの方は{' '}
          <Link href="/wholesale/login" className="text-[#2C2416] underline underline-offset-2 hover:text-[#7AAFC4] transition-colors">
            ログイン
          </Link>
        </p>
      </div>
    </main>
  );
}
