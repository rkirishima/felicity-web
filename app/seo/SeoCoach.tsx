'use client';

import { useState } from 'react';
import { FindingCard } from './FindingCard';
import { GBP_CHECKLIST } from '@/app/lib/seo/local';
import { SchemaGenerator } from './SchemaGenerator';
import type { Finding, ScanReport } from '@/app/lib/seo/types';

type Lang = 'ja' | 'en';
type Tab = 'top' | 'page' | 'local' | 'schema' | 'gbp';

interface Speed {
  score: number;
  lcp: string | null;
  cls: string | null;
  tbt: string | null;
  heaviest: string | null;
}

const COPY = {
  ja: {
    appName: 'Felicity SEOコーチ',
    subtitle: 'felicity.cafe が検索で見つけてもらえているかを確認します',
    run: '今すぐチェック',
    running: 'チェック中…',
    rerun: 'もう一度チェック',
    scoreLabel: '総合スコア',
    never: 'まだチェックしていません',
    top3: '今週直すべきトップ3',
    allGood: '直すべき大きな問題は見つかりませんでした。',
    tabs: { top: 'トップ3', page: 'サイト', local: 'お店の情報', schema: 'Google向けデータ', gbp: 'Googleマップ' },
    speed: 'スマホでの表示速度',
    speedHint: 'Googleの計測で0〜100点。50点未満だと、待てずに閉じるお客様が出ます。',
    measuring: '計測中…（30秒ほどかかります）',
    pagesChecked: 'ページを確認しました',
    gbpTitle: 'Googleビジネスプロフィールでやること',
    gbpHint: 'ここはサイトからは確認できません。Googleマップの管理画面を開いて、上から順に確認してください。',
    lcp: '一番大きい部分が出るまで',
    cls: '表示のガタつき',
    tbt: '操作できるまでの待ち',
    error: 'チェックに失敗しました',
    speedFailed: '表示速度を計測できませんでした',
    speedRateLimited: 'Googleの計測が1日の上限に達しました。明日になれば計測できます。',
    speedKeyHint:
      '表示速度だけはGoogleの無料計測を使っており、鍵なしだと1日の回数制限にすぐ当たります。他の項目の結果には影響しません。',
    retry: '速度だけもう一度',
  },
  en: {
    appName: 'Felicity SEO Coach',
    subtitle: 'Checks whether felicity.cafe can be found in search',
    run: 'Check now',
    running: 'Checking…',
    rerun: 'Check again',
    scoreLabel: 'Overall score',
    never: 'Not checked yet',
    top3: 'Top 3 to fix this week',
    allGood: 'No major problems found.',
    tabs: { top: 'Top 3', page: 'Site', local: 'Shop info', schema: 'Google data', gbp: 'Google Maps' },
    speed: 'Mobile loading speed',
    speedHint: 'Scored 0–100 by Google. Below 50, visitors give up waiting.',
    measuring: 'Measuring… (takes about 30 seconds)',
    pagesChecked: 'pages checked',
    gbpTitle: 'What to do in Google Business Profile',
    gbpHint: 'This cannot be checked from the website. Open Google Maps admin and work down the list.',
    lcp: 'Largest content appears',
    cls: 'Layout shifting',
    tbt: 'Wait before it responds',
    error: 'The check failed',
    speedFailed: 'Could not measure loading speed',
    speedRateLimited: "Google's daily measurement limit was reached. It will work again tomorrow.",
    speedKeyHint:
      "Loading speed uses Google's free measurement, which hits a daily limit without a key. Nothing else in this report is affected.",
    retry: 'Retry speed only',
  },
} as const;

function scoreVerdict(score: number, lang: Lang): { label: string; color: string } {
  if (score >= 85) return { label: lang === 'ja' ? 'とても良い' : 'Very good', color: '#5E9E7E' };
  if (score >= 70) return { label: lang === 'ja' ? 'まずまず' : 'Decent', color: '#7AAFC4' };
  if (score >= 50) return { label: lang === 'ja' ? '要改善' : 'Needs work', color: '#D4A24C' };
  return { label: lang === 'ja' ? '今すぐ対応' : 'Act now', color: '#C96A5B' };
}

