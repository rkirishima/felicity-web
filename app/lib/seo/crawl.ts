// サイトのクロール。robots.txt を読み、sitemap.xml からURLを拾い、
// 1ページずつ間隔を空けて取得する。自社サイト向けだが、行儀は守る。

import * as cheerio from 'cheerio';
import type { PageSnapshot } from './types';

const UA = 'FelicitySEOCoach/1.0 (+https://felicity.cafe)';
/**
 * 1リクエストごとの待ち時間(ms)。
 * 250ms で 24ページ + リンク確認を連続で叩いたところ、Vercel のボット対策
 * （x-vercel-mitigated: challenge）に当たって全ページ 403 になった。
 * 自分のサイトを自分で締め出しては意味がないので、間隔を広げている。
 */
const DELAY_MS = 500;
const LINK_DELAY_MS = 250;
/** 1回のスキャンで見る最大ページ数。Vercel の実行時間内に収める。 */
export const MAX_PAGES = 24;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * ボット対策のチャレンジに当たったか。
 *
 * これを「リンク切れ」や「ページ取得失敗」として扱うと、実際には健全な
 * サイトに赤い指摘が並んでしまう。誤った結果を出すくらいなら、
 * 止まったことをそのまま伝えるほうがよい。
 */
export function isChallenge(res: Response, body?: string): boolean {
  if (res.headers.get('x-vercel-mitigated') === 'challenge') return true;
  if (res.headers.get('cf-mitigated') === 'challenge') return true;
  if (res.status === 429) return true;
  if (res.status === 403 && body) {
    return /Vercel Security Checkpoint|Just a moment|cf-browser-verification|Attention Required/i.test(
      body
    );
  }
  return false;
}

async function get(url: string, timeoutMs = 10_000): Promise<Response> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers: { 'user-agent': UA },
      signal: ac.signal,
      cache: 'no-store',
      redirect: 'follow',
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * robots.txt の Disallow を読む。ワイルドカードは扱わず前方一致のみ——
 * 自社サイトの単純な robots.txt を尊重できれば十分で、独自解釈で
 * 「読めるはずのページを読まない」事故のほうが困る。
 */
export async function fetchDisallows(baseUrl: string): Promise<string[]> {
  try {
    const res = await get(new URL('/robots.txt', baseUrl).toString(), 5000);
    if (!res.ok) return [];
    const txt = await res.text();
    const out: string[] = [];
    let appliesToUs = false;
    for (const rawLine of txt.split('\n')) {
      const line = rawLine.split('#')[0].trim();
      if (!line) continue;
      const [kRaw, ...rest] = line.split(':');
      const k = kRaw.trim().toLowerCase();
      const v = rest.join(':').trim();
      if (k === 'user-agent') appliesToUs = v === '*';
      else if (k === 'disallow' && appliesToUs && v) out.push(v);
    }
    return out;
  } catch {
    return [];
  }
}

export function isDisallowed(path: string, disallows: string[]): boolean {
  return disallows.some((d) => path.startsWith(d));
}

/** sitemap.xml から URL を拾う。sitemap index にも一段だけ追従する。 */
export async function fetchSitemapUrls(baseUrl: string): Promise<string[]> {
  const seen = new Set<string>();
  const read = async (sitemapUrl: string, depth = 0): Promise<void> => {
    if (depth > 1) return;
    const res = await get(sitemapUrl, 8000);
    if (!res.ok) return;
    const xml = await res.text();
    const $ = cheerio.load(xml, { xml: true });

    const nested = $('sitemapindex > sitemap > loc')
      .map((_, el) => $(el).text().trim())
      .get();
    for (const n of nested) {
      await sleep(DELAY_MS);
      await read(n, depth + 1);
    }

    $('urlset > url > loc').each((_, el) => {
      const loc = $(el).text().trim();
      if (loc) seen.add(loc);
    });
  };

  try {
    await read(new URL('/sitemap.xml', baseUrl).toString());
  } catch {
    /* sitemap が無くても下でトップページから辿る */
  }
  return [...seen];
}

function absolute(href: string, pageUrl: string): string | null {
  try {
    const u = new URL(href, pageUrl);
    u.hash = '';
    return u.toString();
  } catch {
    return null;
  }
}

