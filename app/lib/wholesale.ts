// Wholesale (業販) catalogue and pricing.
//
// Separate from the retail catalogue in `products.ts` on purpose: wholesale is
// sold by the kilogram from a green-bean list that does not map 1:1 to the
// retail bag line-up, and the prices must never leak into the public shop.
//
// Everything here is pure data + arithmetic so it can be imported from both the
// client order form and the server-side price recomputation in
// `app/api/wholesale/order`. The server ALWAYS re-runs `quote()` from the
// account record — the browser's numbers are display only.

export type WholesaleGrade = 'economy' | 'standard' | 'premium';

export const GRADE_LABEL: Record<WholesaleGrade, string> = {
  economy: 'ベーシック',
  standard: 'スタンダード',
  premium: 'プレミアム',
};

export type WholesaleBean = {
  slug: string;
  name: string;
  nameJa: string;
  origin: string;
  grade: WholesaleGrade;
  // Green weight needed per 1kg roasted, i.e. 1 / roast yield. Used by the
  // green-bean requirement calculation, not by pricing.
  greenPerKg: number;
};

// The list quoted to trade customers. Order matches the printed price sheet.
export const WHOLESALE_BEANS: WholesaleBean[] = [
  { slug: 'brazil-santos', name: 'BRAZIL Santos No.2', nameJa: 'ブラジル サントス No.2', origin: 'Brazil', grade: 'economy', greenPerKg: 1.19 },
  { slug: 'india-attikan', name: 'INDIA Attikan Estate', nameJa: 'インド アティカン農園', origin: 'India', grade: 'standard', greenPerKg: 1.19 },
  { slug: 'png-baroida', name: 'PAPUA NEW GUINEA Baroida Estate', nameJa: 'パプアニューギニア バロイダ農園', origin: 'Papua New Guinea', grade: 'standard', greenPerKg: 1.19 },
  { slug: 'ethiopia-yirgacheffe-g1', name: 'ETHIOPIA Yirgacheffe G1', nameJa: 'エチオピア イルガチェフェ G1', origin: 'Ethiopia', grade: 'standard', greenPerKg: 1.16 },
  { slug: 'tanzania-ngila', name: 'TANZANIA Ngila Estate', nameJa: 'タンザニア ンギラ農園', origin: 'Tanzania', grade: 'standard', greenPerKg: 1.19 },
  { slug: 'guatemala-la-cupula', name: 'GUATEMALA La Cupula', nameJa: 'グアテマラ ラ・クプラ', origin: 'Guatemala', grade: 'standard', greenPerKg: 1.19 },
  { slug: 'el-salvador-la-fany', name: 'EL SALVADOR La Fany', nameJa: 'エルサルバドル ラ・ファニー', origin: 'El Salvador', grade: 'standard', greenPerKg: 1.21 },
  { slug: 'brazil-santa-alina', name: 'BRAZIL Santa Alina', nameJa: 'ブラジル サンタ・アリーナ', origin: 'Brazil', grade: 'standard', greenPerKg: 1.19 },
  { slug: 'colombia-decaf', name: 'COLOMBIA Decaf', nameJa: 'コロンビア デカフェ', origin: 'Colombia', grade: 'premium', greenPerKg: 1.15 },
];

export function beanBySlug(slug: string): WholesaleBean | undefined {
  return WHOLESALE_BEANS.find((b) => b.slug === slug);
}

// --- Pricing ------------------------------------------------------------

// Volume ladder, applied to the TOTAL kg of the order (not per bean), so a
// customer mixing 4 origins × 3kg still lands in the 10-19kg tier. All prices
// are 税抜 per kilogram; shipping is charged separately (送料別).
export type PriceTier = {
  minKg: number;
  label: string;
  economy: number;
  standard: number;
  premium: number;
};

export const PRICE_TIERS: PriceTier[] = [
  { minKg: 20, label: '20kg以上', economy: 4000, standard: 5000, premium: 6200 },
  { minKg: 10, label: '10〜19kg', economy: 4200, standard: 5400, premium: 6600 },
  { minKg: 5, label: '5〜9kg', economy: 4500, standard: 5800, premium: 7000 },
  { minKg: 1, label: '1〜4kg', economy: 4800, standard: 6200, premium: 7400 },
];

export const MIN_ORDER_KG = 1;

// Per-account pinned pricing, one grade at a time. Used for customers quoted a
// fixed rate before the ladder existed (e.g. JOLT the COFFEE at ¥5,200 /
// ¥6,000) — a pinned grade ignores the ladder, an unpinned one still uses it.
export type SpecialPricing = Partial<Record<WholesaleGrade, number>>;

