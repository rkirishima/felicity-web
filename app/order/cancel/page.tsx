import { createClient } from '@supabase/supabase-js';
import { Header } from '@/app/components/Header';
import { verifyCancelToken } from '@/lib/order-cancel';
import { cancelBankTransferOrder } from './actions';

export const metadata = {
  title: 'ご注文のキャンセル | FELICITY',
  robots: { index: false },
};

type Order = { id: string; customer_name: string; items: { name: string; quantity?: number; qty?: number }[]; amount: number; status: string };

export default async function OrderCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; t?: string; done?: string }>;
}) {
  const { id, t, done } = await searchParams;

  let order: Order | null = null;
  if (id && t && verifyCancelToken(id, t)) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
      .from('orders')
      .select('id, customer_name, items, amount, status')
      .eq('id', id)
      .maybeSingle();
    order = data;
  }

  let body: React.ReactNode;
  if (!order) {
    body = <p className="text-[14px] text-[#8C7B6B]">リンクが無効です。お手数ですが info@felicity.cafe までご連絡ください。</p>;
  } else if (order.status === 'cancelled') {
    body = (
      <p className="text-[14px] text-[#2C2416]">
        {done === '1' ? 'ご注文をキャンセルしました。' : 'このご注文はキャンセル済みです。'}
        <br />またのご利用をお待ちしております。
      </p>
    );
  } else if (order.status !== 'pending_bank_transfer') {
    body = (
      <p className="text-[14px] text-[#8C7B6B]">
        お振込み確認済みのため、このページからはキャンセルできません。<br />
        info@felicity.cafe までご連絡ください。
      </p>
    );
  } else {
    body = (
      <div className="space-y-6">
        <div className="bg-[#EDE5D8] rounded-sm p-6 text-left text-[14px] text-[#2C2416] space-y-2">
          <p className="text-[12px] text-[#8C7B6B] break-all">注文番号 {order.id}</p>
          <ul className="space-y-1">
            {order.items.map((i, idx) => (
              <li key={idx}>{i.name} × {i.quantity ?? i.qty ?? 1}</li>
            ))}
          </ul>
          <p className="font-medium">合計 ¥{order.amount.toLocaleString('ja-JP')}</p>
        </div>
        <p className="text-[14px] text-[#8C7B6B]">このご注文をキャンセルしますか？</p>
        <form action={cancelBankTransferOrder}>
          <input type="hidden" name="id" value={order.id} />
          <input type="hidden" name="t" value={t} />
          <button type="submit" className="px-8 py-3 bg-[#2C2416] text-white text-[14px] rounded-sm">
            注文をキャンセルする
          </button>
        </form>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4EFE4]">
      <Header locale="ja" pathname="/order/cancel" contactLabel="お問い合わせ" />
      <div className="min-h-screen flex items-center justify-center px-8">
        <div className="text-center space-y-8 max-w-md w-full">
          <h1 className="text-[clamp(24px,4vw,32px)] font-light text-[#2C2416]">ご注文のキャンセル</h1>
          {body}
        </div>
      </div>
    </main>
  );
}
