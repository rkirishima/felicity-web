// Wholesale (業販) catalogue and pricing.
//
// Separate from the retail catalogue in `products.ts` on purpose: wholesale is
// sold by the kilogram from a green-bean list that does not map 1:1 to the
// retail bag line-up, and the prices must never leak into the public shop.
//
// The catalogue, the per-kg prices and the order terms below all come from
// FELICITY_WHOLESALE_GUIDE (2026) — the price sheet handed to trade customers.
// When the guide is revised, this file is what has to change with it.
//
// Everything here is pure data + arithmetic so it can be imported from both the
// client order form and the server-side price recomputation in
// `app/api/wholesale/order`. The server ALWAYS re-runs `quote()` from the
// account record — the browser's numbers are display only.

/** 標準焙煎。指定がなければこのプロファイルで焙煎する。 */
export type RoastLabel = 'シティ' | 'フルシティ' | 'ダークロースト';

// 価格表に載っている銘柄は紹介文まで揃っているが、取引先限定で回している豆は
// 名前と価格しかないこともある。載っていない項目は表示ごと省く。
export type WholesaleBean = {
  slug: string;
  /** 産地（COUNTRY）— 価格表の見出し */
  origin: string;
  /** 農園・銘柄名（英字） */
  name: string;
  /** 和名 */
  nameJa: string;
  roast?: RoastLabel;
  /** 税抜/kg。null は「都度お見積り」— フォームからは注文させない。 */
  pricePerKg: number | null;
  /** カップの印象。価格表の見出しと同じ順で並べる。 */
  notes?: string[];
  /** 産地とつくり手の話。価格表の本文そのまま。 */
  story?: string;
  region?: string;
  producer?: string | null;
  elevation?: string;
  variety?: string;
  process?: string;
  // Green weight needed per 1kg roasted, i.e. 1 / roast yield. Used by the
  // green-bean requirement calculation, not by pricing.
  greenPerKg: number;
  /** フレーバーマップ上の位置。x: 軽やか(-1) ↔ 重厚(+1)、y: 深み(-1) ↔ 華やか(+1)。 */
  map?: { x: number; y: number };
  /** 価格表に載せない、取引先限定の銘柄。許可された取引先にだけ見える。 */
  restricted?: boolean;
};