export function tierForKg(totalKg: number): PriceTier {
  return PRICE_TIERS.find((t) => totalKg >= t.minKg) ?? PRICE_TIERS[PRICE_TIERS.length - 1];
}

export function unitPrice(grade: WholesaleGrade, totalKg: number, special?: SpecialPricing | null): number {
  return special?.[grade] ?? tierForKg(totalKg)[grade];
}

// --- Shipping -----------------------------------------------------------
//
// 送料無料枠は設けない。業販は「送料別」で提示しているため、常に実費を加算する。
//
// 焙煎豆は軽くて嵩張るので、送料は重量ではなく箱のサイズで決まる。1kgでおよそ
// 2.7L あるため、下表は容積から逆算した目安の積載量。
//
// 要確認: 金額はヤマト宅急便の関東→関東を想定した暫定値。実際の運送契約に
// 合わせて調整すること。北海道・沖縄宛はこれより高くなる。
export type ShippingBox = {
  maxKg: number;
  label: string;
  fee: number;
};

export const SHIPPING_BOXES: ShippingBox[] = [
  { maxKg: 2, label: '60サイズ', fee: 1000 },
  { maxKg: 5, label: '80サイズ', fee: 1300 },
  { maxKg: 8, label: '100サイズ', fee: 1600 },
  { maxKg: 12, label: '120サイズ', fee: 1900 },
  { maxKg: 16, label: '140サイズ', fee: 2200 },
];

const LARGEST_BOX = SHIPPING_BOXES[SHIPPING_BOXES.length - 1];

export type ShippingPlan = {
  boxes: ShippingBox[];
  fee: number;
};

// Packs the order into boxes: fill with the largest box while more than one
// boxful remains, then pick the cheapest box the remainder fits in. 18kg
// becomes 140サイズ + 60サイズ rather than being silently squeezed into one.
export function shippingPlan(totalKg: number): ShippingPlan {
  if (totalKg <= 0) return { boxes: [], fee: 0 };

  const boxes: ShippingBox[] = [];
  let remaining = totalKg;

  while (remaining > LARGEST_BOX.maxKg) {
    boxes.push(LARGEST_BOX);
    remaining -= LARGEST_BOX.maxKg;
  }

  const last = SHIPPING_BOXES.find((b) => remaining <= b.maxKg) ?? LARGEST_BOX;
  boxes.push(last);

  return { boxes, fee: boxes.reduce((sum, b) => sum + b.fee, 0) };
}

export function shippingFee(totalKg: number): number {
  return shippingPlan(totalKg).fee;
}

// "140サイズ×1 + 60サイズ×1" — shown on the order form so the customer can see
// where the freight number comes from.
export function shippingLabel(totalKg: number): string {
  const { boxes } = shippingPlan(totalKg);
  if (!boxes.length) return '—';
  const counts = new Map<string, number>();
  for (const b of boxes) counts.set(b.label, (counts.get(b.label) ?? 0) + 1);
  return [...counts.entries()].map(([label, n]) => `${label}×${n}`).join(' + ');
}

// --- Tax ----------------------------------------------------------------
//
// Roasted coffee beans are 飲食料品 → 軽減税率 8%. Shipping is a separate
// service at the standard 10%, so the two are rounded and summed separately —
// a 適格請求書 has to break them out by rate this way.
export const TAX_RATE_GOODS = 0.08;
export const TAX_RATE_SHIPPING = 0.1;

// --- Quote --------------------------------------------------------------

export type OrderLineInput = { slug: string; kg: number };

/** 宅配便で送るか、こちらが直接届けるか。CARBS は近所なので手渡し。 */
export type DeliveryMethod = 'shipping' | 'hand_delivery';

// Per-account terms that change the arithmetic but not the catalogue.
export type QuoteTerms = {
  deliveryMethod?: DeliveryMethod;
  /** 配送はするが送料はこちら負担。小売価格で買っている 旭興産 がこれにあたる。 */
  freeShipping?: boolean;
};

export function isHandDelivery(terms?: QuoteTerms | null): boolean {
  return terms?.deliveryMethod === 'hand_delivery';
}

export type QuoteLine = {
  slug: string;
  name: string;
  nameJa: string;
  grade: WholesaleGrade;
  kg: number;
  unitPrice: number;
  amount: number;
  greenKg: number;
};

