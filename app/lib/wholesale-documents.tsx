// 業販の納品書・領収書 (PDF)。
//
// 業販は株式会社FELICITY が売っているので、発行元もそこ。適格請求書として
// 通るよう、登録番号・税率ごとの対価と消費税額・軽減税率対象の印を載せる。
// 金額は注文時に保存した値（wholesale_orders）をそのまま使い、ここで計算し直さない。

import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';
import path from 'node:path';

export const ISSUER = {
  name: '株式会社FELICITY',
  brand: 'FELICITY COFFEE ROASTERS',
  postal: '〒240-0115',
  address: '神奈川県三浦郡葉山町上山口2432-3',
  tel: 'TEL 080-8758-4368',
  email: 'info@felicity.cafe',
  registrationNumber: 'T5021001081493',
} as const;

export type DocOrder = {
  id: string;
  company: string;
  contact_name: string | null;
  created_at: string;
  paid_at: string | null;
  payment_method: string;
  items: { name: string; nameJa?: string; kg: number; unitPrice: number; amount: number }[];
  subtotal: number;
  shipping: number;
  tax_goods: number;
  tax_shipping: number;
  amount: number;
};

let fontRegistered = false;
function ensureFont() {
  if (fontRegistered) return;
  Font.register({
    family: 'NotoSansJP',
    src: path.join(process.cwd(), 'public/fonts/NotoSansJP-Regular.ttf'),
  });
  // 日本語は語の途中で改行してよいので、英語用のハイフネーションを無効にする。
  Font.registerHyphenationCallback((word) => [word]);
  fontRegistered = true;
}

