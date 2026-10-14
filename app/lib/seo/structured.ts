// 機能3「構造化データチェック」。
//
// ページに入っている JSON-LD を読み、必須項目が埋まっているかを見る。
// 足りないものは、そのまま貼れる JSON-LD を生成して copyText に入れる。

import type { Finding, PageSnapshot } from './types';
import { BUSINESS } from './local';
import { toOpeningHoursSpecification, type MapsHours } from './maps';
import { products } from '../products';

type Node = Record<string, unknown>;

function typeOf(node: unknown): string[] {
  if (!node || typeof node !== 'object') return [];
  const t = (node as Node)['@type'];
  if (typeof t === 'string') return [t];
  if (Array.isArray(t)) return t.filter((x): x is string => typeof x === 'string');
  return [];
}

function hasType(pages: PageSnapshot[], ...types: string[]): PageSnapshot[] {
  return pages.filter((p) =>
    p.jsonLd.some((node) => typeOf(node).some((t) => types.includes(t)))
  );
}

function findNode(page: PageSnapshot, ...types: string[]): Node | null {
  for (const node of page.jsonLd) {
    if (typeOf(node).some((t) => types.includes(t))) return node as Node;
  }
  return null;
}

const json = (o: unknown) => JSON.stringify(o, null, 2);

// ── 生成テンプレート ──────────────────────────────────────────────

/**
 * 店舗情報の JSON-LD。営業時間は Googleマップから取れたときだけ入れる。
 * 冬夏・祭日で変わるものを人の手で書き込ませると、ここが真っ先に腐るため、
 * 正解が取れないときは項目ごと出さない（間違った時間を載せるより良い）。
 */
export function buildCafeSchema(maps?: MapsHours | null) {
  const hours = maps?.regular.length ? toOpeningHoursSpecification(maps.regular) : null;
  return {
    '@context': 'https://schema.org',
    '@type': 'CafeOrCoffeeShop',
    name: BUSINESS.name,
    legalName: BUSINESS.company,
    url: 'https://felicity.cafe',
    image: 'https://felicity.cafe/og-image.jpg',
    // 国際表記は先頭の 0 を外して +81 を付ける（080-… → +81-80-…）
    telephone: `+81-${BUSINESS.phone.slice(1)}`,
    priceRange: '¥¥',
    servesCuisine: 'Coffee',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '上山口2432-3',
      addressLocality: '葉山町',
      addressRegion: '神奈川県',
      postalCode: BUSINESS.postalCode,
      addressCountry: 'JP',
    },
    geo: { '@type': 'GeoCoordinates', latitude: BUSINESS.lat, longitude: BUSINESS.lng },
    hasMap: `https://www.google.com/maps/search/?api=1&query=${BUSINESS.lat},${BUSINESS.lng}`,
    sameAs: [`https://www.instagram.com/${BUSINESS.instagram}/`],
    ...(hours ? { openingHoursSpecification: hours } : {}),
  };
}

export function buildProductSchema(p: (typeof products)[number]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    image: `https://felicity.cafe${p.image}`,
    description: `${p.country}産 ${p.process} / 焙煎度 ${p.roast} / ${p.weight}`,
    gtin13: p.gtin,
    brand: { '@type': 'Brand', name: BUSINESS.name },
    category: 'コーヒー豆',
    additionalProperty: [
      { '@type': 'PropertyValue', name: '産地', value: p.country },
      { '@type': 'PropertyValue', name: '精製方法', value: p.process },
      { '@type': 'PropertyValue', name: '焙煎度', value: p.roast },
    ],
    offers: {
      '@type': 'Offer',
      url: `https://felicity.cafe/products/${p.slug}`,
      priceCurrency: 'JPY',
      price: p.priceYen,
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: BUSINESS.name },
    },
  };
}

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BUSINESS.name,
    legalName: BUSINESS.company,
    url: 'https://felicity.cafe',
    logo: 'https://felicity.cafe/felicity-logo.png',
    sameAs: [`https://www.instagram.com/${BUSINESS.instagram}/`],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: `+81-${BUSINESS.phone.slice(1)}`,
      contactType: 'customer service',
      email: 'info@felicity.cafe',
      availableLanguage: ['ja', 'en'],
    },
  };
}

