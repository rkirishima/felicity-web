import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { yen } from '@/app/lib/wholesale';
import { currentAccount, serviceClient } from '@/app/lib/wholesale-server';
import { eyebrow, panel } from '../sections';

export const metadata: Metadata = {
  title: '注文履歴 | FELICITY COFFEE ROASTERS',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

// セッションと取引先ごとの注文を読むので、キャッシュしない。
export const dynamic = 'force-dynamic';

type OrderRow = {
  id: string;
  created_at: string;
  paid_at: string | null;
  status: string;
  payment_method: string;
  total_kg: number;
  amount: number;
  items: { name: string; nameJa?: string; kg: number }[];
};

const STATUS: Record<string, { label: string; tone: string }> = {
  paid: { label: '支払い済み', tone: 'text-[#2E4A3E]' },
  pending_bank_transfer: { label: 'ご入金待ち', tone: 'text-[#B8860B]' },
  pending_payment: { label: 'カード決済未完了', tone: 'text-[#A34A3A]' },
};

const jstDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: 'numeric', day: 'numeric' });

export default async function WholesaleOrdersPage() {
  const supabase = serviceClient();
  const account = await currentAccount(supabase);
  if (!account) redirect('/wholesale/login');

  const { data } = await supabase
    .from('wholesale_orders')
    .select('id, created_at, paid_at, status, payment_method, total_kg, amount, items')
    .eq('account_code', account.code)
    .order('created_at', { ascending: false });

  // カード決済を途中でやめた注文は、実際には成立していないので一覧に出さない。
  const orders = ((data ?? []) as OrderRow[]).filter((o) => o.status !== 'pending_payment');

  return (
    <div className="pb-24">
      <header className="border-b border-[#DDD5C5]">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between gap-6">
          <div className="min-w-0">
            <p className={`${eyebrow} whitespace-nowrap`}>Wholesale</p>
            <p className="mt-1 text-[15px] text-[#2C2416] font-light truncate">{account.company}</p>
          </div>
          <Link
            href="/wholesale/order"
            className="text-[11px] text-[#8C7B6B] font-mono tracking-[0.08em] uppercase hover:text-[#2C2416] transition-colors flex-shrink-0"
          >
            ← 注文ページへ
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-14">
        <p className={eyebrow}>Order History</p>
        <h1 className="mt-3 text-[clamp(24px,3.4vw,32px)] font-light text-[#2C2416] tracking-tight">注文履歴</h1>
        <p className="mt-4 text-[13px] text-[#8C7B6B] font-light leading-relaxed">
          納品書はいつでも、領収書はお支払いの確認後にダウンロードいただけます。
          金額はすべて税込です。
        </p>

        {orders.length === 0 ? (
          <div className={`${panel} mt-10 p-8 text-[14px] text-[#8C7B6B] font-light`}>
            まだご注文はありません。
          </div>
        ) : (
          <div className="mt-10 space-y-px">
            {orders.map((o) => {
              const st = STATUS[o.status] ?? { label: o.status, tone: 'text-[#8C7B6B]' };
              return (
                <article key={o.id} className={`${panel} p-6`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                    <div>
                      <p className="text-[15px] text-[#2C2416] font-light">{jstDate(o.created_at)}</p>
                      <p className="mt-0.5 text-[11px] text-[#8C7B6B] font-mono">{o.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[17px] text-[#2C2416] font-mono">{yen(o.amount)}</p>
                      <p className={`text-[12px] font-light ${st.tone}`}>
                        {st.label}
                        {o.status === 'paid' && o.paid_at ? `（${jstDate(o.paid_at)}）` : ''}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-[13px] text-[#2C2416] font-light leading-relaxed">
                    {o.items.map((it) => `${it.nameJa ?? it.name} ${it.kg}kg`).join('、')}
                    <span className="text-[#8C7B6B]">　計 {o.total_kg}kg</span>
                  </p>

                  <div className="mt-5 pt-4 border-t border-[#DDD5C5] flex flex-wrap gap-x-6 gap-y-2 text-[12px] font-mono tracking-[0.06em]">
                    <a
                      href={`/api/wholesale/orders/${encodeURIComponent(o.id)}/delivery-note`}
                      className="text-[#2C2416] underline underline-offset-2 hover:text-[#7AAFC4] transition-colors"
                    >
                      納品書（PDF）
                    </a>
                    {o.status === 'paid' ? (
                      <a
                        href={`/api/wholesale/orders/${encodeURIComponent(o.id)}/receipt`}
                        className="text-[#2C2416] underline underline-offset-2 hover:text-[#7AAFC4] transition-colors"
                      >
                        領収書（PDF）
                      </a>
                    ) : (
                      <span className="text-[#8C7B6B]">領収書はご入金確認後に発行されます</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
