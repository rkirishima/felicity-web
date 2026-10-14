// 機能2「ローカルSEOチェック」。
//
// 住所・電話はブレようがない事実なので固定値と照合する。
// 営業時間だけは「どれが正しいか」をこのツールが決められないため、
// サイト内で食い違っていないかだけを見て、食い違っていれば両方を見せて
// オーナーに決めてもらう。勝手に正解を決めて直させると実態とずれる。

import type { Finding, PageSnapshot } from './types';
import { hoursAsRanges, type MapsHours } from './maps';

export const BUSINESS = {
  name: 'FELICITY COFFEE ROASTERS',
  company: '株式会社FELICITY',
  addressJa: '神奈川県三浦郡葉山町上山口2432-3',
  /** 表記ゆれを許容するための部分一致キー */
  addressParts: ['葉山町上山口', '2432-3'],
  postalCode: '240-0115',
  phone: '080-8758-4368',
  phoneDigits: '08087584368',
  lat: 35.267359,
  lng: 139.610321,
  instagram: 'felicity_hayama',
} as const;

const HOURS_MARKER = /営業時間|定休日|OPEN|Open|Hours|HOURS/g;
const TIME_RANGE = /(\d{1,2}):(\d{2})\s*[–\-—~〜]\s*(\d{1,2}):(\d{2})/g;

/**
 * 「11:00–17:00」のような時間帯を拾う。ただしページ全体から拾うと
 * ワークショップの開催時間やランチの提供時間まで混ざり、営業時間が
 * 食い違っているように見えてしまう。「営業時間」「OPEN」等の見出しの
 * 近く(前後200文字)だけを見る。マーカーが無いページは対象外。
 */
function extractHours(text: string): string[] {
  const out = new Set<string>();
  for (const marker of text.matchAll(HOURS_MARKER)) {
    const start = Math.max(0, marker.index - 60);
    const window = text.slice(start, marker.index + 200);
    for (const m of window.matchAll(TIME_RANGE)) {
      out.add(`${m[1].padStart(2, '0')}:${m[2]}–${m[3].padStart(2, '0')}:${m[4]}`);
    }
  }
  return [...out];
}

function digitsOnly(s: string): string {
  return s.replace(/[^\d]/g, '');
}