// The list quoted to trade customers, in price-sheet order.
export const WHOLESALE_BEANS: WholesaleBean[] = [
  {
    slug: 'yemen-white-camel-matari',
    origin: 'YEMEN',
    name: 'White Camel Matari',
    nameJa: 'ホワイトキャメル モカ・マタリ',
    roast: 'シティ',
    pricePerKg: 9600,
    notes: ['ドライフルーツ', 'ワイン', 'スパイス', 'カカオ'],
    story:
      'バニー・マタルの段々畑で育ち、昔ながらの天日乾燥で仕上げた豆。スパイスの香りに、ワインのような熟成感が重なります。',
    region: 'サナア州 バニー・マタル',
    producer: '山岳地帯の小規模農家',
    elevation: '2,000–2,500m',
    variety: 'イエメン在来種',
    process: 'ナチュラル（天日乾燥）',
    greenPerKg: 1.19,
    map: { x: -0.39, y: 0.44 },
  },
  {
    slug: 'png-baroida',
    origin: 'PAPUA NEW GUINEA',
    name: 'Baroida Estate',
    nameJa: 'バロイダ農園',
    roast: 'シティ',
    pricePerKg: 5600,
    notes: ['オレンジ', 'ハチミツ', 'ハーブ'],
    story:
      'コルブラン家が受け継ぐ高地の農園。ゆっくり熟したチェリーを水洗式で仕上げ、柑橘の爽やかさとハチミツの甘さ、クリーンな後味に。',
    region: '東部高地州 アイユラ渓谷',
    producer: 'バロイダ農園（コルブラン家）',
    elevation: '1,600–1,850m',
    variety: 'ブルボン、ティピカ、アルーシャ',
    process: 'ウォッシュド',
    greenPerKg: 1.19,
    map: { x: -0.31, y: -0.1 },
  },
  {
    slug: 'ethiopia-yirgacheffe-g1',
    origin: 'ETHIOPIA',
    name: 'Yirgacheffe G1',
    nameJa: 'イルガチェフェ G1 ナチュラル',
    roast: 'シティ',
    pricePerKg: 5800,
    notes: ['ブルーベリー', 'ジャスミン', 'ストロベリー'],
    story:
      'イルガチェフェの小規模農家が育てる在来種。実のまま天日で乾かすことで、熟したベリーのような果実香と華やかな花の香りが広がります。',
    region: 'ゲデオ・ゾーン イルガチェフェ',
    producer: '地域の小規模農家',
    elevation: '1,900–2,200m',
    variety: 'エチオピア在来種',
    process: 'ナチュラル',
    greenPerKg: 1.16,
    map: { x: -0.62, y: 0.33 },
  },
  {
    slug: 'tanzania-mwika',
    origin: 'TANZANIA',
    name: 'Mwika AA/AB',
    nameJa: 'ムウィカ AA/AB',
    roast: 'フルシティ',
    pricePerKg: 6500,
    notes: ['カシス', 'グレープフルーツ', '黒糖'],
    story:
      'キリマンジャロ山麓の火山灰土壌で育った豆。明るい酸に、フルシティローストの力強い甘苦さが重なり、しっかりとした余韻を残します。',
    region: 'キリマンジャロ州 ムウィカ',
    producer: '地域の小規模農家',
    elevation: '1,400–1,800m',
    variety: 'ブルボン、ケント ほか',
    process: 'ウォッシュド',
    greenPerKg: 1.19,
    map: { x: 0.35, y: -0.46 },
  },
  {
    slug: 'guatemala-la-cupula',
    origin: 'GUATEMALA',
    name: 'La Cupula',
    nameJa: 'ラ・クプラ ブルボン',
    roast: 'フルシティ',
    pricePerKg: 5900,
    notes: ['キャラメル', 'オレンジ', 'ダークチョコ'],
    story:
      '1870年代から続くフィラデルフィア農園で、最も標高の高いブルボン区画を分けたロット。火山性土壌が育むコクと甘さに、きれいな酸が調和します。',
    region: 'アンティグア パンチョイ渓谷',
    producer: 'フィラデルフィア農園（ダルトン家）',
    elevation: '1,650–2,100m',
    variety: 'ブルボン',
    process: 'ウォッシュド（天日乾燥）',
    greenPerKg: 1.19,
    map: { x: 0.28, y: 0.22 },
  },
  {
    slug: 'india-attikan',
    origin: 'INDIA',
    name: 'Attikan Estate',
    nameJa: 'アッティカン農園 カルチャード',
    roast: 'フルシティ',
    pricePerKg: 6000,
    notes: ['黄桃', 'ヨーグルト', 'シナモン', '黒糖'],
    story:
      '霧に包まれる高地のアッティカン農園。乳酸菌と酵母を加えた嫌気発酵により、まろやかな乳酸系の酸と、南国フルーツのような甘さを生み出します。',
    region: 'カルナータカ州',
    producer: 'アッティカン農園',
    elevation: '1,500–1,650m',
    variety: 'カトゥーラ',
    process: 'アナエロビック・ウォッシュド',
    greenPerKg: 1.19,
    map: { x: 0.1, y: -0.3 },
  },
  {
    slug: 'el-salvador-la-fany',
    origin: 'EL SALVADOR',
    name: 'Finca La Fany',
    nameJa: 'ラ・ファニー農園 パカマラ',
    roast: 'フルシティ',
    pricePerKg: 6400,
    notes: ['ブラックチェリー', '赤ワイン', 'ミルクチョコ'],
    story:
      '1900年代初頭からシルバ家が受け継ぐ農園。大粒のパカマラ種をナチュラルで仕上げ、熟したチェリーの果実味となめらかで厚みのある口当たりに。',
    region: 'アワチャパン県 アパネカ',
    producer: 'ラ・ファニー農園（シルバ家）',
    elevation: '1,450–1,550m',
    variety: 'パカマラ',
    process: 'ナチュラル',
    greenPerKg: 1.21,
    map: { x: -0.11, y: -0.1 },
  },
  {
    slug: 'colombia-decaf',
    origin: 'COLOMBIA',
    name: 'Decaf',
    nameJa: 'コロンビア デカフェ',
    roast: 'フルシティ',
    pricePerKg: 7200,
    notes: ['ミルクチョコ', 'キャラメル', 'ナッツ'],
    story:
      'コロンビアの有機JAS認証豆からカフェインを除去。フルシティでコクと甘さを引き出しています。夜の一杯や、カフェインを控えたい方の選択肢に。',
    region: 'コロンビア アンデス山系',
    producer: '有機JAS認証生産者',
    elevation: '1,400–1,900m',
    variety: 'カトゥーラ ほか',
    process: 'ウォッシュド＋デカフェ処理',
    greenPerKg: 1.15,
    map: { x: -0.8, y: -0.1 },
  },
  {
    slug: 'guatemala-gualvador',
    origin: 'GUATEMALA',
    name: 'Gualvador Anaerobic',
    nameJa: 'グアルバドール アナエロビック',
    roast: 'フルシティ',
    pricePerKg: 5500,
    notes: ['ラム酒', 'プラム', 'ぶどう', 'カカオ'],
    story:
      'ハイメ・リオス氏の農園で、完熟チェリーを密閉して6日間発酵させてから天日乾燥。洋酒のような芳醇な香りと、濃厚な甘さを持つ個性派です。',
    region: 'フティアパ県 ヌエボ・オリエンテ',
    producer: 'グアルバドール農園',
    elevation: '1,370–1,500m',
    variety: 'パカス',
    process: 'アナエロビック・ナチュラル',
    greenPerKg: 1.19,
    map: { x: 0.62, y: 0.68 },
  },
  {
    slug: 'brazil-santa-alina',
    origin: 'BRAZIL',
    name: 'Santa Alina',
    nameJa: 'サンタアリーナ',
    roast: 'フルシティ',
    pricePerKg: 6000,
    notes: ['ミルクチョコ', 'ナッツ', 'キャラメル'],
    story:
      '1907年創業、ディアス家の農園。果肉を除き、粘質層を残して乾燥させることで、とろりとした甘さと丸い口当たりに。穏やかな酸味でミルクとも好相性。',
    region: 'サンパウロ州 モジアナ',
    producer: 'サンタアリーナ農園（ディアス家）',
    elevation: '1,100–1,250m',
    variety: 'イエローブルボン',
    process: 'パルプドナチュラル',
    greenPerKg: 1.19,
    map: { x: -0.55, y: -0.57 },
  },
  {
    slug: 'panama-geisha',
    origin: 'PANAMA',
    name: 'Geisha',
    nameJa: 'パナマ ゲイシャ',
    roast: 'シティ',
    // 相場と入荷ロットで動くため価格表でも ASK。フォームからは注文させない。
    pricePerKg: null,
    notes: ['ジャスミン', 'ベルガモット', 'ピーチ', 'ハチミツ'],
    story:
      'エチオピアにルーツを持ち、パナマの高地で育つゲイシャ種。紅茶のような透明感とジャスミンの香りが特徴です。香りをゆっくり楽しむ、特別な一杯に。',
    region: 'チリキ県',
    producer: null,
    elevation: '1,500m以上',
    variety: 'ゲイシャ',
    process: 'ウォッシュド',
    greenPerKg: 1.19,
    map: { x: 0.28, y: 0.85 },
  },
  // 価格表（2026年版）には載っていないが、業販では継続して出している銘柄。
  //
  // 紹介文は felicity-staff の焙煎プロファイル（BRA_SANTOS）の風味記述に基づく。
  // 標準はダークロースト: Dark Chocolate / Smoke / Heavy Body。浅めに振ると
  // Nutty / Mild / Low Acidity。農園・標高・品種・精製は記録がないため載せない。
  // 要確認: マップ上の位置は深煎りの味わいからの推定値。
  {
    slug: 'brazil-santos',
    origin: 'BRAZIL',
    name: 'Santos No.2',
    nameJa: 'ブラジル サントス No.2',
    roast: 'ダークロースト',
    pricePerKg: 4000,
    notes: ['ダークチョコ', '香ばしいナッツ', '重厚なボディ'],
    story:
      'サントス港から積み出される、ブラジルの定番銘柄。深めに焼き込むことで、ダークチョコのような苦甘さと厚みのあるボディが出ます。ミルクに負けない味の芯があり、エスプレッソやカフェラテのベースに向く一本です。浅めに振れば、ナッツの香ばしさとやわらかな甘さの穏やかな表情にもなります。',
    greenPerKg: 1.19,
    map: { x: 0.1, y: -0.78 },
  },
];