export function buildEventSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: '（ワークショップ名）',
    startDate: '2026-11-01T14:00:00+09:00',
    endDate: '2026-11-01T16:00:00+09:00',
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: BUSINESS.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: '上山口2432-3',
        addressLocality: '葉山町',
        addressRegion: '神奈川県',
        postalCode: BUSINESS.postalCode,
        addressCountry: 'JP',
      },
    },
    organizer: { '@type': 'Organization', name: BUSINESS.name, url: 'https://felicity.cafe' },
    offers: {
      '@type': 'Offer',
      url: 'https://felicity.cafe/events',
      price: 0,
      priceCurrency: 'JPY',
      availability: 'https://schema.org/InStock',
    },
  };
}

export function buildArticleSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: '（記事タイトル）',
    image: ['https://felicity.cafe/og-image.jpg'],
    datePublished: '2026-10-14T09:00:00+09:00',
    dateModified: '2026-10-14T09:00:00+09:00',
    author: { '@type': 'Organization', name: BUSINESS.name, url: 'https://felicity.cafe' },
    publisher: {
      '@type': 'Organization',
      name: BUSINESS.name,
      logo: { '@type': 'ImageObject', url: 'https://felicity.cafe/felicity-logo.png' },
    },
  };
}

export function buildBreadcrumbSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://felicity.cafe' },
      { '@type': 'ListItem', position: 2, name: 'コーヒー豆', item: 'https://felicity.cafe/products' },
      {
        '@type': 'ListItem',
        position: 3,
        name: '（商品名）',
        item: 'https://felicity.cafe/products/（スラッグ）',
      },
    ],
  };
}

// ── 判定 ──────────────────────────────────────────────────────────

