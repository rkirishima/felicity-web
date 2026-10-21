import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serviceClient } from '@/app/lib/wholesale-server';
import { verifyApprovalToken } from '@/lib/wholesale-application';
import { approveApplication } from './actions';

// Telegram の「承認する」リンクから開く画面。開いただけでは何も変わらず、
// ボタンを押して初めて承認される（リンクプレビューの GET で承認されないように）。
export const metadata: Metadata = {
  title: '業販お申し込みの承認',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: 'no-referrer',
};

export const dynamic = 'force-dynamic';

const jst = (iso: string) =>
  new Date(iso).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', dateStyle: 'medium', timeStyle: 'short' });

export default async function WholesaleApprovePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; t?: string }>;
}) {
  const { code, t } = await searchParams;
  // 署名が合わなければ、ページ自体が無いのと同じ扱いにする。
  if (!code || !t || !verifyApprovalToken(code, t)) notFound();

  const { data: a } = await serviceClient()
    .from('wholesale_accounts')
    .select('code, company, store_name, contact_name, email, phone, postal_code, prefecture, city, street_address, building, application_note, applied_at, approved_at, active')
    .eq('code', code)
    .maybeSingle();
  if (!a) notFound();

  const rows: [string, string | null][] = [
    ['店舗名', a.store_name],
    ['会社名', a.company],
    ['ご担当者', a.contact_name],
    ['メール', a.email],
    ['電話', a.phone],
    ['住所', `〒${a.postal_code ?? ''} ${a.prefecture ?? ''}${a.city ?? ''}${a.street_address ?? ''}${a.building ? ` ${a.building}` : ''}`],
    ['ご要望', a.application_note],
    ['申し込み日時', a.applied_at ? jst(a.applied_at) : null],
    ['取引先コード', a.code],
  ];

  return (
    <main className="min-h-screen px-6 py-20">
      <div className="w-full max-w-xl mx-auto">
        <p className="text-[13px] text-[#8C7B6B] font-mono tracking-[0.18em] uppercase mb-3 text-center">Wholesale</p>
        <h1 className="text-[24px] text-[#2C2416] font-light tracking-[0.06em] text-center">業販お申し込みの承認</h1>

        <dl className="mt-10 bg-[#EDE5D8] p-6 sm:p-8 rounded-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[110px_minmax(0,1fr)] gap-4 py-2 border-b border-[#DDD5C5] last:border-0">
              <dt className="text-[12px] text-[#8C7B6B] font-mono tracking-[0.06em]">{label}</dt>
              <dd className="text-[14px] text-[#2C2416] font-light whitespace-pre-wrap break-words">{value || '—'}</dd>
            </div>
          ))}
        </dl>

        {a.approved_at ? (
          <div className="mt-8 text-center">
            <p className="text-[15px] text-[#2E4A3E]">
              {a.active ? '承認済みです。' : '承認済みですが、現在は停止中です。'}
              <span className="text-[#8C7B6B] text-[13px]">（{jst(a.approved_at)}）</span>
            </p>
            <p className="mt-2 text-[13px] text-[#8C7B6B] font-light">
              ご利用開始のメールは {a.email} 宛に送信しました。
            </p>
          </div>
        ) : (
          <form action={approveApplication} className="mt-8 space-y-4 text-center">
            <input type="hidden" name="code" value={a.code} />
            <input type="hidden" name="t" value={t} />
            <p className="text-[13px] text-[#8C7B6B] font-light leading-relaxed">
              承認すると、先方は卸価格を見て注文できるようになり、
              <br />
              「ご利用を開始いただけます」のメールが届きます。
              <br />
              条件は標準（価格表どおり・最低3kg・宅配便）です。
            </p>
            <button
              type="submit"
              className="w-full bg-[#7AAFC4] text-[#2C2416] font-mono text-[13px] tracking-[0.08em] uppercase px-8 py-4 rounded-sm hover:bg-[#6A9DB3] transition-colors"
            >
              承認する
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
