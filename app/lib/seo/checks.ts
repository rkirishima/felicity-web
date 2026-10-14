// 機能1「サイトチェック」の判定ロジック。
//
// 画面の読み手は SEO を知らないスタッフなので、ページごとに同じ指摘を
// 24回並べない。問題の種類ごとに1件へまとめ、該当ページ名を添える。

import type { Finding, PageSnapshot, Severity } from './types';

/** タイトルに入っていてほしいローカル検索の軸 */
const JA_KEYWORDS = ['葉山'];
const JA_SECONDARY = ['自家焙煎', 'コーヒー', 'ロースター', 'ロースタリー'];
const EN_KEYWORDS = ['hayama'];

/** 全角主体の日本語タイトルは検索結果で約30文字までしか出ない */
const JA_TITLE_MAX = 35;
const EN_TITLE_MAX = 60;
const JA_DESC_MIN = 60;
const JA_DESC_MAX = 120;
const EN_DESC_MIN = 110;
const EN_DESC_MAX = 160;

function label(p: PageSnapshot): string {
  return p.path === '/' ? 'トップページ' : p.path;
}

function listPages(pages: PageSnapshot[], max = 6): string {
  const names = pages.slice(0, max).map(label);
  const rest = pages.length - names.length;
  return names.join('、') + (rest > 0 ? ` ほか${rest}ページ` : '');
}

function listPaths(pages: PageSnapshot[], max = 6): string {
  const names = pages.slice(0, max).map((p) => (p.path === '/' ? 'Home' : p.path));
  const rest = pages.length - names.length;
  return names.join(', ') + (rest > 0 ? ` and ${rest} more` : '');
}

/** 全ページ問題なしのときに出す緑の行 */
function ok(
  id: string,
  weight: number,
  ja: { title: string; impact: string; action: string },
  en: { title: string; impact: string; action: string }
): Finding {
  return { id, severity: 'green', weight, category: 'page', ja, en };
}

