'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { PREFECTURES } from '@/lib/prefectures';
import { FlavourMap, GREEN, Hero, RoastingQuality, WhyFelicity, eyebrow, panel } from './sections';
import {
  FREE_SHIPPING_THRESHOLD,
  LEAD_TIME_DAYS,
  MIN_CUSTOM_BLEND_KG,
  MIN_KG_PER_BEAN,
  minOrderKg,
  SHIPPING_BOXES,
  beansFor,
  freeShippingHint,
  quote,
  unitPrice,
  yen,
  type BeanPrices,
  type DeliveryMethod,
  type FreeShippingHint,
  type RoastLabel,
  type WholesaleBean,
} from '@/app/lib/wholesale';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export type WholesaleAccount = {
  code: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  postalCode: string;
  prefecture: string;
  city: string;
  streetAddress: string;
  building: string;
  specialPricing: BeanPrices | null;
  /** 1回のご注文の最低数量(kg)。取引先ごとに異なる。 */
  minOrderKg: number;
  /** 価格表外で、この取引先にだけ出している銘柄の slug。 */
  extraBeans: string[];
  freeShipping: boolean;
  deliveryMethod: DeliveryMethod;
};

type PaymentMethod = 'bank_transfer' | 'card';

type Confirmation = {
  orderId: string;
  paymentMethod: PaymentMethod;
  amount: number;
};

const label = 'block text-[12px] text-[#8C7B6B] font-mono tracking-[0.08em] uppercase mb-2';
const input =
  'w-full bg-[#F4EFE4] border border-[#DDD5C5] px-4 py-3 text-[15px] text-[#2C2416] rounded-sm focus:outline-none focus:border-[#8C7B6B]';