export function runSchemaChecks(pages: PageSnapshot[], maps: MapsHours | null = null): Finding[] {
  const findings: Finding[] = [];
  const live = pages.filter((p) => p.status === 200);

  // 壊れた JSON-LD
  const broken = live.filter((p) =>
    p.jsonLd.some((n) => n && typeof n === 'object' && (n as Node).__parseError)
  );
  if (broken.length) {
    findings.push({
      id: 'schema-broken',
      severity: 'red',
      weight: 70,
      category: 'schema',
      ja: {
        title: `${broken.length}ページで、Google向けの店舗情報データが壊れています`,
        impact: '壊れているとGoogleに完全に無視され、検索結果の見た目が良くなりません。',
        action: `該当：${broken.map((p) => p.path).join('、')}。下のコードで置き換えてください。`,
      },
      en: {
        title: `Structured data is broken on ${broken.length} page(s)`,
        impact: 'Google ignores broken data entirely, so you get no rich result.',
        action: `Pages: ${broken.map((p) => p.path).join(', ')}. Replace it with the code below.`,
      },
      copyText: json(buildCafeSchema(maps)),
      copyKind: 'json',
    });
  }

  // CafeOrCoffeeShop / LocalBusiness
  const cafePages = hasType(live, 'CafeOrCoffeeShop', 'LocalBusiness', 'Restaurant', 'Store');
  if (cafePages.length === 0) {
    findings.push({
      id: 'schema-cafe-missing',
      severity: 'red',
      weight: 85,
      category: 'schema',
      ja: {
        title: '「葉山のカフェです」とGoogleに伝えるデータがありません',
        impact: '地図検索や「近くのカフェ」に出にくく、来店の入口を丸ごと失っています。',
        action: 'トップページに下のコードを貼ってください。営業時間だけは実際の時間に書き換えてください。',
      },
      en: {
        title: 'Nothing tells Google you are a cafe in Hayama',
        impact: 'You are missing from map results and "cafes near me", losing walk-in traffic.',
        action: 'Paste the code below into the homepage, then fill in your real opening hours.',
      },
      copyText: json(buildCafeSchema(maps)),
      copyKind: 'json',
    });
  } else {
    const node = findNode(cafePages[0], 'CafeOrCoffeeShop', 'LocalBusiness', 'Restaurant', 'Store')!;
    const missing: string[] = [];
    if (!node.address) missing.push('住所');
    if (!node.openingHoursSpecification) missing.push('営業時間');
    if (!node.geo && !node.hasMap) missing.push('地図・座標');
    if (!node.sameAs) missing.push('Instagram');
    if (!node.telephone) missing.push('電話番号');

    if (missing.length) {
      findings.push({
        id: 'schema-cafe-incomplete',
        severity: 'yellow',
        weight: 55,
        category: 'schema',
        ja: {
          title: `店舗情報データに足りない項目があります（${missing.join('・')}）`,
          impact: '情報が揃っているほど地図検索で上位に出やすく、検索結果の見た目も良くなります。',
          action: '下のコードで置き換えると、足りない項目が埋まります。営業時間は実際の時間に書き換えてください。',
        },
        en: {
          title: `Your shop data is missing fields (${missing.join(', ')})`,
          impact: 'More complete data ranks higher on maps and looks better in search.',
          action: 'Replace it with the code below, then fill in your real opening hours.',
        },
        copyText: json(buildCafeSchema(maps)),
        copyKind: 'json',
      });
    } else {
      findings.push({
        id: 'schema-cafe-ok',
        severity: 'green',
        weight: 85,
        category: 'schema',
        ja: {
          title: '店舗情報データは揃っています',
          impact: '地図検索に出る条件を満たしています。',
          action: 'このまま維持してください。',
        },
        en: {
          title: 'Shop data is complete',
          impact: 'You meet the requirements to appear in map results.',
          action: 'Nothing to do.',
        },
      });
    }
  }

  // Product（豆の商品ページ）
  const productPages = live.filter((p) => /^\/(en\/)?products\/[^/]+$/.test(p.path));
  const withProduct = hasType(productPages, 'Product');
  const withoutProduct = productPages.filter((p) => !withProduct.includes(p));

  if (productPages.length === 0) {
    findings.push({
      id: 'schema-product-nopages',
      severity: 'yellow',
      weight: 60,
      category: 'schema',
      ja: {
        title: '豆の個別ページがクロールできませんでした',
        impact: '個別ページが無い／見つからないと、「パナマ ゲイシャ 通販」のような検索で上位を取れません。',
        action: 'sitemap.xml に商品ページが載っているか確認してください。',
      },
      en: {
        title: 'No individual bean pages were found',
        impact: 'Without them you cannot rank for searches like "Panama Geisha beans online".',
        action: 'Check that product pages are listed in sitemap.xml.',
      },
    });
  } else if (withoutProduct.length) {
    findings.push({
      id: 'schema-product-missing',
      severity: 'red',
      weight: 75,
      category: 'schema',
      ja: {
        title: `${withoutProduct.length}件の豆のページに、価格データが入っていません`,
        impact: '検索結果に価格や在庫が出ず、Amazonや他店の商品に見劣りしてクリックされません。',
        action: `該当：${withoutProduct.map((p) => p.path).slice(0, 5).join('、')}。下は「${products[0].name}」の例です。豆ごとに名前・価格・画像を差し替えてください。`,
      },
      en: {
        title: `${withoutProduct.length} bean page(s) carry no price data`,
        impact: 'Search results show no price or stock, so you lose the click to Amazon and other roasters.',
        action: `Affected: ${withoutProduct.map((p) => p.path).slice(0, 5).join(', ')}. Below is an example for "${products[0].name}" — swap name, price and image per bean.`,
      },
      copyText: json(buildProductSchema(products[0])),
      copyKind: 'json',
    });
  } else {
    findings.push({
      id: 'schema-product-ok',
      severity: 'green',
      weight: 75,
      category: 'schema',
      ja: {
        title: `豆の商品ページ${withProduct.length}件すべてに価格データが入っています`,
        impact: '検索結果に価格が出て、通販のクリック率が上がる状態です。',
        action: '価格を変えたときは、ページ側の価格も必ず一緒に直してください。',
      },
      en: {
        title: `All ${withProduct.length} bean pages carry price data`,
        impact: 'Search results show your prices, which lifts click-through for online sales.',
        action: 'When you change a price, update the page at the same time.',
      },
    });
  }

  // Organization
  if (hasType(live, 'Organization').length === 0) {
    findings.push({
      id: 'schema-org-missing',
      severity: 'yellow',
      weight: 40,
      category: 'schema',
      ja: {
        title: '会社情報のデータがありません',
        impact: '「FELICITY」で検索したときに、右側に会社情報パネルが出にくくなります。',
        action: '全ページ共通の場所に下のコードを貼ってください。',
      },
      en: {
        title: 'No organisation data',
        impact: 'Searching "FELICITY" is less likely to show a knowledge panel.',
        action: 'Paste the code below into a site-wide location.',
      },
      copyText: json(buildOrganizationSchema()),
      copyKind: 'json',
    });
  }

  // Event（ワークショップ）
  const eventPages = live.filter((p) => p.path.startsWith('/events') || p.path.startsWith('/en/events'));
  if (eventPages.length > 0 && hasType(eventPages, 'Event').length === 0) {
    findings.push({
      id: 'schema-event-missing',
      severity: 'yellow',
      weight: 60,
      category: 'schema',
      ja: {
        title: 'ワークショップが「イベント」としてGoogleに伝わっていません',
        impact: '検索結果に日付入りのイベント枠が出ず、「葉山 ワークショップ」からの集客を逃します。',
        action: 'イベントページに下のコードを貼り、日付・名前・料金を実際のものに書き換えてください。',
      },
      en: {
        title: 'Workshops are not registered as events',
        impact: 'You miss the dated event box in search results and the traffic from "Hayama workshop".',
        action: 'Paste the code below on the events page and fill in real dates, names and prices.',
      },
      copyText: json(buildEventSchema()),
      copyKind: 'json',
    });
  }

  // NewsArticle
  const newsPages = live.filter((p) => /^\/(en\/)?news\/[^/]+$/.test(p.path));
  if (newsPages.length > 0 && hasType(newsPages, 'NewsArticle', 'Article', 'BlogPosting').length === 0) {
    findings.push({
      id: 'schema-article-missing',
      severity: 'yellow',
      weight: 45,
      category: 'schema',
      ja: {
        title: 'ニュース記事が「記事」としてGoogleに伝わっていません',
        impact: '記事が検索結果で目立たず、書いた労力が集客につながりません。',
        action: '記事ページに下のコードを貼り、タイトルと日付を実際のものに書き換えてください。',
      },
      en: {
        title: 'News posts are not registered as articles',
        impact: 'Your posts do not stand out in search, so the writing effort brings no traffic.',
        action: 'Paste the code below on article pages with the real title and date.',
      },
      copyText: json(buildArticleSchema()),
      copyKind: 'json',
    });
  }

  // BreadcrumbList
  if (hasType(live, 'BreadcrumbList').length === 0) {
    findings.push({
      id: 'schema-breadcrumb-missing',
      severity: 'yellow',
      weight: 30,
      category: 'schema',
      ja: {
        title: '検索結果に出る「現在地の案内」が設定されていません',
        impact: '検索結果にURLがそのまま出てしまい、分かりにくくクリックされにくくなります。',
        action: '商品ページ・記事ページに下のコードを貼ってください。',
      },
      en: {
        title: 'No breadcrumb trail for search results',
        impact: 'Search results show a raw URL, which looks unclear and gets fewer clicks.',
        action: 'Paste the code below on product and article pages.',
      },
      copyText: json(buildBreadcrumbSchema()),
      copyKind: 'json',
    });
  }

  return findings;
}
