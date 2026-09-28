// 業販ページの共通パーツ。
//
// 公開ページ(/wholesale)とログイン後の注文画面(/wholesale/order)で同じ読み物を
// 出すため、値段に関係しない部分だけをここに集めてある。クライアント側の状態を
// 持たないので、サーバーコンポーネントからも注文画面からも読める。

import Image from 'next/image';
import {
  MIN_CUSTOM_BLEND_KG,
  type RoastLabel,
  type WholesaleBean,
} from '@/app/lib/wholesale';

// 味わいマップの点の色。焙煎が深くなるほど濃くする。
export const ROAST_DOT: Record<RoastLabel, string> = {
  シティ: '#B08D57',
  フルシティ: '#6B4A2F',
  ダークロースト: '#3F2A1A',
};

// 印刷版ガイドと揃えた配色。紙の地色に、焙煎の深さを思わせる緑を一色だけ差す。
export const INK = '#2C2416';
export const MUTED = '#8C7B6B';
export const GREEN = '#2E4A3E';

export const panel = 'bg-[#EDE5D8] rounded-sm';
export const eyebrow = 'font-mono text-[11px] tracking-[0.24em] uppercase text-[#8C7B6B]';

// --- Story ---------------------------------------------------------------

export function Hero() {
  return (
    <section className="max-w-5xl mx-auto px-6 pt-20 pb-4">
      <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-10 lg:gap-14 items-center">
        <div>
          <p className={eyebrow}>Coffee made for your place.</p>
          <h1 className="mt-5 text-[clamp(28px,4.4vw,48px)] font-light text-[#2C2416] tracking-tight leading-[1.25]">
            葉山から、
            <br />
            そのお店らしい一杯を。
          </h1>
          <div className="mt-8 space-y-4 text-[15px] text-[#2C2416] font-light leading-[1.9]">
            <p>
              FELICITY COFFEE ROASTERS は、神奈川県葉山町に店舗と自社焙煎所を持つ
              コーヒーロースターです。世界各地の個性あるシングルオリジンを選び、
              葉山で一つひとつ焙煎しています。
            </p>
            <p className="text-[#8C7B6B]">
              料理、空間、お客様、提供方法。大切にしたいことを伺いながら、
              そのお店に合う一杯を、一緒につくります。
            </p>
          </div>
        </div>

        <Image
          src="/images/wholesale/storefront.jpg"
          alt="葉山の FELICITY COFFEE ROASTERS 店舗外観"
          width={960}
          height={1200}
          priority
          sizes="(max-width: 1024px) 100vw, 420px"
          className="w-full h-auto rounded-sm"
        />
      </div>
    </section>
  );
}

const WHY = [
  { no: '01', en: 'Roasted in Hayama', ja: '葉山の自社焙煎所から', body: '一つひとつ焙煎し、お店の一杯へつなぎます。' },
  { no: '02', en: 'Single Origin', ja: '世界各地の個性を選ぶ', body: '約10種類の中から、目指す味わいをご相談。' },
  { no: '03', en: 'Roast Customization', ja: '抽出に合わせる焙煎', body: 'ライト〜フレンチまで、提供スタイルに応じて調整。' },
  { no: '04', en: 'Original Blend', ja: 'その店だけのブレンド', body: `料理やお客様に合わせ、専用のコーヒーを開発（${MIN_CUSTOM_BLEND_KG}kg〜）。` },
  { no: '05', en: 'Brewing Support', ja: '淹れ方から考える提案', body: 'レシピ作成、スタッフへのご説明、豆紹介文のご提供まで。' },
  { no: '06', en: 'Flexible Delivery', ja: '使いやすい形でお届け', body: '豆・粉・個包装に対応。挽き目も指定できます。' },
];

