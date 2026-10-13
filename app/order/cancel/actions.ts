'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { verifyCancelToken } from '@/lib/order-cancel';
import { notifyOrderCancelToTelegram } from '@/lib/telegram';

export async function cancelBankTransferOrder(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  const t = String(formData.get('t') ?? '');
  if (!id || !t || !verifyCancelToken(id, t)) redirect('/order/cancel');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  // 入金前の注文のみ取り消せる
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('status', 'pending_bank_transfer')
    .select('id, customer_name, amount')
    .maybeSingle();
  if (error) console.error('[order-cancel] update failed:', error);

  if (data) {
    await notifyOrderCancelToTelegram({ orderId: data.id, customerName: data.customer_name, amount: data.amount });
  }

  const q = new URLSearchParams({ id, t, done: data ? '1' : '0' });
  redirect(`/order/cancel?${q}`);
}