export function runLocalChecks(pages: PageSnapshot[], maps: MapsHours | null = null): Finding[] {
  const findings: Finding[] = [];
  const live = pages.filter((p) => p.status === 200);

  // ── 住所の表記統一 ────────────────────────────────────────────
  // 英語ページは当然ローマ字表記になるので、日本語の住所が無いことを
  // 「表記ゆれ」として数えない。同じ言語のページ同士でだけ比べる。
  const jaPages = live.filter((p) => p.locale === 'ja');
  const enPages = live.filter((p) => p.locale === 'en');

  const withAddress = [
    ...jaPages.filter((p) => BUSINESS.addressParts.every((part) => p.text.includes(part))),
    ...enPages.filter((p) => /hayama/i.test(p.text) && p.text.includes('2432-3')),
  ];
  const partialAddress = live.filter(
    (p) =>
      !withAddress.includes(p) &&
      (p.text.includes('葉山町') || /hayama/i.test(p.text)) &&
      /\d{4}-\d/.test(p.text)
  );

  if (withAddress.length === 0) {
    findings.push({
      id: 'nap-address-absent',
      severity: 'red',
      weight: 85,
      category: 'local',
      ja: {
        title: '住所がサイト内で見つかりませんでした',
        impact: 'Googleが「葉山にある実店舗」だと判断できず、地図検索に出にくくなります。',
        action: `フッターなど全ページに出る場所に「${BUSINESS.addressJa}」を文字で（画像ではなく）載せてください。`,
      },
      en: {
        title: 'No address found anywhere on the site',
        impact: 'Google cannot confirm you are a real shop in Hayama, so you drop out of map results.',
        action: `Put "${BUSINESS.addressJa}" as text (not an image) in the footer of every page.`,
      },
      copyText: BUSINESS.addressJa,
    });
  } else if (partialAddress.length > 0) {
    findings.push({
      id: 'nap-address-inconsistent',
      severity: 'yellow',
      weight: 60,
      category: 'local',
      ja: {
        title: '住所の書き方がページによって違う可能性があります',
        impact: '同じ店だとGoogleに伝わらず、地図検索での信頼度が下がります。',
        action: `全ページで「${BUSINESS.addressJa}」に統一してください。該当の可能性：${partialAddress.map((p) => p.path).slice(0, 5).join('、')}`,
      },
      en: {
        title: 'The address may be written differently on different pages',
        impact: 'Google cannot confirm these refer to the same shop, lowering local trust.',
        action: `Use "${BUSINESS.addressJa}" everywhere. Possibly affected: ${partialAddress.map((p) => p.path).slice(0, 5).join(', ')}`,
      },
      copyText: BUSINESS.addressJa,
    });
  } else {
    findings.push({
      id: 'nap-address-ok',
      severity: 'green',
      weight: 85,
      category: 'local',
      ja: {
        title: `住所の表記は統一されています（${withAddress.length}ページに掲載）`,
        impact: '地図検索で「葉山の店」として認識されやすい状態です。',
        action: 'このまま維持してください。',
      },
      en: {
        title: `Address is consistent (found on ${withAddress.length} pages)`,
        impact: 'Google can confirm you are a shop in Hayama.',
        action: 'Nothing to do.',
      },
    });
  }

  // ── 電話番号の表記統一 ────────────────────────────────────────
  const phonePages = live.filter((p) => digitsOnly(p.text).includes(BUSINESS.phoneDigits));
  // 別の市外局番から始まる10-11桁をもう1本持っていないか
  const otherPhones = new Set<string>();
  for (const p of live) {
    for (const m of p.text.matchAll(/0\d{1,3}[-\s]?\d{2,4}[-\s]?\d{3,4}/g)) {
      const d = digitsOnly(m[0]);
      if (d.length >= 10 && d !== BUSINESS.phoneDigits) otherPhones.add(d);
    }
  }

  if (phonePages.length === 0) {
    findings.push({
      id: 'nap-phone-absent',
      severity: 'yellow',
      weight: 55,
      category: 'local',
      ja: {
        title: '電話番号がサイト内で見つかりませんでした',
        impact: 'スマホで見た人がそのまま電話できず、予約・問い合わせを取りこぼします。',
        action: `フッターに「${BUSINESS.phone}」をタップで発信できる形で載せてください。`,
      },
      en: {
        title: 'No phone number found on the site',
        impact: 'Mobile visitors cannot tap to call, so you lose bookings and enquiries.',
        action: `Add "${BUSINESS.phone}" to the footer as a tap-to-call link.`,
      },
      copyText: BUSINESS.phone,
    });
  } else if (otherPhones.size > 0) {
    findings.push({
      id: 'nap-phone-multiple',
      severity: 'yellow',
      weight: 45,
      category: 'local',
      ja: {
        title: 'サイト内に複数の電話番号があります',
        impact: 'Googleがどれが店の番号か判断できず、地図検索での信頼度が下がります。',
        action: `店舗代表は「${BUSINESS.phone}」に統一してください。見つかった他の番号：${[...otherPhones].slice(0, 3).join('、')}`,
      },
      en: {
        title: 'More than one phone number appears on the site',
        impact: 'Google cannot tell which is the shop number, lowering local trust.',
        action: `Standardise on "${BUSINESS.phone}". Others found: ${[...otherPhones].slice(0, 3).join(', ')}`,
      },
      copyText: BUSINESS.phone,
    });
  } else {
    findings.push({
      id: 'nap-phone-ok',
      severity: 'green',
      weight: 55,
      category: 'local',
      ja: {
        title: `電話番号の表記は統一されています（${phonePages.length}ページに掲載）`,
        impact: 'スマホからそのまま電話してもらえる状態です。',
        action: 'このまま維持してください。',
      },
      en: {
        title: `Phone number is consistent (on ${phonePages.length} pages)`,
        impact: 'Mobile visitors can tap to call.',
        action: 'Nothing to do.',
      },
    });
  }

  // ── 営業時間 ──────────────────────────────────────────────────
  // Googleマップが取れていればそれを正解として突き合わせる。
  // 取れない場合のみ、サイト内で割れていないかだけを見る。
  const hoursByPage = new Map<string, string[]>();
  for (const p of live) {
    const hrs = [...new Set(extractHours(p.text))];
    if (hrs.length) hoursByPage.set(p.path, hrs);
  }
  const allHourSets = [...new Set([...hoursByPage.values()].map((h) => h.sort().join(' / ')))];

  if (maps && maps.regular.length > 0) {
    findings.push(...compareWithMaps(hoursByPage, maps));
  } else if (hoursByPage.size === 0) {
    findings.push({
      id: 'nap-hours-absent',
      severity: 'red',
      weight: 80,
      category: 'local',
      ja: {
        title: '営業時間がサイト内で見つかりませんでした',
        impact: '「今日やっている?」を確かめられず、来店をあきらめるお客様が出ます。',
        action: 'フッターに曜日ごとの営業時間と定休日を文字で載せてください。',
      },
      en: {
        title: 'No opening hours found on the site',
        impact: 'Visitors cannot check if you are open today and give up on coming.',
        action: 'List hours by day of week, plus closed days, as text in the footer.',
      },
    });
  } else if (allHourSets.length > 1) {
    const detail = [...hoursByPage.entries()]
      .slice(0, 5)
      .map(([path, hrs]) => `${path === '/' ? 'トップ' : path}：${hrs.join('・')}`)
      .join(' ／ ');
    findings.push({
      id: 'nap-hours-inconsistent',
      severity: 'red',
      weight: 80,
      category: 'local',
      ja: {
        title: 'ページによって営業時間の表記が違います',
        impact: '間違った時間を見て来店したお客様が閉まっている店に当たり、悪い口コミにつながります。',
        action: `どれが正しいか決めて全ページとGoogleビジネスプロフィールを揃えてください。現状：${detail}`,
      },
      en: {
        title: 'Opening hours differ from page to page',
        impact: 'Someone shows up on the wrong information, finds you closed, and leaves a bad review.',
        action: `Decide which is correct, then make every page and your Google Business Profile match. Currently: ${detail}`,
      },
    });
  } else {
    findings.push({
      id: 'nap-hours-ok',
      severity: 'green',
      weight: 80,
      category: 'local',
      ja: {
        title: '営業時間の表記はサイト内で統一されています',
        impact: 'お客様が正しい時間を確認できる状態です。',
        action: `Googleビジネスプロフィール側も同じ「${allHourSets[0]}」になっているか確認してください。`,
      },
      en: {
        title: 'Opening hours are consistent across the site',
        impact: 'Visitors see one reliable answer.',
        action: `Check your Google Business Profile also says "${allHourSets[0]}".`,
      },
    });
  }

  // ── Googleマップ埋め込み ──────────────────────────────────────
  const mapPages = live.filter((p) => p.mapEmbeds.length > 0);
  const allEmbeds = mapPages.flatMap((p) => p.mapEmbeds);

  // 埋め込みコードを手で組み立てると、座標は合っていても場所IDが出鱈目になり、
  // 地図は出るのにピンが立たない。Googleの「地図を埋め込む」で出るコードは
  // 1s に 0x〈16桁hex〉:0x〈16桁hex〉、4v に13桁のタイムスタンプが入る。
  const forged = allEmbeds.filter((src) => {
    const decoded = decodeURIComponent(src);
    const placeRef = decoded.match(/!1s(0x[0-9a-f]+%?3?A?:?0x[0-9a-z]+)/i)?.[1] ?? '';
    const looksReal = /^0x[0-9a-f]{12,20}:0x[0-9a-f]{12,20}$/i.test(placeRef.replace(/%3A/i, ':'));
    const stamp = decoded.match(/!4v(\d+)/)?.[1] ?? '';
    const stampReal = stamp.length >= 13 && !/^1{0,1}2345678900?$/.test(stamp);
    return !looksReal || !stampReal;
  });

  const pointsHere = allEmbeds.some((src) => {
    const decoded = decodeURIComponent(src);
    if (BUSINESS.addressParts.every((part) => decoded.includes(part))) return true;
    if (/felicity/i.test(decoded)) return true;
    // 座標が概ね一致しているか（小数3桁 ≒ 100m 程度）
    const coords = [...decoded.matchAll(/(3[45]\.\d+)[!,%\dA-Za-z]*?(139\.\d+)/g)];
    return coords.some(
      (m) =>
        Math.abs(parseFloat(m[1]) - BUSINESS.lat) < 0.002 &&
        Math.abs(parseFloat(m[2]) - BUSINESS.lng) < 0.002
    );
  });

  if (mapPages.length === 0) {
    findings.push({
      id: 'map-missing',
      severity: 'yellow',
      weight: 50,
      category: 'local',
      ja: {
        title: 'Googleマップが埋め込まれていません',
        impact: '場所が分かりにくく、初めてのお客様が来店をためらいます。',
        action: 'アクセスページに店舗のGoogleマップを埋め込んでください。',
      },
      en: {
        title: 'No Google Map is embedded',
        impact: 'First-time visitors cannot picture where you are and hesitate to come.',
        action: 'Embed your shop location on the access page.',
      },
    });
  } else if (forged.length === allEmbeds.length) {
    findings.push({
      id: 'map-forged-embed',
      severity: 'red',
      weight: 75,
      category: 'local',
      ja: {
        title: '地図は出ていますが、お店のピンが立っていません',
        impact:
          '周辺の地図だけが表示され、どれがFelicityか分かりません。初めてのお客様が場所を特定できず、来店を逃します。',
        action: `埋め込みコードが手書きで、Googleが店舗を識別できない状態です。Googleマップで「${BUSINESS.name}」を開き、「共有」→「地図を埋め込む」で出るコードを丸ごと貼り替えてください。該当：${mapPages.map((p) => (p.path === '/' ? 'トップ' : p.path)).join('、')}`,
      },
      en: {
        title: 'The map shows, but your shop has no pin',
        impact:
          'Visitors see the surrounding area with nothing marking Felicity, cannot work out where you are, and do not come.',
        action: `The embed code was hand-written, so Google cannot identify the shop. Open "${BUSINESS.name}" on Google Maps, choose Share → Embed a map, and paste that code as-is. Pages: ${mapPages.map((p) => p.path).join(', ')}`,
      },
    });
  } else if (!pointsHere) {
    findings.push({
      id: 'map-wrong-place',
      severity: 'red',
      weight: 75,
      category: 'local',
      ja: {
        title: '埋め込まれた地図が店舗を指していない可能性があります',
        impact: 'お客様が別の場所に行ってしまい、来店を丸ごと失います。',
        action: `Googleマップで「${BUSINESS.name}」を検索し、「共有」→「地図を埋め込む」で出るコードに貼り替えてください。該当：${mapPages.map((p) => p.path).join('、')}`,
      },
      en: {
        title: 'The embedded map may not point at the shop',
        impact: 'Customers drive to the wrong place and you lose the visit entirely.',
        action: `Search "${BUSINESS.name}" on Google Maps, then Share → Embed a map, and replace the code. Pages: ${mapPages.map((p) => p.path).join(', ')}`,
      },
    });
  } else {
    findings.push({
      id: 'map-ok',
      severity: 'green',
      weight: 75,
      category: 'local',
      ja: {
        title: '埋め込まれた地図は店舗を正しく指しています',
        impact: '初めてのお客様が迷わず来られる状態です。',
        action: 'このまま維持してください。',
      },
      en: {
        title: 'The embedded map points at the shop correctly',
        impact: 'First-time visitors can find you.',
        action: 'Nothing to do.',
      },
    });
  }

  return findings;
}

