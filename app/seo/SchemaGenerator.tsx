'use client';

import { useState } from 'react';
import { products } from '@/app/lib/products';
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildCafeSchema,
  buildEventSchema,
  buildOrganizationSchema,
  buildProductSchema,
} from '@/app/lib/seo/structured';
import type { MapsHours } from '@/app/lib/seo/maps';

type Lang = 'ja' | 'en';

const json = (o: unknown) => JSON.stringify(o, null, 2);

/**
 * チェック結果と関係なく、いつでも貼れる JSON-LD を出す。
 * 全部が緑でも「新しい豆を足したからコードが欲しい」という使い方があるため。
 */
export function SchemaGenerator({ lang, maps }: { lang: Lang; maps: MapsHours | null }) {
  const isEn = lang === 'en';
  const [bean, setBean] = useState(products[0].slug);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selected = products.find((p) => p.slug === bean) ?? products[0];

  const blocks = [
    {
      id: 'cafe',
      ja: '店舗情報（トップページ用）',
      en: 'Shop info (for the homepage)',
      noteJa: maps
        ? 'Googleマップの営業時間がそのまま入っています。マップを更新したらここを取り直してください。'
        : 'Googleマップと接続していないため、営業時間は入っていません。間違った時間を載せないよう、あえて空にしています。',
      noteEn: maps
        ? 'Hours come straight from Google Maps. Re-copy this after you update Maps.'
        : 'Not connected to Google Maps, so hours are left out on purpose rather than risking wrong ones.',
      code: json(buildCafeSchema(maps)),
    },
    {
      id: 'product',
      ja: '豆の商品ページ用',
      en: 'Bean product page',
      noteJa: '下の選択で豆を切り替えられます。',
      noteEn: 'Switch beans with the selector below.',
      code: json(buildProductSchema(selected)),
      picker: true,
    },
    { id: 'org', ja: '会社情報', en: 'Organisation', code: json(buildOrganizationSchema()) },
    {
      id: 'event',
      ja: 'ワークショップ・イベント用',
      en: 'Workshop / event',
      noteJa: '日付・名前・料金を実際のものに書き換えてください。',
      noteEn: 'Replace the date, name and price with the real ones.',
      code: json(buildEventSchema()),
    },
    {
      id: 'article',
      ja: 'ニュース記事用',
      en: 'News article',
      noteJa: 'タイトルと日付を実際のものに書き換えてください。',
      noteEn: 'Replace the headline and date with the real ones.',
      code: json(buildArticleSchema()),
    },
    {
      id: 'breadcrumb',
      ja: '現在地の案内（パンくず）',
      en: 'Breadcrumb trail',
      code: json(buildBreadcrumbSchema()),
    },
  ];

  const copy = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[20px] font-light">
          {isEn ? 'Ready-to-paste code' : 'そのまま貼れるコード'}
        </h2>
        <p className="mt-1 text-[14px] leading-relaxed text-[#5C5248]">
          {isEn
            ? 'Copy a block and paste it into the page. Use this when you add a new bean, workshop or article.'
            : '新しい豆・ワークショップ・記事を足したときは、ここからコードをコピーして貼ってください。'}
        </p>
      </div>

      {blocks.map((b) => (
        <div key={b.id} className="rounded-lg border border-[#DDD5C5] bg-[#EDE5D8] p-5">
          <h3 className="text-[16px] font-medium">{isEn ? b.en : b.ja}</h3>
          {(b.noteJa || b.noteEn) && (
            <p className="mt-1 text-[13px] text-[#5C5248]">{isEn ? b.noteEn : b.noteJa}</p>
          )}

          {b.picker && (
            <select
              value={bean}
              onChange={(e) => setBean(e.target.value)}
              className="mt-3 w-full rounded border border-[#DDD5C5] bg-white px-3 py-2 text-[13px] text-[#2C2416]"
            >
              {products.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name} — {p.price}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => copy(b.id, b.code)}
            className={`mt-3 rounded-sm px-4 py-2 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
              copiedId === b.id
                ? 'bg-[#7AAFC4] text-[#2C2416]'
                : 'bg-[#DDD5C5] text-[#5C5248] hover:bg-[#7AAFC4] hover:text-[#2C2416]'
            }`}
          >
            {copiedId === b.id ? (isEn ? '✓ Copied' : '✓ コピーしました') : isEn ? 'Copy' : 'コピー'}
          </button>

          <pre className="mt-3 max-h-64 overflow-auto rounded border border-[#DDD5C5] bg-[#F4EFE4] p-3 text-[11px] leading-relaxed text-[#5C5248]">
            {b.code}
          </pre>
        </div>
      ))}
    </div>
  );
}
