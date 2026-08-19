// Telegram order notifications for felicity.cafe EC.
//
// Replaces the old OpenClaw email-monitor path (shut down 2026-06-08): order
// notifications are now sent directly from the API routes at order-creation
// time, so they no longer depend on the Mac mini or Gmail polling.
//
// Bot: @felicityorder_bot → group "felicity-orders".
// Env: TELEGRAM_ORDERS_BOT_TOKEN, TELEGRAM_ORDERS_CHAT_ID.

import { GrindOption, grindNote } from '@/app/lib/grind';

type OrderItem = { name: string; quantity?: number; qty?: number; grind?: GrindOption };

export type OrderNotification = {
  orderId: string;
  paymentMethod: string; // 'bank_transfer' | 'card' | ...
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  items?: OrderItem[];
  amount: number;
};

// Sends a new-order notification to the Telegram orders group.
// Never throws — a notification failure must not break order processing.
export async function notifyOrderToTelegram(order: OrderNotification): Promise<void> {
  const token = process.env.TELEGRAM_ORDERS_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ORDERS_CHAT_ID;
  if (!token || !chatId) {
    console.warn('[telegram] TELEGRAM_ORDERS_BOT_TOKEN / TELEGRAM_ORDERS_CHAT_ID not set — skipping order notification');
    return;
  }

  const methodLabel =
    order.paymentMethod === 'bank_transfer' ? '🏦 銀行振込' :
    order.paymentMethod === 'card' ? '💳 カード' :
    order.paymentMethod;

  const itemLines =
    (order.items || [])
      .map((it) => `・${it.name}（${grindNote(it.grind)}）×${it.quantity ?? it.qty ?? 1}`)
      .join('\n') || '（明細なし）';

  const lines: string[] = [
    `🛒 新規注文（${methodLabel}）`,
    '',
    `注文番号: ${order.orderId}`,
    `金額: ¥${order.amount.toLocaleString('ja-JP')}`,
    '',
    `名前: ${order.customerName}`,
  ];
  if (order.customerEmail) lines.push(`メール: ${order.customerEmail}`);
  if (order.customerPhone) lines.push(`電話: ${order.customerPhone}`);
  if (order.shippingAddress) lines.push(`住所: ${order.shippingAddress}`);
  lines.push('', '商品:', itemLines);

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: lines.join('\n') }),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error('[telegram] sendMessage failed:', res.status, errBody);
    }
  } catch (err) {
    console.error('[telegram] notify error:', err);
  }
}

// --- Wholesale (業販) ---------------------------------------------------

export type WholesaleNotification = {
  orderId: string;
  paymentMethod: string; // 'bank_transfer' | 'card'
  company: string;
  contactName?: string;
  email?: string;
  phone?: string;
  shippingAddress?: string;
  lines: { name: string; kg: number; unitPrice: number; amount: number }[];
  totalKg: number;
  totalGreenKg: number;
  subtotal: number;
  amount: number;
  note?: string;
};

// Wholesale orders get their own message shape: the roaster needs kilograms and
// the green-bean requirement up front, which the retail item list doesn't carry.
// Never throws — a notification failure must not break order processing.
export async function notifyWholesaleOrderToTelegram(order: WholesaleNotification): Promise<void> {
  const token = process.env.TELEGRAM_ORDERS_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ORDERS_CHAT_ID;
  if (!token || !chatId) {
    console.warn('[telegram] orders bot not configured — skipping wholesale notification');
    return;
  }

  const methodLabel =
    order.paymentMethod === 'bank_transfer' ? '🏦 銀行振込（入金待ち）' :
    order.paymentMethod === 'card' ? '💳 カード決済済み' :
    order.paymentMethod;

  const lines: string[] = [
    `📦 業販注文（${methodLabel}）`,
    '',
    `取引先: ${order.company}`,
    `注文番号: ${order.orderId}`,
    '',
    '焙煎豆:',
    ...order.lines.map((l) => `・${l.name} ${l.kg}kg @¥${l.unitPrice.toLocaleString('ja-JP')} = ¥${l.amount.toLocaleString('ja-JP')}`),
    '',
    `合計: ${order.totalKg}kg（税抜 ¥${order.subtotal.toLocaleString('ja-JP')}／税込 ¥${order.amount.toLocaleString('ja-JP')}）`,
    `必要生豆: 約${order.totalGreenKg}kg`,
  ];

  if (order.contactName) lines.push('', `担当: ${order.contactName}`);
  if (order.email) lines.push(`メール: ${order.email}`);
  if (order.phone) lines.push(`電話: ${order.phone}`);
  if (order.shippingAddress) lines.push(`配送先: ${order.shippingAddress}`);
  if (order.note) lines.push('', `備考: ${order.note}`);

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: lines.join('\n') }),
    });
    if (!res.ok) console.error('[telegram] wholesale notification failed:', await res.text());
  } catch (err) {
    console.error('[telegram] wholesale notification error:', err);
  }
}