export function WholesaleOrder({ account, preview = false }: { account: WholesaleAccount; preview?: boolean }) {
  const router = useRouter();

  const [kgBySlug, setKgBySlug] = useState<Record<string, number>>({});
  const [contactName, setContactName] = useState(account.contactName);
  const [email, setEmail] = useState(account.email);
  const [phone, setPhone] = useState(account.phone);
  const [postalCode, setPostalCode] = useState(account.postalCode);
  const [prefecture, setPrefecture] = useState(account.prefecture);
  const [city, setCity] = useState(account.city);
  const [streetAddress, setStreetAddress] = useState(account.streetAddress);
  const [building, setBuilding] = useState(account.building);
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cardStep, setCardStep] = useState<{ orderId: string; clientSecret: string } | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const items = useMemo(
    () => Object.entries(kgBySlug).map(([slug, kg]) => ({ slug, kg })),
    [kgBySlug]
  );
  const terms = useMemo(
    () => ({ freeShipping: account.freeShipping, deliveryMethod: account.deliveryMethod }),
    [account.freeShipping, account.deliveryMethod],
  );
  const handDelivery = account.deliveryMethod === 'hand_delivery';
  // サーバー側でも同じ値で弾く。ここは入力を止めるためだけのもの。
  const minKg = minOrderKg(account.minOrderKg);
  const q = useMemo(() => quote(items, account.specialPricing, terms), [items, account.specialPricing, terms]);
  // 価格表の銘柄＋この取引先にだけ出している豆。
  const beans = useMemo(() => beansFor(account.extraBeans), [account.extraBeans]);

  // 送料無料ラインの手前で止まっている注文にだけ、あといくらで送料が消えるかを出す。
  const hint = useMemo(
    () => freeShippingHint(items, account.specialPricing, terms),
    [items, account.specialPricing, terms],
  );

  // Both take an updater so two clicks landing in the same React batch each see
  // the previous value — otherwise a fast double-tap on + only adds 1kg.
  function updateKg(slug: string, next: (current: number) => number) {
    setKgBySlug((prev) => {
      const updated = { ...prev };
      const value = Math.max(0, Math.floor(next(prev[slug] ?? 0) || 0));
      if (value === 0) delete updated[slug];
      else updated[slug] = value;
      return updated;
    });
  }

  const setKg = (slug: string, kg: number) => updateKg(slug, () => kg);
  const bumpKg = (slug: string, delta: number) => updateKg(slug, (current) => current + delta);

  function validate(): string | null {
    if (q.totalKg < minKg) return `ご注文は合計${minKg}kgから承ります。`;
    if (!contactName.trim()) return 'ご担当者名を入力してください。';
    if (!email.trim()) return 'メールアドレスを入力してください。';
    if (!handDelivery && (!postalCode.trim() || !prefecture || !city.trim() || !streetAddress.trim()))
      return '配送先住所をすべて入力してください。';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (preview) return;
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/wholesale/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          paymentMethod,
          contactName,
          email,
          phone,
          postalCode,
          prefecture,
          city,
          streetAddress,
          building,
          note,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || '注文を送信できませんでした。');
        return;
      }

      if (paymentMethod === 'card') {
        setCardStep({ orderId: data.orderId, clientSecret: data.clientSecret });
      } else {
        setConfirmation({ orderId: data.orderId, paymentMethod: 'bank_transfer', amount: data.amount });
      }
    } catch {
      setError('通信エラーが発生しました。時間をおいてお試しください。');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/wholesale/logout', { method: 'POST' });
    router.push('/wholesale/login');
    router.refresh();
  }

  if (confirmation) {
    return <OrderConfirmation confirmation={confirmation} onReset={() => window.location.reload()} />;
  }

  if (cardStep) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret: cardStep.clientSecret }}>
        <CardPayment
          orderId={cardStep.orderId}
          amount={q.total}
          onDone={() => setConfirmation({ orderId: cardStep.orderId, paymentMethod: 'card', amount: q.total })}
          onCancel={() => setCardStep(null)}
        />
      </Elements>
    );
  }

  return (
    <div className="pb-24">
      <header className="border-b border-[#DDD5C5]">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between gap-6">
          <div className="min-w-0">
            <p className={`${eyebrow} whitespace-nowrap`}>Wholesale</p>
            <p className="mt-1 text-[15px] text-[#2C2416] font-light truncate">{account.company}</p>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <a
              href="/wholesale/orders"
              className="text-[11px] text-[#8C7B6B] font-mono tracking-[0.08em] uppercase hover:text-[#2C2416] transition-colors"
            >
              注文履歴
            </a>
            <a
              href="/wholesale/password"
              className="text-[11px] text-[#8C7B6B] font-mono tracking-[0.08em] uppercase hover:text-[#2C2416] transition-colors"
            >
              パスワード変更
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="text-[11px] text-[#8C7B6B] font-mono tracking-[0.08em] uppercase hover:text-[#2C2416] transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <Hero />
      <WhyFelicity />
      <RoastingQuality />
      <FlavourMap beans={beans} />

      <form onSubmit={handleSubmit}>
        <section className="max-w-5xl mx-auto px-6 pt-20">
          <p className={eyebrow}>Coffee Collection</p>
          <h2 className="mt-3 text-[clamp(24px,3.4vw,34px)] font-light text-[#2C2416] tracking-tight">
            産地とつくり手の個性を、一杯に。
          </h2>
          <p className="mt-4 max-w-2xl text-[14px] text-[#8C7B6B] font-light leading-relaxed">
            価格はすべて1kgあたり・税抜です。{MIN_KG_PER_BEAN}kg単位でご指定いただけます
            （1回のご注文は合計{minKg}kgから）。挽き・個包装の追加料金はいただきません。
          </p>

          <div className="mt-10 space-y-px">
            {beans.map((bean) => (
              <BeanCard
                key={bean.slug}
                bean={bean}
                kg={kgBySlug[bean.slug] ?? 0}
                price={unitPrice(bean, account.specialPricing)}
                pinned={account.specialPricing?.[bean.slug] !== undefined}
                onSet={(kg) => setKg(bean.slug, kg)}
                onBump={(delta) => bumpKg(bean.slug, delta)}
              />
            ))}
          </div>
        </section>

        <OrderTerms minKg={minKg} freeShipping={account.freeShipping} handDelivery={handDelivery} />

        <section className="max-w-3xl mx-auto px-6 pt-20 space-y-10">
          <div>
            <h2 className="text-[13px] text-[#8C7B6B] font-mono tracking-[0.12em] uppercase mb-4">
              {handDelivery ? 'ご連絡先' : '配送先'}
            </h2>
            {handDelivery && (
              <p className="mb-4 text-[12px] text-[#8C7B6B] font-light">
                御社へは当社が直接お届けするため、配送先住所のご入力は不要です。
              </p>
            )}
            <div className={`${panel} p-6 space-y-5`}>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className={label} htmlFor="contactName">ご担当者名</label>
                  <input id="contactName" className={input} value={contactName} onChange={(e) => setContactName(e.target.value)} required />
                </div>
                <div>
                  <label className={label} htmlFor="email">メールアドレス</label>
                  <input id="email" type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <label className={label} htmlFor="phone">電話番号</label>
                  <input id="phone" type="tel" className={input} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                {!handDelivery && (
                  <>
                    <div>
                      <label className={label} htmlFor="postalCode">郵便番号</label>
                      <input id="postalCode" className={input} placeholder="XXX-XXXX" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
                    </div>
                    <div>
                      <label className={label} htmlFor="prefecture">都道府県</label>
                      <select id="prefecture" className={input} value={prefecture} onChange={(e) => setPrefecture(e.target.value)} required>
                        <option value="">選択してください</option>
                        {PREFECTURES.map((pref) => (
                          <option key={pref} value={pref}>{pref}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={label} htmlFor="city">市区町村</label>
                      <input id="city" className={input} value={city} onChange={(e) => setCity(e.target.value)} required />
                    </div>
                  </>
                )}
              </div>
              {!handDelivery && (
                <>
                  <div>
                    <label className={label} htmlFor="streetAddress">住所</label>
                    <input id="streetAddress" className={input} value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} required />
                  </div>
                  <div>
                    <label className={label} htmlFor="building">建物名・号室（任意）</label>
                    <input id="building" className={input} value={building} onChange={(e) => setBuilding(e.target.value)} />
                  </div>
                </>
              )}
              <div>
                <label className={label} htmlFor="note">備考（挽き方・個包装・納品希望日など）</label>
                <textarea id="note" rows={3} className={input} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-[13px] text-[#8C7B6B] font-mono tracking-[0.12em] uppercase mb-4">お支払い方法</h2>
            <div className={`${panel} p-6 space-y-3`}>
              {([
                { value: 'bank_transfer' as const, title: '銀行振込（前払い）', sub: 'ご注文後に振込先をご案内します。ご入金確認後に焙煎・発送いたします。' },
                { value: 'card' as const, title: 'クレジットカード', sub: 'この場でお支払いが完了します。' },
              ]).map((option) => (
                <label
                  key={option.value}
                  className={`flex gap-3 p-4 rounded-sm cursor-pointer border transition-colors ${
                    paymentMethod === option.value
                      ? 'border-[#7AAFC4] bg-[#F4EFE4]'
                      : 'border-[#DDD5C5] hover:bg-[#F4EFE4]'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={option.value}
                    checked={paymentMethod === option.value}
                    onChange={() => setPaymentMethod(option.value)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-[15px] text-[#2C2416] font-light">{option.title}</span>
                    <span className="block text-[12px] text-[#8C7B6B] font-light">{option.sub}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-[12px] text-[#8C7B6B] font-light">
              継続的にお取引いただいている場合の月末締め・翌月末払いをご希望のときは、備考欄にご記入ください。
            </p>
          </div>

          <OrderSummary q={q} hint={hint} />

          {error && (
            <p role="alert" className="text-[14px] text-[#A34A3A] font-light">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={preview || submitting || q.totalKg < minKg}
            className="w-full sm:w-auto bg-[#7AAFC4] text-[#2C2416] font-mono text-[13px] tracking-[0.08em] uppercase px-10 py-4 rounded-sm hover:bg-[#6A9DB3] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {preview ? '下見用（注文は送信されません）' : submitting ? '送信中...' : paymentMethod === 'card' ? 'お支払いへ進む' : '注文を確定する'}
          </button>
        </section>
      </form>
    </div>
  );
}


// --- Catalogue + order ---------------------------------------------------

function BeanCard({
  bean,
  kg,
  price,
  pinned,
  onSet,
  onBump,
}: {
  bean: WholesaleBean;
  kg: number;
  price: number | null;
  pinned: boolean;
  onSet: (kg: number) => void;
  onBump: (delta: number) => void;
}) {
  const selected = kg > 0;

  return (
    <article
      className={`${panel} p-6 sm:p-8 transition-colors ${selected ? 'ring-1 ring-[#7AAFC4]' : ''}`}
    >
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,0.85fr)] gap-6 lg:gap-10">
        {/* 銘柄と価格 */}
        <div>
          <p className="font-mono text-[12px] tracking-[0.14em] uppercase text-[#2C2416]">{bean.origin}</p>
          <h3 className="mt-1 text-[21px] font-light" style={{ color: GREEN }}>{bean.name}</h3>
          <p className="mt-1 text-[13px] text-[#8C7B6B] font-light">{bean.nameJa}</p>
          {bean.roast && (
            <p className="mt-3 text-[12px] font-light" style={{ color: '#9A7B3F' }}>
              標準焙煎：{bean.roast}
            </p>
          )}
          <p className="mt-3 text-[20px] text-[#2C2416] font-mono font-light">
            {price === null ? (
              <>
                ASK <span className="text-[13px] text-[#8C7B6B] font-light">都度お見積り</span>
              </>
            ) : (
              <>
                {yen(price)} <span className="text-[13px] text-[#8C7B6B]">/ kg</span>
              </>
            )}
          </p>
          {pinned && (
            <p className="mt-1 font-mono text-[10px] tracking-[0.14em] uppercase" style={{ color: GREEN }}>
              お取り決め価格
            </p>
          )}
        </div>

        {/* 味わいと物語 */}
        <div>
          {bean.notes && bean.notes.length > 0 && (
            <p className="text-[14px] font-medium leading-relaxed" style={{ color: GREEN }}>
              {bean.notes.join(' / ')}
            </p>
          )}
          {bean.story && (
            <p className="mt-3 text-[14px] text-[#2C2416] font-light leading-[1.9]">{bean.story}</p>
          )}
        </div>

        {/* 生産背景 */}
        <dl className="text-[12px] text-[#8C7B6B] font-light space-y-1.5">
          {bean.region && <div>{bean.region}</div>}
          {bean.producer && <div>{bean.producer}</div>}
          {bean.elevation && (
            <div className="pt-1.5 flex gap-3">
              <dt className="w-10 flex-shrink-0">標高</dt>
              <dd className="text-[#2C2416]">{bean.elevation}</dd>
            </div>
          )}
          {bean.variety && (
            <div className="flex gap-3">
              <dt className="w-10 flex-shrink-0">品種</dt>
              <dd className="text-[#2C2416]">{bean.variety}</dd>
            </div>
          )}
          {bean.process && (
            <div className="flex gap-3">
              <dt className="w-10 flex-shrink-0">精製</dt>
              <dd className="text-[#2C2416]">{bean.process}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="mt-6 pt-5 border-t border-[#DDD5C5] flex items-center justify-between gap-4 flex-wrap">
        {price === null ? (
          <p className="text-[13px] text-[#8C7B6B] font-light">
            相場と入荷ロットにより価格が変わるため、ご希望の数量をメールでお知らせください。
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={`${bean.name} を1kg減らす`}
              onClick={() => onBump(-1)}
              className="w-9 h-9 border border-[#DDD5C5] bg-[#F4EFE4] text-[#8C7B6B] rounded-sm hover:text-[#2C2416] transition-colors"
            >
              −
            </button>
            <input
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              aria-label={`${bean.name} の数量（kg）`}
              value={kg === 0 ? '' : kg}
              placeholder="0"
              onChange={(e) => onSet(Number(e.target.value))}
              className="w-20 text-center bg-[#F4EFE4] border border-[#DDD5C5] px-2 py-2 text-[15px] text-[#2C2416] font-mono rounded-sm focus:outline-none focus:border-[#8C7B6B]"
            />
            <button
              type="button"
              aria-label={`${bean.name} を1kg増やす`}
              onClick={() => onBump(1)}
              className="w-9 h-9 border border-[#DDD5C5] bg-[#F4EFE4] text-[#8C7B6B] rounded-sm hover:text-[#2C2416] transition-colors"
            >
              +
            </button>
            <span className="text-[12px] text-[#8C7B6B] font-mono ml-1">kg</span>
          </div>
        )}

        {price !== null && (
          <p className="text-[15px] text-[#2C2416] font-mono">
            {selected ? yen(price * kg) : <span className="text-[#8C7B6B] text-[13px]">—</span>}
          </p>
        )}
      </div>
    </article>
  );
}

function OrderTerms({
  minKg,
  freeShipping,
  handDelivery,
}: {
  minKg: number;
  freeShipping: boolean;
  handDelivery: boolean;
}) {
  const rows: { en: string; value: string }[] = [
    { en: 'Minimum Order', value: `1回 ${minKg}kg 〜・1銘柄につき ${MIN_KG_PER_BEAN}kg 〜（月間最低量はありません）` },
    { en: 'Custom Blend', value: `オリジナルブレンドは ${MIN_CUSTOM_BLEND_KG}kg 〜` },
    { en: 'Shipping', value: `ご注文から発送まで約${LEAD_TIME_DAYS}日` },
    {
      en: 'Delivery Fee',
      value: handDelivery
        ? '御社へは当社が直接お届けいたします（送料はかかりません）'
        : freeShipping
          ? '送料は当社が負担いたします'
          : `ご注文金額（税抜）${yen(FREE_SHIPPING_THRESHOLD)}以上で送料無料。未満は下記の箱サイズで加算されます`,
    },
    { en: 'Payment', value: '銀行振込またはクレジットカード。継続のお客様は月末締め・翌月末払いもご相談ください' },
    { en: 'Package', value: '標準はアロマバルブ付きの業務用アルミバッグ。豆・粉・個包装に対応し、追加料金はいただきません' },
  ];

  return (
    <section className="max-w-5xl mx-auto px-6 pt-20">
      <p className={eyebrow}>Wholesale / Order</p>
      <h2 className="mt-3 text-[clamp(24px,3.4vw,34px)] font-light text-[#2C2416] tracking-tight">
        必要な分から、継続しやすく。
      </h2>

      <dl className="mt-10">
        {rows.map((row) => (
          <div key={row.en} className="grid sm:grid-cols-[180px_minmax(0,1fr)] gap-2 sm:gap-8 border-t border-[#DDD5C5] py-5">
            <dt className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#8C7B6B] sm:pt-1">{row.en}</dt>
            <dd className="text-[15px] text-[#2C2416] font-light leading-relaxed">{row.value}</dd>
          </div>
        ))}
      </dl>

      {!handDelivery && !freeShipping && (
        <div className="mt-2 text-[12px] text-[#8C7B6B] font-light">
          <p className="mb-2">送料（税抜・箱数分を加算・目安）</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono">
            {SHIPPING_BOXES.map((box, i) => (
              <span key={box.label}>
                〜{box.maxKg}kg {box.label} {yen(box.fee)}
                {i === SHIPPING_BOXES.length - 1 ? '（超過分は箱を追加）' : ''}
              </span>
            ))}
          </div>
          <p className="mt-2">
            北海道・沖縄・離島宛、および大口のお届けは実費が異なります。確定金額はご注文後にご案内します。
          </p>
        </div>
      )}
    </section>
  );
}

function OrderSummary({ q, hint }: { q: ReturnType<typeof quote>; hint: FreeShippingHint | null }) {
  return (
    <section>
      <h2 className="text-[13px] text-[#8C7B6B] font-mono tracking-[0.12em] uppercase mb-4">ご注文内容</h2>
      <div className={`${panel} p-6`}>
        {q.lines.length === 0 ? (
          <p className="text-[14px] text-[#8C7B6B] font-light">銘柄と数量をご指定ください。</p>
        ) : (
          <>
            <div className="space-y-2 mb-5">
              {q.lines.map((line) => (
                <div key={line.slug} className="flex justify-between text-[14px] text-[#2C2416] font-light">
                  <span className="pr-4">
                    {line.name} <span className="text-[#8C7B6B] font-mono">{line.kg}kg</span>
                  </span>
                  <span className="font-mono">{yen(line.amount)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-4 border-t border-[#DDD5C5] text-[14px]">
              <Row label={`小計（${q.totalKg}kg・税抜）`} value={yen(q.subtotal)} />
              <Row
                label={`送料（税抜・${q.shippingLabel}）`}
                value={q.shipping === 0 ? '無料' : yen(q.shipping)}
              />
              <Row label="消費税（商品 8%）" value={yen(q.taxGoods)} />
              {q.taxShipping > 0 && <Row label="消費税（送料 10%）" value={yen(q.taxShipping)} />}
              <div className="flex justify-between pt-3 border-t border-[#DDD5C5] text-[17px] text-[#2C2416]">
                <span className="font-light">合計（税込）</span>
                <span className="font-mono">{yen(q.total)}</span>
              </div>
            </div>

            <p className="mt-4 text-[12px] text-[#8C7B6B] font-mono tracking-[0.06em]">
              適用価格: {q.priceBasis}
            </p>
            {hint && (
              <p className="mt-1 text-[12px] text-[#B8860B] font-light">
                あと {yen(hint.remaining)}（税抜）で送料無料になります（送料 {yen(hint.saving)} 分）。
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[#8C7B6B]">
      <span className="font-light">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function CardPayment({
  orderId,
  amount,
  onDone,
  onCancel,
}: {
  orderId: string;
  amount: number;
  onDone: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (stripeError || paymentIntent?.status !== 'succeeded') {
      setError(stripeError?.message || 'お支払いが完了しませんでした。もう一度お試しください。');
      setProcessing(false);
      return;
    }

    // Flip the order to paid and push it into Square / Telegram. The Stripe
    // webhook is a backstop if this call never lands.
    const res = await fetch('/api/wholesale/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, paymentIntentId: paymentIntent.id }),
    });

    if (!res.ok) {
      setError('お支払いは完了しましたが、注文の確定処理に失敗しました。お手数ですが担当者までご連絡ください。');
      setProcessing(false);
      return;
    }

    onDone();
  }

  return (
    <main className="max-w-lg mx-auto px-6 py-14">
      <p className="text-[12px] text-[#8C7B6B] font-mono tracking-[0.18em] uppercase mb-2">Payment</p>
      <h1 className="text-[22px] text-[#2C2416] font-light tracking-[0.06em] mb-2">お支払い</h1>
      <p className="text-[13px] text-[#8C7B6B] font-mono mb-8">
        注文番号 {orderId} ／ {yen(amount)}（税込）
      </p>

      <form onSubmit={handlePay} className={`${panel} p-6 space-y-6`}>
        <PaymentElement />
        {error && (
          <p role="alert" className="text-[14px] text-[#A34A3A] font-light">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={!stripe || processing}
          className="w-full bg-[#7AAFC4] text-[#2C2416] font-mono text-[13px] tracking-[0.08em] uppercase px-8 py-3 rounded-sm hover:bg-[#6A9DB3] transition-colors disabled:opacity-50"
        >
          {processing ? 'お支払い処理中...' : `${yen(amount)} を支払う`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="w-full text-[12px] text-[#8C7B6B] font-mono tracking-[0.08em] uppercase hover:text-[#2C2416] transition-colors disabled:opacity-50"
        >
          注文内容に戻る
        </button>
      </form>
    </main>
  );
}

function OrderConfirmation({ confirmation, onReset }: { confirmation: Confirmation; onReset: () => void }) {
  return (
    <main className="max-w-lg mx-auto px-6 py-20 text-center">
      <p className="text-[12px] text-[#8C7B6B] font-mono tracking-[0.18em] uppercase mb-3">Order received</p>
      <h1 className="text-[24px] text-[#2C2416] font-light tracking-[0.06em] mb-6">ご注文ありがとうございます</h1>

      <div className={`${panel} p-8 text-left space-y-5`}>
        <div>
          <p className="text-[12px] text-[#8C7B6B] font-mono tracking-[0.08em] uppercase mb-1">注文番号</p>
          <p className="text-[17px] text-[#2C2416] font-mono">{confirmation.orderId}</p>
        </div>

        {confirmation.paymentMethod === 'bank_transfer' ? (
          <div className="space-y-3">
            <p className="text-[14px] text-[#2C2416] font-light">下記の口座にお振込みをお願いいたします。</p>
            <div className="space-y-2 text-[14px] text-[#8C7B6B]">
              <div className="flex justify-between"><span>銀行名:</span><span>住信SBIネット銀行</span></div>
              <div className="flex justify-between"><span>支店名:</span><span>法人第一支店</span></div>
              <div className="flex justify-between"><span>口座種別:</span><span>普通</span></div>
              <div className="flex justify-between"><span>口座番号:</span><span>2373525</span></div>
              <div className="flex justify-between"><span>口座名義:</span><span>フェリシティ</span></div>
              <div className="flex justify-between text-[#2C2416]">
                <span>お振込み金額:</span>
                <span className="font-mono">{yen(confirmation.amount)}</span>
              </div>
            </div>
            <div className="text-[13px] pt-4 border-t border-[#DDD5C5] space-y-2">
              <p className="text-[#B8860B]">ご注文から7日以内にお振込みください。</p>
              <p className="text-[#8C7B6B]">振込時のご依頼人名にご注文番号をご記載ください。</p>
              <p className="text-[#8C7B6B]">ご入金確認後、焙煎の手配をいたします（発送まで約{LEAD_TIME_DAYS}日）。</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-[14px] text-[#8C7B6B]">
            <p className="text-[#2C2416] font-light">お支払いが完了しました。</p>
            <div className="flex justify-between">
              <span>お支払い金額:</span>
              <span className="font-mono">{yen(confirmation.amount)}</span>
            </div>
            <p>焙煎の手配をいたします（発送まで約{LEAD_TIME_DAYS}日）。</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center gap-8">
        <a
          href="/wholesale/orders"
          className="text-[12px] text-[#8C7B6B] font-mono tracking-[0.08em] uppercase hover:text-[#2C2416] transition-colors"
        >
          注文履歴・納品書
        </a>
        <button
          type="button"
          onClick={onReset}
          className="text-[12px] text-[#8C7B6B] font-mono tracking-[0.08em] uppercase hover:text-[#2C2416] transition-colors"
        >
          続けて注文する
        </button>
      </div>
    </main>
  );
}