export function WhyFelicity() {
  return (
    <section className="max-w-5xl mx-auto px-6 pt-20">
      <p className={eyebrow}>Why Felicity</p>
      <h2 className="mt-3 text-[clamp(24px,3.4vw,34px)] font-light text-[#2C2416] tracking-tight">
        お店に合わせて、選べる・つくれる。
      </h2>

      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-9">
        {WHY.map((item) => (
          <div key={item.no} className="border-t border-[#DDD5C5] pt-5">
            <p className="font-mono text-[18px] font-light" style={{ color: GREEN }}>{item.no}</p>
            <p className="mt-2 font-mono text-[10px] tracking-[0.18em] uppercase text-[#8C7B6B]">{item.en}</p>
            <p className="mt-2 text-[16px] text-[#2C2416] font-light">{item.ja}</p>
            <p className="mt-2 text-[13px] text-[#8C7B6B] font-light leading-relaxed">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function RoastingQuality() {
  const specs = [
    { en: 'Equipment', body: 'PROBAT P05III（5kg）／ ROEST L100 Plus（サンプルロースト用）' },
    { en: 'Roast Log', body: '投入温度・1ハゼ・ドロップ温度・DTR などを全ロットで記録' },
    { en: 'Custom Roast', body: '受注内容に合わせ、ライト〜フレンチまでご相談いただけます' },
  ];

  return (
    <section className="max-w-5xl mx-auto px-6 pt-20">
      <p className={eyebrow}>Roasting &amp; Quality</p>
      <h2 className="mt-3 text-[clamp(24px,3.4vw,34px)] font-light text-[#2C2416] tracking-tight">
        いつもの一杯を、安定して。
      </h2>

      <div className="mt-10 grid lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)] gap-8 lg:gap-12">
        <Image
          src="/images/wholesale/roasting-trier.jpg"
          alt="PROBAT P05III の前で、トライヤーに取った豆の香りを確認しているところ"
          width={619}
          height={1100}
          sizes="(max-width: 1024px) 100vw, 380px"
          className="w-full h-auto rounded-sm"
        />

        <div>
          <Image
            src="/images/wholesale/roasting.jpg"
            alt="焙煎カーブを見ながらプロファイルを調整しているところ"
            width={1100}
            height={733}
            sizes="(max-width: 1024px) 100vw, 560px"
            className="w-full h-auto rounded-sm"
          />

          <p className="mt-6 font-mono text-[10px] tracking-[0.18em] uppercase text-[#8C7B6B]">
            Roasted in Hayama
          </p>
          <p className="mt-3 text-[15px] text-[#2C2416] font-light leading-[1.9]">
            全ロットの焙煎記録をもとに、同じプロファイルで再現します。
            お店が大切にする味わいを、日々の提供につなげます。
          </p>

          <dl className="mt-6">
            {specs.map((spec) => (
              <div key={spec.en} className="border-t border-[#DDD5C5] py-4">
                <dt className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#8C7B6B]">{spec.en}</dt>
                <dd className="mt-1.5 text-[14px] text-[#2C2416] font-light leading-relaxed">{spec.body}</dd>
              </div>
            ))}
          </dl>

          <p className="text-[12px] text-[#8C7B6B] font-light">
            ご指定がない場合は、各銘柄の FELICITY 標準プロファイルで焙煎します。
          </p>
        </div>
      </div>
    </section>
  );
}

// 印刷版ガイドの COFFEE MAP と同じ二軸。x: 軽やか↔重厚、y: 深み↔華やか。
export function FlavourMap({ beans }: { beans: WholesaleBean[] }) {
  const W = 620;
  const H = 460;
  const cx = W / 2;
  const cy = H / 2;
  const sx = 232;
  const sy = 178;

  // 近い点どうしでラベルが重なるので、混み合う銘柄だけ上に出し、左右にも逃がす。
  // 座標を持たない銘柄（取引先限定で紹介文のない豆）はマップに出さない。
  const plotted = beans.filter(
    (bean): bean is WholesaleBean & { map: { x: number; y: number } } => Boolean(bean.map),
  );

  const LABEL_NUDGE: Record<string, { above?: boolean; dx?: number; dy?: number }> = {
    'yemen-white-camel-matari': { above: true },
    'ethiopia-yirgacheffe-g1': { above: true, dx: -40 },
    // イルガチェフェとラ・ファニーに挟まれるので、上へ逃がしたうえで左へずらす。
    'png-baroida': { above: true, dx: -46, dy: -16 },
    'india-attikan': { above: true, dx: 46 },
    'el-salvador-la-fany': { dx: -14 },
  };

  return (
    <section className="max-w-5xl mx-auto px-6 pt-20">
      <p className={eyebrow}>Coffee Map</p>
      <h2 className="mt-3 text-[clamp(24px,3.4vw,34px)] font-light text-[#2C2416] tracking-tight">
        お店の一杯を、味わいから探す。
      </h2>

      <div className={`${panel} mt-8 p-4 sm:p-8`}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="銘柄の味わいマップ">
          <line x1={cx} y1={28} x2={cx} y2={H - 28} stroke="#DDD5C5" strokeWidth="1" />
          <line x1={28} y1={cy} x2={W - 28} y2={cy} stroke="#DDD5C5" strokeWidth="1" />

          <text x={cx} y={16} textAnchor="middle" fontSize="12" fill={MUTED}>華やか</text>
          <text x={cx} y={H - 6} textAnchor="middle" fontSize="12" fill={MUTED}>深み</text>
          <text x={6} y={cy - 8} fontSize="12" fill={MUTED}>軽やか</text>
          <text x={W - 6} y={cy - 8} textAnchor="end" fontSize="12" fill={MUTED}>重厚</text>

          {plotted.map((bean) => {
            const x = cx + bean.map.x * sx;
            const y = cy - bean.map.y * sy;
            const nudge = LABEL_NUDGE[bean.slug] ?? {};
            const above = nudge.above ?? false;
            const lx = x + (nudge.dx ?? 0);
            const ly = y + (nudge.dy ?? 0);
            const fill = ROAST_DOT[bean.roast ?? 'フルシティ'];
            return (
              <g key={bean.slug}>
                <circle cx={x} cy={y} r="13" fill="none" stroke="#DDD5C5" strokeWidth="1" />
                <circle cx={x} cy={y} r="7" fill={fill} />
                <text
                  x={lx}
                  y={above ? ly - 22 : ly + 30}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill={INK}
                >
                  {bean.origin}
                </text>
                <text
                  x={lx}
                  y={above ? ly - 10 : ly + 42}
                  textAnchor="middle"
                  fontSize="10"
                  fill={MUTED}
                >
                  {bean.name}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-[#8C7B6B] font-light">
          {/* 凡例に出すのは、いま並んでいる銘柄で実際に使っている焙煎度だけ。 */}
          {(Object.keys(ROAST_DOT) as RoastLabel[])
            .filter((roast) => plotted.some((bean) => (bean.roast ?? 'フルシティ') === roast))
            .map((roast) => (
              <span key={roast} className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: ROAST_DOT[roast] }} />
                標準焙煎 {roast}
              </span>
            ))}
          <span>焙煎度合いはご相談に応じて調整できます。</span>
        </div>
      </div>
    </section>
  );
}

// --- 公開ページ用の銘柄カード -------------------------------------------
//
// 値段と数量の指定を出さない版。産地の話だけを読んでもらい、価格は
// お問い合わせに回す。ログイン後のカード(BeanCard)と揃えてある。
export function PublicBeanCard({ bean }: { bean: WholesaleBean }) {
  return (
    <article className={`${panel} p-6 sm:p-8`}>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,0.85fr)] gap-6 lg:gap-10">
        <div>
          <p className="font-mono text-[12px] tracking-[0.14em] uppercase text-[#2C2416]">{bean.origin}</p>
          <h3 className="mt-1 text-[21px] font-light" style={{ color: GREEN }}>{bean.name}</h3>
          <p className="mt-1 text-[13px] text-[#8C7B6B] font-light">{bean.nameJa}</p>
          {bean.roast && (
            <p className="mt-3 text-[12px] font-light" style={{ color: '#9A7B3F' }}>
              標準焙煎：{bean.roast}
            </p>
          )}
        </div>

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
    </article>
  );
}
