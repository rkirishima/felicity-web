// 業販の自己申し込み（/wholesale/signup）まわりのサーバー側の部品。
//
// - 承認リンクの署名。Telegram に流すリンクは誰が押しても承認画面が開くので、
//   取引先コードだけでは開けないよう HMAC を付ける（lib/order-cancel.ts と同じ形）。
// - 申し込み受付メールと、承認後の「ご利用いただけます」メール。
//   どちらも Never throws — メールの失敗で申し込みや承認を止めない。

import { createHmac, timingSafeEqual } from 'crypto';
import { Resend } from 'resend';
import { DEFAULT_MIN_ORDER_KG, FREE_SHIPPING_THRESHOLD, LEAD_TIME_DAYS, yen } from '@/app/lib/wholesale';

const SITE = 'https://felicity.cafe';

function secret(): string {
  const s = process.env.WHOLESALE_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error('WHOLESALE_SESSION_SECRET not set');
  return s;
}

export function signApprovalToken(code: string): string {
  return createHmac('sha256', secret()).update(`wholesale-approve:${code}`).digest('base64url');
}

export function verifyApprovalToken(code: string, token: string): boolean {
  const expected = Buffer.from(signApprovalToken(code));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function approvalUrl(code: string): string {
  const q = new URLSearchParams({ code, t: signApprovalToken(code) });
  return `${SITE}/wholesale/approve?${q}`;
}

// --- Emails -------------------------------------------------------------

function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const FOOTER = `
  <div style="border-top: 1px solid #DDD5C5; margin-top: 32px; padding-top: 16px; font-size: 13px; color: #8C7B6B;">
    <p style="margin: 0;">FELICITY COFFEE ROASTERS<br>
    〒240-0115 神奈川県三浦郡葉山町上山口2432-3<br>
    info@felicity.cafe / 080-8758-4368</p>
  </div>`;

function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #2C2416; max-width: 560px; margin: 0 auto; padding: 24px; line-height: 1.8;">
  <div style="border-bottom: 2px solid #2C2416; padding-bottom: 16px; margin-bottom: 24px;">
    <p style="font-size: 13px; letter-spacing: 0.2em; color: #8C7B6B; margin: 0;">FELICITY COFFEE ROASTERS</p>
  </div>
  ${body}
  ${FOOTER}
</body>
</html>`;
}

async function send(to: string, subject: string, html: string, tag: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[wholesale-application] RESEND_API_KEY not set — skipping ${tag}`);
    return;
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: 'FELICITY COFFEE ROASTERS <info@felicity.cafe>',
      to,
      replyTo: 'info@felicity.cafe',
      subject,
      html,
    });
    if (error) console.error(`[wholesale-application] ${tag} Resend error:`, JSON.stringify(error));
  } catch (err) {
    console.error(`[wholesale-application] ${tag} send failed:`, err);
  }
}

type Applicant = { email: string; contactName: string; storeName: string };

export async function sendApplicationReceivedEmail(a: Applicant): Promise<void> {
  await send(
    a.email,
    '業販お申し込みを受け付けました｜FELICITY COFFEE ROASTERS',
    layout(`
  <p style="font-size: 15px;">${esc(a.storeName)}<br>${esc(a.contactName)} 様</p>
  <p style="font-size: 15px;">FELICITY COFFEE ROASTERS の業販にお申し込みいただき、ありがとうございます。</p>
  <p style="font-size: 15px;">内容を確認のうえ、ご利用いただけるようになりましたら、このメールアドレス宛にお知らせいたします。
  通常1〜2営業日ほどお時間をいただいております。</p>
  <p style="font-size: 15px;">ご質問やサンプルのご希望がありましたら、このメールにそのままご返信ください。</p>`),
    'received',
  );
}

export async function sendApplicationApprovedEmail(a: Applicant): Promise<void> {
  const points = [
    `最低ロット：1回${DEFAULT_MIN_ORDER_KG}kgから（1銘柄につき1kgから）`,
    `ご注文金額（税抜）${yen(FREE_SHIPPING_THRESHOLD)}以上で送料無料`,
    `ご注文からお届けまで、約${LEAD_TIME_DAYS}日いただいております`,
    'お支払いは銀行振込またはクレジットカード',
  ];
  await send(
    a.email,
    '業販のご利用を開始いただけます｜FELICITY COFFEE ROASTERS',
    layout(`
  <p style="font-size: 15px;">${esc(a.storeName)}<br>${esc(a.contactName)} 様</p>
  <p style="font-size: 15px;">お待たせいたしました。業販のご利用を開始いただけるようになりました。<br>
  お申し込み時のメールアドレスとパスワードで、下記からログインしてください。</p>

  <p style="margin: 24px 0;">
    <a href="${SITE}/wholesale/login" style="display: inline-block; background: #7AAFC4; color: #2C2416; padding: 12px 28px; border-radius: 2px; text-decoration: none; font-size: 14px; letter-spacing: 0.08em;">業販ページにログイン</a>
  </p>

  <h2 style="font-size: 13px; letter-spacing: 0.12em; color: #8C7B6B; margin-top: 32px;">ご注文について</h2>
  <ul style="font-size: 15px; padding-left: 20px;">
    ${points.map((p) => `<li style="margin-bottom: 6px;">${esc(p)}</li>`).join('\n    ')}
  </ul>
  <p style="font-size: 15px;">卸価格はログイン後のページでご確認いただけます。挽き方や個包装のご希望は、ご注文時の備考欄にご記入ください。</p>
  <p style="font-size: 15px;">焙煎度合いのご相談、オリジナルブレンドの開発（3kg〜）、抽出レシピのご提案なども承っております。お気軽にお申し付けください。</p>
  <p style="font-size: 15px;">どうぞよろしくお願いいたします。</p>`),
    'approved',
  );
}
