import { NextRequest, NextResponse } from 'next/server';

// PageSpeed Insights(モバイル)。1URLで15〜30秒かかるので、
// スキャン本体とは分けて画面から後追いで呼ぶ。
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get('url');
  if (!target) return NextResponse.json({ error: 'url is required' }, { status: 400 });

  const host = new URL(target).hostname;
  if (host !== 'felicity.cafe' && host !== 'www.felicity.cafe') {
    return NextResponse.json({ error: 'felicity.cafe 以外は計測できません' }, { status: 400 });
  }

  const api = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  api.searchParams.set('url', target);
  api.searchParams.set('strategy', 'mobile');
  api.searchParams.set('category', 'performance');
  // キーが無くても動くが、連続実行すると 429 になる。
  if (process.env.PAGESPEED_API_KEY) api.searchParams.set('key', process.env.PAGESPEED_API_KEY);

  try {
    const res = await fetch(api.toString(), { cache: 'no-store' });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      // 文面は画面側が言語に合わせて出す。ここはコードだけ返す。
      return NextResponse.json(
        {
          code: res.status === 429 ? 'rate_limited' : 'failed',
          status: res.status,
          detail: detail.slice(0, 300),
        },
        { status: 502 }
      );
    }

    const data = await res.json();
    const audits = data.lighthouseResult?.audits ?? {};
    const score = Math.round((data.lighthouseResult?.categories?.performance?.score ?? 0) * 100);

    return NextResponse.json({
      url: target,
      score,
      lcp: audits['largest-contentful-paint']?.displayValue ?? null,
      cls: audits['cumulative-layout-shift']?.displayValue ?? null,
      tbt: audits['total-blocking-time']?.displayValue ?? null,
      /** 一番重い読み込み物。動画や写真の指摘に使う */
      heaviest:
        (audits['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.nodeLabel as
          | string
          | undefined) ?? null,
    });
  } catch (e) {
    return NextResponse.json(
      { code: 'failed', detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