export function parsePage(url: string, status: number, html: string): PageSnapshot {
  const $ = cheerio.load(html);
  const path = new URL(url).pathname;

  const og: Record<string, string> = {};
  $('meta[property^="og:"], meta[name^="og:"]').each((_, el) => {
    const key = $(el).attr('property') || $(el).attr('name');
    const content = $(el).attr('content');
    if (key && content) og[key] = content;
  });

  const hreflang: Record<string, string> = {};
  $('link[rel="alternate"][hreflang]').each((_, el) => {
    const lang = $(el).attr('hreflang');
    const href = $(el).attr('href');
    if (lang && href) hreflang[lang] = href;
  });

  const jsonLd: unknown[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    if (!raw.trim()) return;
    try {
      const parsed = JSON.parse(raw);
      // @graph でまとめている場合は中身を個別に見たい
      if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { '@graph'?: unknown[] })['@graph'])) {
        jsonLd.push(...(parsed as { '@graph': unknown[] })['@graph']);
      } else if (Array.isArray(parsed)) {
        jsonLd.push(...parsed);
      } else {
        jsonLd.push(parsed);
      }
    } catch {
      jsonLd.push({ __parseError: true, raw: raw.slice(0, 200) });
    }
  });

  const images = $('img')
    .map((_, el) => ({
      src: absolute($(el).attr('src') || '', url) || ($(el).attr('src') ?? ''),
      // alt 属性が無い(undefined)と alt="" は意味が違う。前者だけを指摘したいので
      // null と '' を区別して持つ。
      alt: $(el).attr('alt') ?? null,
    }))
    .get()
    .filter((i) => i.src);

  const videos = $('video')
    .map((_, el) => {
      const direct = $(el).attr('src');
      const fromSource = $(el).find('source').attr('src');
      return {
        src: absolute(direct || fromSource || '', url) || '',
        preload: $(el).attr('preload') ?? null,
      };
    })
    .get()
    .filter((v) => v.src);

  const links = [
    ...new Set(
      $('a[href]')
        .map((_, el) => absolute($(el).attr('href') || '', url))
        .get()
        .filter((h): h is string => Boolean(h) && (h!.startsWith('http://') || h!.startsWith('https://')))
    ),
  ];

  const mapEmbeds = $('iframe[src*="google.com/maps"], iframe[src*="maps.google"]')
    .map((_, el) => $(el).attr('src') || '')
    .get()
    .filter(Boolean);

  // 本文テキスト。NAP(住所・電話・営業時間)照合に使うので、
  // script/style を落としたうえで空白を正規化する。
  $('script, style, noscript').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 20_000);

  return {
    url,
    path,
    status,
    locale: path === '/en' || path.startsWith('/en/') ? 'en' : 'ja',
    title: $('title').first().text().trim() || null,
    description: $('meta[name="description"]').attr('content')?.trim() || null,
    canonical: $('link[rel="canonical"]').attr('href')?.trim() || null,
    robots: $('meta[name="robots"]').attr('content')?.trim() || null,
    h1: $('h1').map((_, el) => $(el).text().trim()).get().filter(Boolean),
    og,
    hreflang,
    images,
    links,
    videos,
    jsonLd,
    mapEmbeds,
    text,
    htmlBytes: Buffer.byteLength(html, 'utf8'),
  };
}

export interface CrawlResult {
  pages: PageSnapshot[];
  errors: string[];
  /** ボット対策に当たって途中で打ち切ったか */
  blocked: boolean;
  /** 何秒後に再試行すればよいか（Retry-After があれば） */
  retryAfterSec: number | null;
}

export async function crawlSite(baseUrl: string, limit = MAX_PAGES): Promise<CrawlResult> {
  const origin = new URL(baseUrl).origin;
  const disallows = await fetchDisallows(origin);
  const errors: string[] = [];

  const fromSitemap = (await fetchSitemapUrls(origin)).filter((u) => u.startsWith(origin));
  // sitemap があってもトップは必ず見る。無ければトップから辿る。
  const queue: string[] = [...new Set([origin + '/', ...fromSitemap])];

  const pages: PageSnapshot[] = [];
  const visited = new Set<string>();
  let blocked = false;
  let retryAfterSec: number | null = null;

  while (queue.length && pages.length < limit && !blocked) {
    const url = queue.shift()!;
    const normalized = url.replace(/\/$/, '') || origin;
    if (visited.has(normalized)) continue;
    visited.add(normalized);

    const path = new URL(url).pathname;
    if (isDisallowed(path, disallows)) continue;

    try {
      await sleep(DELAY_MS);
      const res = await get(url);
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('text/html')) continue;
      const html = await res.text();

      // チャレンジに当たったら即座に打ち切る。待たされている相手に
      // 残りを投げ続けても通らないし、対策を強めるだけ。
      if (isChallenge(res, html)) {
        blocked = true;
        const ra = res.headers.get('retry-after');
        retryAfterSec = ra && /^\d+$/.test(ra) ? Number(ra) : null;
        break;
      }

      const snap = parsePage(url, res.status, html);
      pages.push(snap);

      // sitemap が空だったときの保険として、同一オリジンのリンクを足す
      if (fromSitemap.length === 0) {
        for (const link of snap.links) {
          if (link.startsWith(origin) && !visited.has(link.replace(/\/$/, ''))) queue.push(link);
        }
      }
    } catch (e) {
      errors.push(`${url}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { pages, errors, blocked, retryAfterSec };
}

export interface LinkCheckResult {
  broken: { url: string; status: number }[];
  /** ボット対策で確認できなかったリンク。壊れているとは限らないので別枠。 */
  blockedUrls: string[];
}

/**
 * リンク切れチェック。ページ本文から集めたリンクを確認する。
 * 件数が多いと時間がかかるので上限を設ける。
 *
 * チャレンジに当たったものは broken に入れない。自分が締め出されただけで
 * 「リンクが切れています」と赤く出すと、直しようのない指摘になる。
 */
export async function checkLinks(urls: string[], limit = 30): Promise<LinkCheckResult> {
  const targets = [...new Set(urls)].slice(0, limit);
  const broken: { url: string; status: number }[] = [];
  const blockedUrls: string[] = [];

  for (const url of targets) {
    try {
      await sleep(LINK_DELAY_MS);
      const res = await get(url, 7000).catch(() => null);
      if (!res) {
        broken.push({ url, status: 0 });
        continue;
      }

      if (res.status >= 400) {
        // 403/429 はチャレンジの可能性があるので本文まで見て判定する。
        const body = res.status === 403 ? await res.text().catch(() => '') : '';
        if (isChallenge(res, body)) {
          blockedUrls.push(url);
          continue;
        }
        broken.push({ url, status: res.status });
      }
    } catch {
      broken.push({ url, status: 0 });
    }
  }
  return { broken, blockedUrls };
}