export function beanBySlug(slug: string): WholesaleBean | undefined {
  return WHOLESALE_BEANS.find((b) => b.slug === slug);
}

/**
 * その取引先に見せる銘柄。価格表の銘柄に、その先だけに出している豆
 * （wholesale_accounts.extra_beans）を足したもの。
 */
export function beansFor(extraBeans?: readonly string[] | null): WholesaleBean[] {
  const extra = new Set(extraBeans ?? []);
  return WHOLESALE_BEANS.filter((bean) => !bean.restricted || extra.has(bean.slug));
}

export function canOrderBean(bean: WholesaleBean, extraBeans?: readonly string[] | null): boolean {
  return !bean.restricted || (extraBeans ?? []).includes(bean.slug);
}

// --- Pricing ------------------------------------------------------------
//
// 銘柄ごとの卸価格（税抜/kg）。数量ティアは廃止 — 価格表が銘柄別の単価で
// 出ているため、合計kgで単価は動かない。

/** 取引先ごとのお取り決め単価（税抜/kg）。slug → 単価。 */
export type BeanPrices = Record<string, number>;

export function unitPrice(bean: WholesaleBean, special?: BeanPrices | null): number | null {
  const pinned = special?.[bean.slug];
  return typeof pinned === 'number' ? pinned : bean.pricePerKg;
}

