'use server';

import { refresh } from 'next/cache';
import { serviceClient } from '@/app/lib/wholesale-server';
import { sendApplicationApprovedEmail, verifyApprovalToken } from '@/lib/wholesale-application';

// 承認ボタン。画面を開けた人＝署名付きリンクを持っている人だが、
// アクションは単独でも呼べるので、ここでも署名を確かめ直す。
export async function approveApplication(formData: FormData): Promise<void> {
  const code = String(formData.get('code') ?? '');
  const token = String(formData.get('t') ?? '');
  if (!code || !token || !verifyApprovalToken(code, token)) return;

  const supabase = serviceClient();
  // approved_at IS NULL を条件に入れて、二度押しでメールが2通飛ばないようにする。
  const { data } = await supabase
    .from('wholesale_accounts')
    .update({ active: true, approved_at: new Date().toISOString() })
    .eq('code', code)
    .is('approved_at', null)
    .select('email, contact_name, store_name, company')
    .maybeSingle();

  if (data) {
    await sendApplicationApprovedEmail({
      email: data.email,
      contactName: data.contact_name ?? '',
      storeName: data.store_name ?? data.company,
    });
  }
  refresh();
}