/**
 * Googleマップを正として、サイトに書かれた営業時間を突き合わせる。
 *
 * 冬/夏の切り替えや祭日はマップ側で更新されるので、サイトにベタ書きしている限り
 * 必ずいつかずれる。ここでは「いまずれているか」だけでなく、
 * 「ベタ書きをやめる」という構造的な直し方も必ず1件出す。
 */
function compareWithMaps(
  hoursByPage: Map<string, string[]>,
  maps: MapsHours
): Finding[] {
  const out: Finding[] = [];
  const truth = hoursAsRanges(maps.regular);
  const truthList = [...truth].join('・');
  const mapsSummary = maps.weekdayDescriptions.join(' ／ ');

  // サイトに書かれていて、マップのどの時間帯とも一致しないページ
  const mismatched = [...hoursByPage.entries()].filter(([, hrs]) =>
    hrs.some((h) => !truth.has(h))
  );

  if (hoursByPage.size === 0) {
    out.push({
      id: 'maps-hours-absent',
      severity: 'red',
      weight: 80,
      category: 'local',
      ja: {
        title: '営業時間がサイトに載っていません',
        impact: '「今日やっている?」を確かめられず、来店をあきらめるお客様が出ます。',
        action: `Googleマップには「${mapsSummary}」と登録されています。これをフッターに載せてください。`,
      },
      en: {
        title: 'Opening hours are not shown on the site',
        impact: 'Visitors cannot check if you are open today and give up on coming.',
        action: `Google Maps says "${maps.weekdayDescriptions.join(' / ')}". Put this in the footer.`,
      },
      copyText: mapsSummary,
    });
  } else if (mismatched.length > 0) {
    out.push({
      id: 'maps-hours-mismatch',
      severity: 'red',
      weight: 90,
      category: 'local',
      ja: {
        title: 'サイトの営業時間がGoogleマップと違います',
        impact:
          'マップを見て来たお客様とサイトを見て来たお客様が、別々の時間を信じることになります。閉まっている時間に来店されると悪い口コミに直結します。',
        action: `Googleマップ（正）：${mapsSummary}。直すページ：${mismatched
          .map(([path, hrs]) => `${path === '/' ? 'トップ' : path}（${hrs.join('・')}）`)
          .join('、')}`,
      },
      en: {
        title: 'The hours on your site disagree with Google Maps',
        impact:
          'Customers from Maps and customers from your site believe different hours. Arriving to a closed shop turns straight into a bad review.',
        action: `Google Maps (source of truth): ${maps.weekdayDescriptions.join(' / ')}. Pages to fix: ${mismatched
          .map(([path, hrs]) => `${path} (${hrs.join(', ')})`)
          .join(', ')}`,
      },
      copyText: mapsSummary,
    });
  } else {
    out.push({
      id: 'maps-hours-match',
      severity: 'green',
      weight: 90,
      category: 'local',
      ja: {
        title: 'サイトの営業時間はGoogleマップと一致しています',
        impact: 'どちらを見たお客様も同じ時間を信じられる状態です。',
        action: `現在の登録：${mapsSummary}`,
      },
      en: {
        title: 'Site hours match Google Maps',
        impact: 'Everyone sees the same hours wherever they look.',
        action: `Currently: ${maps.weekdayDescriptions.join(' / ')}`,
      },
    });
  }

  // 今週、祭日などで通常と違う時間になっている
  if (maps.hasSpecialHours) {
    out.push({
      id: 'maps-special-hours',
      severity: 'yellow',
      weight: 70,
      category: 'local',
      ja: {
        title: '今週は、通常と違う営業時間になっています',
        impact:
          'Googleマップには反映されていますが、サイトには通常の時間が出たままです。祭日にサイトを見て来たお客様が外します。',
        action: `今週の実際の時間：${maps.currentWeekdayDescriptions.join(' ／ ')}${
          maps.specialDays.length ? `（特別営業日：${maps.specialDays.map((d) => d.date).join('、')}）` : ''
        }`,
      },
      en: {
        title: 'This week has non-standard opening hours',
        impact:
          'Google Maps reflects it, but your site still shows the usual hours, so holiday visitors get it wrong.',
        action: `Actual hours this week: ${maps.currentWeekdayDescriptions.join(' / ')}${
          maps.specialDays.length ? ` (special days: ${maps.specialDays.map((d) => d.date).join(', ')})` : ''
        }`,
      },
      copyText: maps.currentWeekdayDescriptions.join('\n'),
    });
  }

  // 構造的な直し方。冬夏・祭日で変わる以上、ベタ書きのままだと必ずまたずれる。
  out.push({
    id: 'maps-hours-hardcoded',
    severity: hoursByPage.size > 0 ? 'yellow' : 'green',
    weight: 60,
    category: 'local',
    ja: {
      title: '営業時間がページに直接書き込まれています',
      impact:
        '冬と夏の切り替えや祭日のたびに手で直す必要があり、1回でも忘れると「営業中」と出たまま閉まっている状態になります。',
      action:
        'Googleマップから営業時間を自動で読み込んで表示する作りに変えると、マップを更新するだけでサイト・検索結果・この画面がすべて揃います。',
    },
    en: {
      title: 'Opening hours are written directly into the pages',
      impact:
        'Every seasonal switch and public holiday needs a manual edit, and one missed edit leaves you showing "open" while closed.',
      action:
        'Have the site read hours from Google Maps automatically — then updating Maps updates the site, the search results and this report together.',
    },
  });

  return out;
}