export type Quote = {
  lines: QuoteLine[];
  totalKg: number;
  totalGreenKg: number;
  tier: PriceTier;
  usesSpecialPricing: boolean;
  subtotal: number;
  shipping: number;
  shippingLabel: string;
  taxGoods: number;
  taxShipping: number;
  tax: number;
  total: number;
};

// Builds a complete, invoice-shaped quote. Non-positive and unknown lines are
// dropped rather than rejected so the live form can be edited freely; the API
// validates emptiness and the kg minimum separately.
export function quote(
  items: OrderLineInput[],
  special?: SpecialPricing | null,
  terms?: QuoteTerms | null,
): Quote {
  const cleaned = items
    .map((it) => ({ bean: beanBySlug(it.slug), kg: Math.floor(Number(it.kg) || 0) }))
    .filter((it): it is { bean: WholesaleBean; kg: number } => Boolean(it.bean) && it.kg > 0);

  const totalKg = cleaned.reduce((sum, it) => sum + it.kg, 0);
  const tier = tierForKg(totalKg);

  const lines: QuoteLine[] = cleaned.map(({ bean, kg }) => {
    const price = unitPrice(bean.grade, totalKg, special);
    return {
      slug: bean.slug,
      name: bean.name,
      nameJa: bean.nameJa,
      grade: bean.grade,
      kg,
      unitPrice: price,
      amount: price * kg,
      greenKg: Math.round(kg * bean.greenPerKg * 10) / 10,
    };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);
  const plan = shippingPlan(totalKg);
  // 手渡しなら運送便を使わないので送料そのものが発生しない。
  const shipping = isHandDelivery(terms) || terms?.freeShipping ? 0 : plan.fee;
  const taxGoods = Math.round(subtotal * TAX_RATE_GOODS);
  const taxShipping = Math.round(shipping * TAX_RATE_SHIPPING);
  const tax = taxGoods + taxShipping;

  return {
    lines,
    totalKg,
    totalGreenKg: Math.round(lines.reduce((sum, l) => sum + l.greenKg, 0) * 10) / 10,
    tier,
    usesSpecialPricing: lines.some((l) => special?.[l.grade] !== undefined),
    subtotal,
    shipping,
    shippingLabel: isHandDelivery(terms)
      ? '直接お届け'
      : terms?.freeShipping
        ? '当社負担'
        : shippingLabel(totalKg),
    taxGoods,
    taxShipping,
    tax,
    total: subtotal + shipping + tax,
  };
}

// --- Price-break advice -------------------------------------------------

export type PriceBreakHint = {
  addKg: number;
  nextTierLabel: string;
  /** Guaranteed-minimum saving: computed by topping up with the most expensive
   *  grade already in the order, so any other choice saves at least this much. */
  saving: number;
};

// A volume ladder can invert — 19kg × ¥5,400 costs more than 20kg × ¥5,000. Left
// unsaid that reads as a billing mistake to the customer, so the form surfaces
// it. Returns null unless topping up genuinely lowers the total.
export function priceBreakHint(
  items: OrderLineInput[],
  special?: SpecialPricing | null,
  terms?: QuoteTerms | null,
): PriceBreakHint | null {
  const current = quote(items, special, terms);
  if (current.totalKg === 0) return null;

  const next = PRICE_TIERS.filter((t) => t.minKg > current.totalKg).sort((a, b) => a.minKg - b.minKg)[0];
  if (!next) return null;

  const addKg = next.minKg - current.totalKg;

  // Top up with the priciest grade present — the worst case for the customer,
  // so the quoted saving is one they are guaranteed to beat.
  const worstGrade = current.lines.reduce<WholesaleGrade>(
    (worst, l) => (l.unitPrice > (current.lines.find((x) => x.grade === worst)?.unitPrice ?? 0) ? l.grade : worst),
    current.lines[0].grade
  );
  const topUpBean = WHOLESALE_BEANS.find((b) => b.grade === worstGrade);
  if (!topUpBean) return null;

  // Copy each line, not just the array: mutating a shared line object here once
  // leaked the hypothetical top-up into the order the customer actually placed.
  const candidateItems = items.map((it) => ({ ...it }));
  const existing = candidateItems.find((it) => it.slug === topUpBean.slug);
  if (existing) existing.kg = Number(existing.kg) + addKg;
  else candidateItems.push({ slug: topUpBean.slug, kg: addKg });

  const candidate = quote(candidateItems, special, terms);
  const saving = current.total - candidate.total;
  if (saving <= 0) return null;

  return { addKg, nextTierLabel: next.label, saving };
}

export function yen(n: number): string {
  return `¥${n.toLocaleString('ja-JP')}`;
}