const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`;
const jstDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: 'long', day: 'numeric' });

const s = StyleSheet.create({
  page: { fontFamily: 'NotoSansJP', fontSize: 10, color: '#2C2416', padding: 48 },
  title: { fontSize: 20, textAlign: 'center', letterSpacing: 8, marginBottom: 28 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  addressee: { fontSize: 14, borderBottomWidth: 1, borderBottomColor: '#2C2416', paddingBottom: 4, width: 280 },
  meta: { fontSize: 9, color: '#555', lineHeight: 1.6, textAlign: 'right' },
  amountBox: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#2C2416',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: { fontSize: 11 },
  amountValue: { fontSize: 20 },
  note: { fontSize: 10, marginTop: 8 },
  table: { marginTop: 24, borderTopWidth: 1, borderTopColor: '#2C2416' },
  th: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#999', paddingVertical: 5, fontSize: 9, color: '#555' },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#ccc', paddingVertical: 6 },
  cName: { flex: 1 },
  cKg: { width: 56, textAlign: 'right' },
  cUnit: { width: 76, textAlign: 'right' },
  cAmt: { width: 84, textAlign: 'right' },
  totals: { marginTop: 14, marginLeft: 'auto', width: 250 },
  tRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2, fontSize: 9.5 },
  tTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6, marginTop: 4, borderTopWidth: 1, borderTopColor: '#2C2416', fontSize: 11 },
  footnote: { marginTop: 10, fontSize: 8.5, color: '#555' },
  issuer: { position: 'absolute', bottom: 48, right: 48, fontSize: 9, lineHeight: 1.6, textAlign: 'right' },
});

function Issuer() {
  return (
    <View style={s.issuer}>
      <Text style={{ fontSize: 11 }}>{ISSUER.name}</Text>
      <Text>{ISSUER.brand}</Text>
      <Text>{ISSUER.postal} {ISSUER.address}</Text>
      <Text>{ISSUER.tel}　{ISSUER.email}</Text>
      <Text>登録番号 {ISSUER.registrationNumber}</Text>
    </View>
  );
}

function LinesAndTotals({ order }: { order: DocOrder }) {
  const goodsTotal = order.subtotal + order.tax_goods;
  const shippingTotal = order.shipping + order.tax_shipping;
  return (
    <>
      <View style={s.table}>
        <View style={s.th}>
          <Text style={s.cName}>品名</Text>
          <Text style={s.cKg}>数量</Text>
          <Text style={s.cUnit}>単価（税抜）</Text>
          <Text style={s.cAmt}>金額（税抜）</Text>
        </View>
        {order.items.map((it, i) => (
          <View style={s.tr} key={i}>
            <Text style={s.cName}>{it.nameJa ? `${it.nameJa}（${it.name}）` : it.name} ※</Text>
            <Text style={s.cKg}>{it.kg} kg</Text>
            <Text style={s.cUnit}>{yen(it.unitPrice)}</Text>
            <Text style={s.cAmt}>{yen(it.amount)}</Text>
          </View>
        ))}
        {order.shipping > 0 && (
          <View style={s.tr}>
            <Text style={s.cName}>送料</Text>
            <Text style={s.cKg}>1</Text>
            <Text style={s.cUnit}>{yen(order.shipping)}</Text>
            <Text style={s.cAmt}>{yen(order.shipping)}</Text>
          </View>
        )}
      </View>

      <View style={s.totals}>
        <View style={s.tRow}><Text>8%対象（税抜）</Text><Text>{yen(order.subtotal)}</Text></View>
        <View style={s.tRow}><Text>　消費税（8%）</Text><Text>{yen(order.tax_goods)}</Text></View>
        {order.shipping > 0 && (
          <>
            <View style={s.tRow}><Text>10%対象（税抜）</Text><Text>{yen(order.shipping)}</Text></View>
            <View style={s.tRow}><Text>　消費税（10%）</Text><Text>{yen(order.tax_shipping)}</Text></View>
          </>
        )}
        <View style={s.tTotal}><Text>合計（税込）</Text><Text>{yen(order.amount)}</Text></View>
        <View style={[s.tRow, { marginTop: 4, color: '#555' }]}>
          <Text>内訳：8%対象 {yen(goodsTotal)}{order.shipping > 0 ? `／10%対象 ${yen(shippingTotal)}` : ''}</Text>
        </View>
      </View>
      <Text style={s.footnote}>※は軽減税率（8%）対象品目です。</Text>
    </>
  );
}

function Addressee({ order }: { order: DocOrder }) {
  return <Text style={s.addressee}>{order.company} 御中</Text>;
}

export function DeliveryNote({ order }: { order: DocOrder }) {
  return (
    <Document title={`納品書 ${order.id}`} author={ISSUER.name}>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>納品書</Text>
        <View style={s.row}>
          <Addressee order={order} />
          <View>
            <Text style={s.meta}>注文番号 {order.id}</Text>
            <Text style={s.meta}>注文日 {jstDate(order.created_at)}</Text>
          </View>
        </View>
        <Text style={s.note}>下記のとおり納品いたします。</Text>
        <LinesAndTotals order={order} />
        <Issuer />
      </Page>
    </Document>
  );
}

export function Receipt({ order }: { order: DocOrder }) {
  const paidAt = order.paid_at ?? order.created_at;
  const method = order.payment_method === 'card' ? 'クレジットカード' : '銀行振込';
  return (
    <Document title={`領収書 ${order.id}`} author={ISSUER.name}>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>領収書</Text>
        <View style={s.row}>
          <Addressee order={order} />
          <View>
            <Text style={s.meta}>No. {order.id}</Text>
            <Text style={s.meta}>発行日 {jstDate(paidAt)}</Text>
          </View>
        </View>

        <View style={s.amountBox}>
          <Text style={s.amountLabel}>金額</Text>
          <Text style={s.amountValue}>{yen(order.amount)} -</Text>
        </View>
        <Text style={s.note}>但し　コーヒー豆代として（{method}にて）</Text>
        <Text style={[s.note, { fontSize: 9, color: '#555' }]}>上記正に領収いたしました。</Text>

        <LinesAndTotals order={order} />
        <Issuer />
      </Page>
    </Document>
  );
}

export async function renderWholesaleDoc(kind: 'receipt' | 'delivery-note', order: DocOrder): Promise<Buffer> {
  ensureFont();
  const doc = kind === 'receipt' ? <Receipt order={order} /> : <DeliveryNote order={order} />;
  return renderToBuffer(doc);
}