/** 注文できるのは単価の決まっている銘柄だけ。ゲイシャは都度お見積り。 */
export function isOrderable(bean: WholesaleBean, special?: BeanPrices | null): boolean {
  return unitPrice(bean, special) !== null;
}

// --- Order terms --------------------------------------------------------
//
// 価格表（WHOLESALE / ORDER）の条件をそのまま定数にしたもの。

// 1回のご注文の最低数量。価格表は「1回 2kg〜」だが運用は3kgから縛り、
// ご要望に応じて取引先ごとに下げ下ろす（wholesale_accounts.min_order_kg）。
export const DEFAULT_MIN_ORDER_KG = 3;

/** 取引先の最低ロット。未設定・不正値は既定に倒す。 */
export function minOrderKg(accountMinKg?: number | null): number {
  return Number.isInteger(accountMinKg) && (accountMinKg as number) >= 1
    ? (accountMinKg as number)
    : DEFAULT_MIN_ORDER_KG;
}

/** 1銘柄あたりの最低数量。 */
export const MIN_KG_PER_BEAN = 1;
/** オリジナルブレンドの最低数量（フォーム外・ご相談ベース）。 */
export const MIN_CUSTOM_BLEND_KG = 3;
/** ご注文からお届けまでの目安。 */
export const LEAD_TIME_DAYS = 3;
/** この金額（税抜小計）以上で送料無料。 */
export const FREE_SHIPPING_THRESHOLD = 30000;

// --- Shipping -----------------------------------------------------------
//
// 焙煎豆は軽くて嵩張るので、送料は重量ではなく箱のサイズで決まる。1kgでおよそ
// 2.7L あるため、下表は容積から逆算した目安の積載量。
//
// 要確認: 金額はヤマト宅急便の関東→関東を想定した暫定値。価格表でも
// 「3万円未満の送料：要確認」としているため、ここは目安として表示する。
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
  roast?: RoastLabel;
  kg: number;
  unitPrice: number;
  amount: number;
  greenKg: number;
};

/** 送料が0円になった理由。表示の文言を分けるために持っておく。 */
export type ShippingBasis = 'hand_delivery' | 'company_paid' | 'free_over_threshold' | 'charged' | 'none';

export type Quote = {
  lines: QuoteLine[];
  totalKg: number;
  totalGreenKg: number;
  /** 適用した価格の根拠。請求書側に残す。 */
  priceBasis: string;
  usesSpecialPricing: boolean;
  subtotal: number;
  shipping: number;
  shippingBasis: ShippingBasis;
  shippingLabel: string;
  taxGoods: number;
  taxShipping: number;
  tax: number;
  total: number;
};