function ScoreRing({ score, lang }: { score: number; lang: Lang }) {
  const { label, color } = scoreVerdict(score, lang);
  const r = 54;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-6">
      <svg width="132" height="132" viewBox="0 0 132 132" aria-hidden>
        <circle cx="66" cy="66" r={r} fill="none" stroke="#DDD5C5" strokeWidth="10" />
        <circle
          cx="66"
          cy="66"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          transform="rotate(-90 66 66)"
        />
        <text x="66" y="72" textAnchor="middle" fontSize="34" fill="#2C2416" fontWeight="300">
          {score}
        </text>
      </svg>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8C7B6B]">
          {COPY[lang].scoreLabel}
        </p>
        <p className="mt-1 text-[26px] font-light" style={{ color }}>
          {label}
        </p>
      </div>
    </div>
  );
}

export function SeoCoach() {
  const [lang, setLang] = useState<Lang>('ja');
  const [report, setReport] = useState<ScanReport | null>(null);
  const [speed, setSpeed] = useState<Speed | null>(null);
  const [speedError, setSpeedError] = useState<string | null>(null);
  const [speedLoading, setSpeedLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('top');

  const t = COPY[lang];

  const run = async () => {
    setLoading(true);
    setError(null);
    setSpeed(null);
    try {
      const res = await fetch('/api/seo/scan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ target: 'https://felicity.cafe' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.error);
      setReport(data);
      setTab('top');
      measureSpeed();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
    } finally {
      setLoading(false);
    }
  };

  const measureSpeed = async () => {
    setSpeedLoading(true);
    setSpeedError(null);
    try {
      const res = await fetch('/api/seo/speed?url=https://felicity.cafe');
      const data = await res.json();
      if (res.ok) setSpeed(data);
      else setSpeedError(data.code === 'rate_limited' ? 'rate_limited' : 'failed');
    } catch {
      setSpeedError('failed');
    } finally {
      setSpeedLoading(false);
    }
  };

  const byCategory = (c: Finding['category']) =>
    (report?.findings ?? []).filter((f) => f.category === c);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[clamp(26px,5vw,36px)] font-light leading-tight">{t.appName}</h1>
          <p className="mt-2 text-[14px] text-[#5C5248]">{t.subtitle}</p>
        </div>
        <div className="flex shrink-0 overflow-hidden rounded-sm border border-[#DDD5C5]">
          {(['ja', 'en'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
                lang === l ? 'bg-[#7AAFC4] text-[#2C2416]' : 'bg-[#EDE5D8] text-[#8C7B6B]'
              }`}
            >
              {l === 'ja' ? '日本語' : 'EN'}
            </button>
          ))}
        </div>
      </div>

      {/* スコア + 実行 */}
      <div className="mt-8 rounded-lg border border-[#DDD5C5] bg-[#EDE5D8] p-6">
        {report ? (
          <ScoreRing score={report.score} lang={lang} />
        ) : (
          <p className="text-[15px] text-[#8C7B6B]">{t.never}</p>
        )}

        <button
          onClick={run}
          disabled={loading}
          className="mt-6 w-full rounded-sm bg-[#2C2416] px-6 py-4 font-mono text-[12px] uppercase tracking-[0.14em] text-[#F4EFE4] transition-colors hover:bg-[#7AAFC4] hover:text-[#2C2416] disabled:opacity-50"
        >
          {loading ? t.running : report ? t.rerun : t.run}
        </button>

        {report && (
          <p className="mt-3 text-center font-mono text-[10px] tracking-[0.1em] text-[#8C7B6B]">
            {report.pages.length} {t.pagesChecked} ·{' '}
            {new Date(report.scannedAt).toLocaleString(lang === 'ja' ? 'ja-JP' : 'en-US')}
          </p>
        )}
        {error && <p className="mt-3 text-[14px] text-[#C96A5B]">{error}</p>}
      </div>

      {/* 表示速度 */}
      {(speed || speedLoading || speedError) && (
        <div className="mt-5 rounded-lg border border-[#DDD5C5] bg-[#EDE5D8] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8C7B6B]">{t.speed}</p>
          {speedLoading && !speed ? (
            <p className="mt-2 text-[14px] text-[#5C5248]">{t.measuring}</p>
          ) : speed ? (
            <>
              <p
                className="mt-1 text-[32px] font-light"
                style={{ color: scoreVerdict(speed.score, lang).color }}
              >
                {speed.score}
                <span className="ml-1 text-[14px] text-[#8C7B6B]">/ 100</span>
              </p>
              <p className="mt-1 text-[13px] text-[#5C5248]">{t.speedHint}</p>
              <dl className="mt-4 grid grid-cols-3 gap-3 text-[12px]">
                {[
                  [t.lcp, speed.lcp],
                  [t.cls, speed.cls],
                  [t.tbt, speed.tbt],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <dt className="text-[#8C7B6B]">{k}</dt>
                    <dd className="mt-0.5 text-[#2C2416]">{v ?? '—'}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <>
              <p className="mt-2 text-[14px] text-[#C96A5B]">
                {speedError === 'rate_limited' ? t.speedRateLimited : t.speedFailed}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-[#5C5248]">{t.speedKeyHint}</p>
              <button
                onClick={measureSpeed}
                className="mt-3 rounded-sm bg-[#DDD5C5] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[#5C5248] transition-colors hover:bg-[#7AAFC4] hover:text-[#2C2416]"
              >
                {t.retry}
              </button>
            </>
          )}
        </div>
      )}

      {/* タブ */}
      {report && (
        <>
          <div className="mt-8 flex flex-wrap gap-2">
            {(['top', 'page', 'local', 'schema', 'gbp'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-sm px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
                  tab === key
                    ? 'bg-[#2C2416] text-[#F4EFE4]'
                    : 'bg-[#EDE5D8] text-[#8C7B6B] hover:bg-[#DDD5C5]'
                }`}
              >
                {t.tabs[key]}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            {tab === 'top' && (
              <>
                <h2 className="text-[20px] font-light">{t.top3}</h2>
                {report.top3.length === 0 ? (
                  <p className="text-[15px] text-[#5C5248]">{t.allGood}</p>
                ) : (
                  report.top3.map((f, i) => (
                    <div key={f.id}>
                      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8C7B6B]">
                        {i + 1}
                      </p>
                      <FindingCard finding={f} lang={lang} />
                    </div>
                  ))
                )}
              </>
            )}

            {tab === 'page' && byCategory('page').map((f) => <FindingCard key={f.id} finding={f} lang={lang} />)}
            {tab === 'local' && byCategory('local').map((f) => <FindingCard key={f.id} finding={f} lang={lang} />)}
            {tab === 'schema' && (
              <>
                {byCategory('schema').map((f) => (
                  <FindingCard key={f.id} finding={f} lang={lang} />
                ))}
                <div className="pt-4">
                  <SchemaGenerator lang={lang} />
                </div>
              </>
            )}

            {tab === 'gbp' && (
              <>
                <h2 className="text-[20px] font-light">{t.gbpTitle}</h2>
                <p className="text-[14px] text-[#5C5248]">{t.gbpHint}</p>
                {GBP_CHECKLIST.map((item) => (
                  <div key={item.id} className="rounded-lg border border-[#DDD5C5] bg-[#EDE5D8] p-5">
                    <h3 className="text-[16px] font-medium">☐ {item[lang].title}</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-[#5C5248]">{item[lang].impact}</p>
                    <p className="mt-2 text-[14px] leading-relaxed text-[#2C2416]">{item[lang].action}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