/** Googleビジネスプロフィールでやること。サイトからは判定できないので手動チェック用。 */
export const GBP_CHECKLIST = [
  {
    id: 'gbp-photos',
    ja: {
      title: '写真を月に3枚以上足す',
      impact: '写真が多い店は地図検索で上位に出やすく、来店率も上がります。',
      action: '店内・外観・コーヒー・焙煎機・スタッフの写真を、スマホで撮ってそのまま投稿。',
    },
    en: {
      title: 'Add at least 3 photos a month',
      impact: 'Profiles with more photos rank higher on maps and get more visits.',
      action: 'Post phone photos of the interior, exterior, coffee, roaster and staff.',
    },
  },
  {
    id: 'gbp-category',
    ja: {
      title: 'カテゴリを「コーヒー専門店」にする',
      impact: '「葉山 コーヒー」で探している人に出るかどうかが、ここで決まります。',
      action: 'メインカテゴリ＝コーヒー専門店、サブに カフェ / 焙煎所 / ギフトショップ を追加。',
    },
    en: {
      title: 'Set the category to "Coffee shop"',
      impact: 'This single setting decides whether you appear for "Hayama coffee".',
      action: 'Primary: Coffee shop. Secondary: Cafe, Coffee roaster, Gift shop.',
    },
  },
  {
    id: 'gbp-hours',
    ja: {
      title: '営業時間と臨時休業日を入れる',
      impact: '閉まっているのに「営業中」と出ると、悪い口コミに直結します。',
      action: '通常の営業時間に加え、年末年始・イベント休業を「特別営業時間」に登録。',
    },
    en: {
      title: 'Keep hours and holiday closures up to date',
      impact: 'Showing "Open" when you are closed leads straight to bad reviews.',
      action: 'Set regular hours plus special hours for holidays and event closures.',
    },
  },
  {
    id: 'gbp-posts',
    ja: {
      title: '週1回「最新情報」を投稿する',
      impact: '更新している店はGoogleに優先され、地図検索の表示回数が増えます。',
      action: '新しい豆、ワークショップ、ポップアップの告知をそのまま投稿。Instagramの使い回しで十分。',
    },
    en: {
      title: 'Post an update once a week',
      impact: 'Active profiles get shown more often in map results.',
      action: 'Reuse your Instagram posts: new beans, workshops, pop-ups.',
    },
  },
  {
    id: 'gbp-reviews',
    ja: {
      title: '口コミに必ず返信する',
      impact: '返信がある店は来店率が高く、低評価も印象が和らぎます。',
      action: '良い口コミには一言お礼、低評価には謝罪と改善策を2〜3文で。放置しないことが一番大事。',
    },
    en: {
      title: 'Reply to every review',
      impact: 'Replied-to profiles convert better, and replies soften bad ratings.',
      action: 'Thank the good ones briefly; answer bad ones with an apology and a fix in 2–3 sentences.',
    },
  },
] as const;