export function runPageChecks(pages: PageSnapshot[], brokenLinks: { url: string; status: number }[]): Finding[] {
  const findings: Finding[] = [];
  const indexable = pages.filter((p) => p.status === 200);

  // ── 1. タイトル ────────────────────────────────────────────────
  const noTitle = indexable.filter((p) => !p.title);
  const longTitle = indexable.filter(
    (p) => p.title && p.title.length > (p.locale === 'ja' ? JA_TITLE_MAX : EN_TITLE_MAX)
  );
  const weakTitle = indexable.filter((p) => {
    if (!p.title) return false;
    const t = p.title.toLowerCase();
    const keys = p.locale === 'ja' ? JA_KEYWORDS : EN_KEYWORDS;
    return !keys.some((k) => t.includes(k.toLowerCase()));
  });

  if (noTitle.length) {
    findings.push({
      id: 'title-missing',
      severity: 'red',
      weight: 90,
      category: 'page',
      ja: {
        title: `${noTitle.length}ページに「ページの名前」がありません`,
        impact: 'Googleの検索結果に出る見出しが空になり、クリックされません。',
        action: `該当：${listPages(noTitle)}。各ページに「葉山」が入った30文字前後の名前を付けてください。`,
      },
      en: {
        title: `${noTitle.length} page(s) have no page title`,
        impact: 'The headline Google shows in search results is empty, so nobody clicks.',
        action: `Affected: ${listPaths(noTitle)}. Give each page a ~60 character title containing "Hayama".`,
      },
    });
  }

  if (weakTitle.length) {
    findings.push({
      id: 'title-no-local-keyword',
      severity: 'yellow',
      weight: 75,
      category: 'page',
      ja: {
        title: `${weakTitle.length}ページの名前に「葉山」が入っていません`,
        impact: '「葉山 カフェ」「葉山 コーヒー豆」で探している人に見つけてもらえません。',
        action: `該当：${listPages(weakTitle)}。ページの名前の最後に「| 葉山の自家焙煎コーヒー FELICITY」のように地名を足してください。`,
      },
      en: {
        title: `${weakTitle.length} page title(s) do not mention Hayama`,
        impact: 'People searching "Hayama cafe" or "Hayama coffee beans" will not find these pages.',
        action: `Affected: ${listPaths(weakTitle)}. Append something like "| Hayama Coffee Roasters" to each title.`,
      },
    });
  }

  // 同じ店名が1つのタイトルに2回出ているケース。レイアウト側のテンプレートが
  // 付ける店名と、ページ側が自分で書いた店名が二重になると起きる。
  const dupedTitle = indexable.filter((p) => {
    if (!p.title) return false;
    const hits = p.title.match(/FELICITY COFFEE ROASTERS/gi);
    return (hits?.length ?? 0) > 1;
  });
  if (dupedTitle.length) {
    findings.push({
      id: 'title-duplicate-brand',
      severity: 'red',
      weight: 65,
      category: 'page',
      ja: {
        title: `${dupedTitle.length}ページで、店名が2回繰り返されています`,
        impact: '検索結果に「〇〇 | FELICITY COFFEE ROASTERS | FELICITY COFFEE ROASTERS」と出て、雑な店に見えます。',
        action: `該当：${listPages(dupedTitle)}。例：「${dupedTitle[0].title}」。ページ側のタイトルから店名を消すと、サイト共通の設定が自動で1回だけ付けます。`,
      },
      en: {
        title: `The shop name appears twice in ${dupedTitle.length} page title(s)`,
        impact: 'Search results read "… | FELICITY COFFEE ROASTERS | FELICITY COFFEE ROASTERS", which looks sloppy.',
        action: `Affected: ${listPaths(dupedTitle)}. Example: "${dupedTitle[0].title}". Remove the shop name from the page's own title — the site-wide template already adds it once.`,
      },
    });
  }

  if (longTitle.length) {
    findings.push({
      id: 'title-too-long',
      severity: 'yellow',
      weight: 35,
      category: 'page',
      ja: {
        title: `${longTitle.length}ページの名前が長すぎます`,
        impact: '検索結果で途中が「…」で切られ、肝心の言葉が読まれません。',
        action: `該当：${listPages(longTitle)}。日本語は30文字前後まで、大事な言葉を先に置いてください。`,
      },
      en: {
        title: `${longTitle.length} page title(s) are too long`,
        impact: 'Search results cut them off with "…", so the important words never get read.',
        action: `Affected: ${listPaths(longTitle)}. Keep titles under 60 characters, important words first.`,
      },
    });
  }

  if (!noTitle.length && !weakTitle.length && !longTitle.length && !dupedTitle.length) {
    findings.push(
      ok(
        'title-ok',
        90,
        {
          title: 'すべてのページに良いページ名が付いています',
          impact: '検索結果でクリックされやすい状態です。',
          action: 'このまま維持してください。',
        },
        {
          title: 'Every page has a good title',
          impact: 'Your pages are set up to earn clicks in search results.',
          action: 'Nothing to do.',
        }
      )
    );
  }

  // ── 2. ページの説明文（メタディスクリプション） ───────────────
  const noDesc = indexable.filter((p) => !p.description);
  const badLenDesc = indexable.filter((p) => {
    if (!p.description) return false;
    const n = p.description.length;
    return p.locale === 'ja' ? n < JA_DESC_MIN || n > JA_DESC_MAX : n < EN_DESC_MIN || n > EN_DESC_MAX;
  });

  if (noDesc.length) {
    findings.push({
      id: 'desc-missing',
      severity: 'red',
      weight: 80,
      category: 'page',
      ja: {
        title: `${noDesc.length}ページに「検索結果に出る説明文」がありません`,
        impact: 'Googleが本文から勝手に抜き出すため、来てほしいお客様に刺さらない文が出ます。',
        action: `該当：${listPages(noDesc)}。各ページに80〜120文字で「どこの・何の店で・何が買えるか」を書いてください。`,
      },
      en: {
        title: `${noDesc.length} page(s) have no search description`,
        impact: 'Google invents a snippet from the page body, which rarely sells what you want it to.',
        action: `Affected: ${listPaths(noDesc)}. Write 110–160 characters covering where you are, what you are, and what they can buy.`,
      },
    });
  }

  if (badLenDesc.length) {
    findings.push({
      id: 'desc-length',
      severity: 'yellow',
      weight: 40,
      category: 'page',
      ja: {
        title: `${badLenDesc.length}ページの説明文の長さが適切ではありません`,
        impact: '短すぎると情報が足りず、長すぎると途中で切れて伝わりません。',
        action: `該当：${listPages(badLenDesc)}。日本語は80〜120文字に収めてください。`,
      },
      en: {
        title: `${badLenDesc.length} search description(s) are the wrong length`,
        impact: 'Too short tells people nothing; too long gets cut off mid-sentence.',
        action: `Affected: ${listPaths(badLenDesc)}. Aim for 110–160 characters.`,
      },
    });
  }

  if (!noDesc.length && !badLenDesc.length) {
    findings.push(
      ok(
        'desc-ok',
        80,
        {
          title: 'すべてのページに適切な説明文があります',
          impact: '検索結果で何の店か伝わる状態です。',
          action: 'このまま維持してください。',
        },
        {
          title: 'Every page has a good search description',
          impact: 'Search results explain what you sell.',
          action: 'Nothing to do.',
        }
      )
    );
  }

  // ── 3. title と og:title の一致 ────────────────────────────────
  const ogMismatch = indexable.filter((p) => {
    const ogTitle = p.og['og:title'];
    return Boolean(p.title && ogTitle && ogTitle.trim() !== p.title.trim());
  });
  if (ogMismatch.length) {
    findings.push({
      id: 'og-title-mismatch',
      severity: 'yellow',
      weight: 30,
      category: 'page',
      ja: {
        title: `${ogMismatch.length}ページで、検索結果の見出しとSNSシェア時の見出しが違います`,
        impact: 'InstagramやLINEで共有したときに、検索結果と違う言葉が出て印象がぶれます。',
        action: `該当：${listPages(ogMismatch)}。どちらかに統一してください。`,
      },
      en: {
        title: `${ogMismatch.length} page(s) show a different headline on social media`,
        impact: 'Sharing on Instagram or LINE shows wording different from search, which muddles the brand.',
        action: `Affected: ${listPaths(ogMismatch)}. Make both the same.`,
      },
    });
  }

  // ── 4. 見出し(H1) ─────────────────────────────────────────────
  const noH1 = indexable.filter((p) => p.h1.length === 0);
  const multiH1 = indexable.filter((p) => p.h1.length > 1);
  if (noH1.length) {
    findings.push({
      id: 'h1-missing',
      severity: 'yellow',
      weight: 55,
      category: 'page',
      ja: {
        title: `${noH1.length}ページに大見出しがありません`,
        impact: 'Googleがそのページの主題を読み取りにくく、順位が上がりにくくなります。',
        action: `該当：${listPages(noH1)}。ページの一番上に、そのページを一言で表す大見出しを1つ置いてください。`,
      },
      en: {
        title: `${noH1.length} page(s) have no main heading`,
        impact: 'Google struggles to tell what the page is about, so it ranks lower.',
        action: `Affected: ${listPaths(noH1)}. Add one main heading at the top of each page.`,
      },
    });
  }
  if (multiH1.length) {
    findings.push({
      id: 'h1-multiple',
      severity: 'yellow',
      weight: 25,
      category: 'page',
      ja: {
        title: `${multiH1.length}ページに大見出しが複数あります`,
        impact: 'ページの主題がぼやけ、検索で狙った言葉と結びつきにくくなります。',
        action: `該当：${listPages(multiH1)}。大見出しは1ページ1つにし、残りは中見出しに下げてください。`,
      },
      en: {
        title: `${multiH1.length} page(s) have more than one main heading`,
        impact: 'The page topic gets blurry and matches search terms less well.',
        action: `Affected: ${listPaths(multiH1)}. Keep one main heading; demote the rest.`,
      },
    });
  }

  // ── 5. 画像の説明(alt) ────────────────────────────────────────
  const missingAlt = indexable.flatMap((p) =>
    p.images.filter((i) => i.alt === null).map((i) => ({ page: p, src: i.src }))
  );
  if (missingAlt.length) {
    const affected = [...new Set(missingAlt.map((m) => m.page.path))];
    findings.push({
      id: 'img-alt-missing',
      severity: 'yellow',
      weight: 35,
      category: 'page',
      ja: {
        title: `${missingAlt.length}枚の写真に説明文が付いていません`,
        impact: 'Google画像検索から「葉山 カフェ」で見つけてもらう入口を逃しています。',
        action: `該当ページ：${affected.slice(0, 6).join('、')}。写真ごとに「葉山のカフェ店内」のような説明を付けてください。`,
      },
      en: {
        title: `${missingAlt.length} image(s) have no description`,
        impact: 'You lose Google Image Search traffic from people browsing "Hayama cafe".',
        action: `Pages: ${affected.slice(0, 6).join(', ')}. Describe each photo, e.g. "Cafe interior in Hayama".`,
      },
    });
  }

  // ── 6. 同じ写真の使い回し ─────────────────────────────────────
  const imageUse = new Map<string, Set<string>>();
  for (const p of indexable) {
    for (const img of p.images) {
      if (!imageUse.has(img.src)) imageUse.set(img.src, new Set());
      imageUse.get(img.src)!.add(p.path);
    }
  }
  // 3ページ以上で同じ写真。ロゴ等は除きたいので sitewide なものは対象外。
  const reused = [...imageUse.entries()].filter(
    ([src, pagesSet]) =>
      pagesSet.size >= 3 &&
      pagesSet.size < indexable.length &&
      !/logo|favicon|icon/i.test(src)
  );
  if (reused.length) {
    findings.push({
      id: 'img-reused',
      severity: 'yellow',
      weight: 25,
      category: 'page',
      ja: {
        title: `${reused.length}枚の写真が複数ページで使い回されています`,
        impact: '商品ページが「中身の違う別の商品」だとGoogleに伝わりにくく、個別に上位表示されにくくなります。',
        action: `例：${reused.slice(0, 3).map(([src]) => src.split('/').pop()).join('、')}。特に豆の商品ページは1商品1枚、実物の写真に差し替えてください。`,
      },
      en: {
        title: `${reused.length} photo(s) are reused across several pages`,
        impact: 'Google cannot tell product pages apart, so individual beans rank worse.',
        action: `Examples: ${reused.slice(0, 3).map(([src]) => src.split('/').pop()).join(', ')}. Give each bean its own photo.`,
      },
    });
  }

  // ── 7. SNSシェア画像(OGP) ─────────────────────────────────────
  const noOgImage = indexable.filter((p) => !p.og['og:image']);
  if (noOgImage.length) {
    findings.push({
      id: 'og-image-missing',
      severity: 'yellow',
      weight: 50,
      category: 'page',
      ja: {
        title: `${noOgImage.length}ページに、SNSで共有したときの画像が設定されていません`,
        impact: 'InstagramやLINEで送られたときに写真が出ず、クリック率が大きく落ちます。',
        action: `該当：${listPages(noOgImage)}。各ページに横1200×縦630の写真を設定してください。`,
      },
      en: {
        title: `${noOgImage.length} page(s) have no social share image`,
        impact: 'Links shared on Instagram or LINE show no photo, which badly hurts click-through.',
        action: `Affected: ${listPaths(noOgImage)}. Set a 1200×630 image on each page.`,
      },
    });
  }

  // ── 8. canonical ──────────────────────────────────────────────
  const noCanonical = indexable.filter((p) => !p.canonical);
  if (noCanonical.length) {
    findings.push({
      id: 'canonical-missing',
      severity: 'yellow',
      weight: 40,
      category: 'page',
      ja: {
        title: `${noCanonical.length}ページに「正式なURL」の指定がありません`,
        impact: '同じ内容が複数URLで見えると評価が分散し、どのページも上がりにくくなります。',
        action: `該当：${listPages(noCanonical)}。各ページに正式URLを1つ指定してください。`,
      },
      en: {
        title: `${noCanonical.length} page(s) do not declare their canonical URL`,
        impact: 'Duplicate URLs split your ranking strength, so none of them rank well.',
        action: `Affected: ${listPaths(noCanonical)}. Declare one canonical URL per page.`,
      },
    });
  }

  // ── 9. 日本語版と英語版の相互指定(hreflang) ───────────────────
  const noHreflang = indexable.filter((p) => Object.keys(p.hreflang).length === 0);
  if (noHreflang.length) {
    findings.push({
      id: 'hreflang-missing',
      severity: 'yellow',
      weight: 45,
      category: 'page',
      ja: {
        title: `${noHreflang.length}ページで、日本語版と英語版の対応付けがされていません`,
        impact: '外国人観光客に英語版ではなく日本語版が出てしまい、離脱されます。',
        action: `該当：${listPages(noHreflang)}。各ページに日本語版/英語版のURLを相互に指定してください。`,
      },
      en: {
        title: `${noHreflang.length} page(s) do not link their Japanese and English versions`,
        impact: 'Foreign visitors get served the Japanese page and bounce.',
        action: `Affected: ${listPaths(noHreflang)}. Declare the ja/en pair on both sides.`,
      },
    });
  }

  // ── 10. 検索避け(noindex)の事故 ───────────────────────────────
  const noindexed = indexable.filter((p) => /noindex/i.test(p.robots || ''));
  if (noindexed.length) {
    findings.push({
      id: 'noindex-present',
      severity: 'red',
      weight: 100,
      category: 'page',
      ja: {
        title: `${noindexed.length}ページが「Googleに載せない」設定になっています`,
        impact: 'そのページは検索結果に一切出ません。売り物のページなら売上がゼロになります。',
        action: `該当：${listPages(noindexed)}。意図した非公開ページでなければ、この設定を外してください。`,
      },
      en: {
        title: `${noindexed.length} page(s) are set to "hide from Google"`,
        impact: 'These pages never appear in search at all. If they sell something, that revenue is zero.',
        action: `Affected: ${listPaths(noindexed)}. Remove the setting unless the page is meant to be private.`,
      },
    });
  }

  // ── 11. リンク切れ ────────────────────────────────────────────
  if (brokenLinks.length) {
    findings.push({
      id: 'broken-links',
      severity: 'red',
      weight: 70,
      category: 'page',
      ja: {
        title: `${brokenLinks.length}件のリンクが切れています`,
        impact: 'お客様がエラー画面に当たって離脱します。Googleの評価も下がります。',
        action: `該当：${brokenLinks.slice(0, 5).map((b) => `${b.url}（${b.status || '接続不可'}）`).join('、')}。リンク先を修正するか、リンクを外してください。`,
      },
      en: {
        title: `${brokenLinks.length} link(s) are broken`,
        impact: 'Visitors hit an error page and leave, and Google marks the site down for it.',
        action: `Affected: ${brokenLinks.slice(0, 5).map((b) => `${b.url} (${b.status || 'unreachable'})`).join(', ')}. Fix or remove them.`,
      },
    });
  } else {
    findings.push(
      ok(
        'broken-links-ok',
        70,
        {
          title: 'リンク切れは見つかりませんでした',
          impact: 'お客様がエラー画面に当たる心配はありません。',
          action: 'このまま維持してください。',
        },
        {
          title: 'No broken links found',
          impact: 'Visitors will not hit error pages.',
          action: 'Nothing to do.',
        }
      )
    );
  }

  // ── 12. 動画の重さ ────────────────────────────────────────────
  const eagerVideos = indexable.flatMap((p) =>
    p.videos.filter((v) => v.preload === 'auto' || v.preload === null).map((v) => ({ page: p, v }))
  );
  if (eagerVideos.length) {
    findings.push({
      id: 'video-heavy',
      severity: 'yellow',
      weight: 50,
      category: 'page',
      ja: {
        title: `${eagerVideos.length}本の動画が、開いた瞬間に読み込まれる設定です`,
        impact: 'スマホの回線では表示が数秒遅れ、待てずに閉じるお客様が出ます。',
        action: `該当：${listPages([...new Set(eagerVideos.map((e) => e.page))])}。動画に「preload="none"」を付け、代わりに静止画を先に見せてください。`,
      },
      en: {
        title: `${eagerVideos.length} video(s) load immediately when the page opens`,
        impact: 'On mobile data the page stalls for seconds and visitors give up.',
        action: `Affected: ${listPaths([...new Set(eagerVideos.map((e) => e.page))])}. Set preload="none" and show a poster image first.`,
      },
    });
  }

  return findings;
}

export function severityRank(s: Severity): number {
  return s === 'red' ? 0 : s === 'yellow' ? 1 : 2;
}
