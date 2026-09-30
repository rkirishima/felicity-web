import { NextResponse } from 'next/server';
import { renderWholesaleDoc, type DocOrder } from '@/app/lib/wholesale-documents';
import { currentAccount, serviceClient } from '@/app/lib/wholesale-server';

export const runtime = 'nodejs';

const DOCS = { receipt: '領収書', 'delivery-note': '納品書' } as const;
type DocKind = keyof typeof DOCS;

// 納品書・領収書の PDF。ログイン中の取引先の注文だけを返す（proxy.ts でも
// /api/wholesale/* はセッション必須）。領収書は入金が確認できた注文にだけ出す。
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; doc: string }> },
) {
  const { id, doc } = await params;
  if (!(doc in DOCS)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const kind = doc as DocKind;

  const supabase = serviceClient();
  const account = await currentAccount(supabase);
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: order } = await supabase
    .from('wholesale_orders')
    .select('id, account_code, company, contact_name, created_at, paid_at, payment_method, status, items, subtotal, shipping, tax_goods, tax_shipping, amount')
    .eq('id', id)
    .eq('account_code', account.code)
    .maybeSingle();

  // 他の取引先の注文番号を渡されても、存在しないのと同じ扱いにする。
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (kind === 'receipt' && order.status !== 'paid') {
    return NextResponse.json({ error: '入金の確認後に発行できます。' }, { status: 409 });
  }

  const pdf = await renderWholesaleDoc(kind, order as DocOrder);
  const filename = `${DOCS[kind]}_${order.id}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${order.id}.pdf"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Cache-Control': 'private, no-store',
    },
  });
}