// Builds a complete, invoice-shaped quote. Non-positive, unknown and
// quote-on-request lines are dropped rather than rejected so the live form can
// be edited freely; the API validates the minimums separately.
export function quote(
  items: OrderLineInput[],
  special?: BeanPrices | null,
  terms?: QuoteTerms | null,
): Quote {
  const cleaned = items
    .map((it) => ({ bean: beanBySlug(it.slug), kg: Math.floor(Number(it.kg) || 0) }))
    .filter((it): it is { bean: WholesaleBean; kg: number } => Boolean(it.bean) && it.kg > 0)
    .map(({ bean, kg }) => ({ bean, kg, price: unitPrice(bean, special) }))
    .filter((it): it is { bean: WholesaleBean; kg: number; price: number } => it.price !== null);

  const totalKg = cleaned.reduce((sum, it) => sum + it.kg, 0);

  const lines: QuoteLine[] = cleaned.map(({ bean, kg, price }) => ({
    slug: bean.slug,
    name: bean.name,
    nameJa: bean.nameJa,
    roast: bean.roast,
    kg,
    unitPrice: price,
    amount: price * kg,
    greenKg: Math.round(kg * bean.greenPerKg * 10) / 10,
  }));

  const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);
  const plan = shippingPlan(totalKg);

  // 手渡しなら運送便を使わないので送料そのものが発生しない。次に取引先ごとの
  // 当社負担、最後に価格表の3万円以上送料無料。
  const shippingBasis: ShippingBasis =
    totalKg === 0
      ? 'none'
      : isHandDelivery(terms)
        ? 'hand_delivery'
        : terms?.freeShipping
          ? 'company_paid'
          : subtotal >= FREE_SHIPPING_THRESHOLD
            ? 'free_over_threshold'
            : 'charged';

  const shipping = shippingBasis === 'charged' ? plan.fee : 0;
  const taxGoods = Math.round(subtotal * TAX_RATE_GOODS);
  const taxShipping = Math.round(shipping * TAX_RATE_SHIPPING);
  const tax = taxGoods + taxShipping;

  return {
    lines,
    totalKg,
    totalGreenKg: Math.round(lines.reduce((sum, l) => sum + l.greenKg, 0) * 10) / 10,
    priceBasis: lines.some((l) => special?.[l.slug] !== undefined) ? 'お取り決め価格' : '銘柄別 卸価格',
    usesSpecialPricing: lines.some((l) => special?.[l.slug] !== undefined),
    subtotal,
    shipping,
    shippingBasis,
    shippingLabel: SHIPPING_BASIS_LABEL[shippingBasis](totalKg),
    taxGoods,
    taxShipping,
    tax,
    total: subtotal + shipping + tax,
  };
}

const SHIPPING_BASIS_LABEL: Record<ShippingBasis, (totalKg: number) => string> = {
  none: () => '—',
  hand_delivery: () => '直接お届け',
  company_paid: () => '当社負担',
  free_over_threshold: () => `${yen(FREE_SHIPPING_THRESHOLD)}以上 送料無料`,
  charged: (totalKg) => shippingLabel(totalKg),
};

// --- Free-shipping advice -----------------------------------------------

export type FreeShippingHint = {
  /** あといくら（税抜）で送料無料になるか。 */
  remaining: number;
  /** そのとき浮く送料（税込）。 */
  saving: number;
};

// 3万円の手前で止まっている注文に、あといくらで送料が消えるかを出す。
// 送料を払わない取引先には出さない。
export function freeShippingHint(
  items: OrderLineInput[],
  special?: BeanPrices | null,
  terms?: QuoteTerms | null,
): FreeShippingHint | null {
  const q = quote(items, special, terms);
  if (q.shippingBasis !== 'charged') return null;

  const remaining = FREE_SHIPPING_THRESHOLD - q.subtotal;
  if (remaining <= 0) return null;

  return {
    remaining,
    saving: q.shipping + q.taxShipping,
  };
}

export function yen(n: number): string {
  return `¥${n.toLocaleString('ja-JP')}`;
}
