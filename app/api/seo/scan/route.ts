import { NextRequest, NextResponse } from 'next/server';
import { crawlSite, checkLinks, MAX_PAGES } from '@/app/lib/seo/crawl';
import { runPageChecks } from '@/app/lib/seo/checks';
import { runLocalChecks } from '@/app/lib/seo/local';
import { runSchemaChecks } from '@/app/lib/seo/structured';
import { calculateScore, topThree } from '@/app/lib/seo/score';
import { fetchMapsHours } from '@/app/lib/seo/maps';
import type { ScanReport } from '@/app/lib/seo/types';

// クロール + 判定。PageSpeed は時間がかかるので別エンドポイントに分けている。
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const DEFAULT_TARGET = 'https://felicity.cafe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const target: string = body.target || DEFAULT_TARGET;

    // 自分のサイト専用ツール。他人のサイトを叩く踏み台にしない。
    const host = new URL(target).hostname;
    if (host !== 'felicity.cafe' && host !== 'www.felicity.cafe' && host !== 'localhost') {
      return NextResponse.json({ error: 'felicity.cafe 以外はスキャンできません' }, { status: 400 });
    }

    const { pages, errors, blocked, retryAfterSec } = await crawlSite(target, MAX_PAGES);

    // ボット対策に当たったら、途中までの結果で採点しない。
    // 取れなかったページは「問題なし」でも「問題あり」でもなく、ただ不明。
    // 中途半端なスコアを出すと、直す必要のないものを直させることになる。
    if (blocked) {
      return NextResponse.json(
        {
          code: 'challenged',
          scannedPages: pages.length,
          retryAfterSec,
        },
        { status: 503 }
      );
    }

    if (pages.length === 0) {
      return NextResponse.json(
        { code: 'no_pages', details: errors },
        { status: 502 }
      );
    }

    // リンク切れチェックは本数が多いと時間を食うので、
    // 内部リンク + 外部リンクを混ぜて上限を切る。
    const allLinks = [...new Set(pages.flatMap((p) => p.links))];
    const [linkResult, maps] = await Promise.all([checkLinks(allLinks), fetchMapsHours()]);
    const { broken, blockedUrls } = linkResult;

    const findings = [
      ...runPageChecks(pages, broken, blockedUrls),
      ...runLocalChecks(pages, maps),
      ...runSchemaChecks(pages, maps),
    ];

    const report: ScanReport = {
      scannedAt: new Date().toISOString(),
      baseUrl: target,
      score: calculateScore(findings),
      maps,
      pages,
      findings,
      top3: topThree(findings),
      errors,
    };

    // 保存は失敗してもスキャン結果は返す（履歴は機能8の範囲）。
    await saveScan(report).catch((e) => console.error('[seo] save failed:', e));

    return NextResponse.json(report);
  } catch (e) {
    console.error('[seo] scan failed:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'スキャンに失敗しました' },
      { status: 500 }
    );
  }
}

async function saveScan(report: ScanReport) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(url, key);

  // pages は重いので保存しない。スコア推移と項目の差分が追えれば十分。
  await supabase.from('seo_scans').insert({
    base_url: report.baseUrl,
    score: report.score,
    page_count: report.pages.length,
    findings: report.findings.map((f) => ({
      id: f.id,
      severity: f.severity,
      weight: f.weight,
      category: f.category,
      title_ja: f.ja.title,
    })),
  });
}
