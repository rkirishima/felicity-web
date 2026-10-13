// 銀行振込注文の受付メール（注文内容・振込先・期限・キャンセルリンク）。
// Never throws — メール失敗で注文処理を止めない。

import { Resend } from 'resend';
import { FELICITY_BANK } from '@/app/lib/bank';
import { GrindOption, withGrindNote } from '@/app/lib/grind';
import { cancelUrl } from '@/lib/order-cancel';

type Item = { name: string; quantity?: number; price?: number; grind?: GrindOption };

function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 注文日から7日後（JST）
function deadlineJST(): string {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000 + 7 * 24 * 60 * 60 * 1000);
  return `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日`;
}

export async function sendBankTransferOrderEmail(order: {
  orderId: string;
  email: string;
  fullName: string;
  shippingAddress: string;
  items: Item[];
  amount: number;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[bank-transfer-email] RESEND_API_KEY not set — skipping');
    return;
  }

  const itemsHtml = order.items
    .map((i) => `<li>${esc(withGrindNote(i.name, i.grind))} × ${esc(i.quantity ?? 1)}</li>`)
    .join('');
  const row = (label: string, value: string) =>
    `<tr><td style="padding: 4px 12px 4px 0; color: #78716c; white-space: nowrap;">${label}</td><td style="padding: 4px 0;">${esc(value)}</td></tr>`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: 'FELICITY <info@felicity.cafe>',
      to: order.email,
      subject: '【FELICITY】ご注文ありがとうございます（お振込みのご案内）',
      html: `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; max-width: 560px; margin: 0 auto; padding: 24px;">
  <div style="border-bottom: 2px solid #1c1917; padding-bottom: 16px; margin-bottom: 24px;">
    <p style="font-size: 13px; letter-spacing: 0.2em; color: #78716c; margin: 0;">FELICITY COFFEE ROASTERS</p>
  </div>

  <p style="font-size: 15px; line-height: 1.7;">${esc(order.fullName)} 様</p>
  <p style="font-size: 15px; line-height: 1.7;">
    この度はご注文いただきありがとうございます。<br>
    以下の内容でご注文を承りました。お振込みの確認後、商品を発送いたします。
  </p>

  <div style="background: #f5f0e8; border-radius: 8px; padding: 20px; margin: 24px 0;">
    <p style="font-size: 12px; color: #78716c; margin: 0 0 4px; letter-spacing: 0.1em;">注文番号</p>
    <p style="font-size: 14px; font-weight: bold; margin: 0; word-break: break-all;">${esc(order.orderId)}</p>
  </div>

  <div style="margin: 24px 0;">
    <p style="font-size: 12px; color: #78716c; margin: 0 0 8px; letter-spacing: 0.1em;">ご注文内容</p>
    <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">${itemsHtml}</ul>
    <p style="font-size: 16px; font-weight: bold; margin: 12px 0 0; color: #1c1917;">お支払い金額: ¥${order.amount.toLocaleString('ja-JP')}</p>
  </div>

  <div style="border: 2px solid #1c1917; border-radius: 8px; padding: 20px; margin: 24px 0;">
    <p style="font-size: 13px; font-weight: bold; margin: 0 0 12px;">お振込先</p>
    <table style="font-size: 14px; border-collapse: collapse;">
      ${row('銀行名', FELICITY_BANK.bankName)}
      ${row('支店名', FELICITY_BANK.branchName)}
      ${row('口座種別', FELICITY_BANK.accountType)}
      ${row('口座番号', FELICITY_BANK.accountNumber)}
      ${row('口座名義', FELICITY_BANK.accountHolder)}
      ${row('金額', `¥${order.amount.toLocaleString('ja-JP')}`)}
      ${row('お振込期限', deadlineJST())}
    </table>
    <p style="font-size: 12px; color: #555; line-height: 1.7; margin: 12px 0 0;">
      ※振込手数料はお客様のご負担となります。<br>
      ※ご注文者様と異なる名義でお振込みの場合は、このメールへの返信でお知らせください。
    </p>
  </div>

  <div style="margin: 24px 0;">
    <p style="font-size: 12px; color: #78716c; margin: 0 0 4px; letter-spacing: 0.1em;">お届け先</p>
    <p style="font-size: 14px; line-height: 1.7; margin: 0;">${esc(order.shippingAddress)}</p>
  </div>

  <div style="margin: 32px 0; text-align: center;">
    <p style="font-size: 13px; color: #555; line-height: 1.7; margin: 0 0 12px;">
      ご注文を取り消す場合は、お振込み前に下記からお手続きください。
    </p>
    <a href="${esc(cancelUrl(order.orderId))}" style="display: inline-block; padding: 10px 24px; border: 1px solid #78716c; border-radius: 6px; color: #44403c; text-decoration: none; font-size: 14px;">注文をキャンセルする</a>
  </div>

  <div style="border-top: 1px solid #e5e5e5; margin-top: 32px; padding-top: 16px;">
    <p style="font-size: 12px; color: #78716c; line-height: 1.7; margin: 0;">
      FELICITY COFFEE ROASTERS<br>
      〒240-0112 神奈川県三浦郡葉山町上山口2432-3<br>
      info@felicity.cafe
    </p>
  </div>
</body>
</html>`,
    });
    if (error) console.error('[bank-transfer-email] Resend error:', JSON.stringify(error));
  } catch (err) {
    console.error('[bank-transfer-email] send failed:', err);
  }
}
