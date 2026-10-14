// Googleマップ（Googleビジネスプロフィール）を営業時間の正とする。
//
// 葉山の店は冬と夏で営業時間が変わり、祭日も別時間になる。サイト側に
// 時間をベタ書きすると季節ごとに直し忘れが起き、実際に閉まっている時間に
// 「営業中」と表示される。Googleマップは普段から更新しているので、
// そこを唯一の正解として読み、サイトがずれていないかを見る。
//
// Places API (New):
//   検索  POST https://places.googleapis.com/v1/places:searchText
//   詳細  GET  https://places.googleapis.com/v1/places/{PLACE_ID}
// どちらも X-Goog-Api-Key と X-Goog-FieldMask が必要。
// regularOpeningHours / currentOpeningHours は Enterprise SKU なので、
// フィールドマスクは必要最小限にとどめる。

const PLACES_BASE = 'https://places.googleapis.com/v1';

export interface MapsPeriod {
  /** 0=日曜 */
  day: number;
  open: string; // "11:00"
  close: string; // "17:00"
}

export interface MapsSpecialDay {
  date: string; // "2026-12-31"
}

export interface MapsHours {
  placeId: string;
  displayName: string | null;
  formattedAddress: string | null;
  phone: string | null;
  /** 通常の営業時間 */
  regular: MapsPeriod[];
  /** 曜日ごとの人間向け表記（Googleマップに出ているそのまま） */
  weekdayDescriptions: string[];
  /** 今週の実際の営業時間。祭日・臨時営業はここに反映される */
  current: MapsPeriod[];
  currentWeekdayDescriptions: string[];
  /** 今週、通常と違う時間になっている日 */
  specialDays: MapsSpecialDay[];
  /** 通常と今週で時間が違うか（＝いま特別営業期間中） */
  hasSpecialHours: boolean;
}

interface RawPeriodPoint {
  day?: number;
  hour?: number;
  minute?: number;
  date?: { year: number; month: number; day: number };
}
interface RawHours {
  periods?: { open?: RawPeriodPoint; close?: RawPeriodPoint }[];
  weekdayDescriptions?: string[];
  specialDays?: { date?: { year: number; month: number; day: number } }[];
}

const hhmm = (h = 0, m = 0) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

function toPeriods(raw: RawHours | undefined): MapsPeriod[] {
  if (!raw?.periods) return [];
  return raw.periods
    .filter((p) => p.open)
    .map((p) => ({
      day: p.open!.day ?? 0,
      open: hhmm(p.open!.hour, p.open!.minute),
      // close が無い = 24時間営業。その場合は 24:00 として扱う。
      close: p.close ? hhmm(p.close.hour, p.close.minute) : '24:00',
    }))
    .sort((a, b) => a.day - b.day || a.open.localeCompare(b.open));
}

function samePeriods(a: MapsPeriod[], b: MapsPeriod[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((p, i) => p.day === b[i].day && p.open === b[i].open && p.close === b[i].close);
}

async function placesFetch(path: string, fieldMask: string, init?: RequestInit) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error('GOOGLE_PLACES_API_KEY is not set');

  const res = await fetch(`${PLACES_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': fieldMask,
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Places API ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

/**
 * Place ID を解決する。GOOGLE_PLACE_ID が設定されていればそれを使い、
 * なければ店名＋住所で検索する。検索は1回分の課金が増えるので、
 * 見つけた ID は画面に出して .env に固定してもらう。
 */
export async function resolvePlaceId(): Promise<string> {
  const fixed = process.env.GOOGLE_PLACE_ID;
  if (fixed) return fixed;

  const data = await placesFetch('/places:searchText', 'places.id,places.displayName', {
    method: 'POST',
    body: JSON.stringify({
      textQuery: 'FELICITY COFFEE ROASTERS 神奈川県三浦郡葉山町上山口2432-3',
      languageCode: 'ja',
      regionCode: 'JP',
      maxResultCount: 1,
    }),
  });

  const id = data?.places?.[0]?.id;
  if (!id) throw new Error('Googleマップで店舗を特定できませんでした');
  return id;
}

/**
 * Googleマップに出ている営業時間を取得する。
 * 鍵が無い・取得に失敗した場合は null を返し、呼び出し側は
 * 「サイト内で食い違っていないか」だけの判定にフォールバックする。
 */
export async function fetchMapsHours(): Promise<MapsHours | null> {
  if (!process.env.GOOGLE_PLACES_API_KEY) return null;

  try {
    const placeId = await resolvePlaceId();
    const data = await placesFetch(
      `/places/${encodeURIComponent(placeId)}`,
      [
        'id',
        'displayName',
        'formattedAddress',
        'nationalPhoneNumber',
        'regularOpeningHours',
        'currentOpeningHours',
      ].join(','),
      { method: 'GET' }
    );

    const regular = toPeriods(data.regularOpeningHours);
    const current = toPeriods(data.currentOpeningHours);

    const specialDays: MapsSpecialDay[] = (data.currentOpeningHours?.specialDays ?? [])
      .map((s: { date?: { year: number; month: number; day: number } }) =>
        s.date
          ? {
              date: `${s.date.year}-${String(s.date.month).padStart(2, '0')}-${String(s.date.day).padStart(2, '0')}`,
            }
          : null
      )
      .filter(Boolean) as MapsSpecialDay[];

    return {
      placeId,
      displayName: data.displayName?.text ?? null,
      formattedAddress: data.formattedAddress ?? null,
      phone: data.nationalPhoneNumber ?? null,
      regular,
      weekdayDescriptions: data.regularOpeningHours?.weekdayDescriptions ?? [],
      current,
      currentWeekdayDescriptions: data.currentOpeningHours?.weekdayDescriptions ?? [],
      specialDays,
      hasSpecialHours: current.length > 0 && regular.length > 0 && !samePeriods(regular, current),
    };
  } catch (e) {
    console.error('[seo] Googleマップの営業時間を取得できませんでした:', e);
    return null;
  }
}

/** Googleマップの営業時間を「09:00–17:00」の集合にする。サイト本文との突き合わせ用。 */
export function hoursAsRanges(periods: MapsPeriod[]): Set<string> {
  return new Set(periods.map((p) => `${p.open}–${p.close}`));
}

const SCHEMA_DAYS = [
  'https://schema.org/Sunday',
  'https://schema.org/Monday',
  'https://schema.org/Tuesday',
  'https://schema.org/Wednesday',
  'https://schema.org/Thursday',
  'https://schema.org/Friday',
  'https://schema.org/Saturday',
];

/**
 * Googleマップの営業時間を schema.org の openingHoursSpecification に変換する。
 * 同じ時間帯の曜日はまとめる（Googleのリッチリザルト側で扱いやすい）。
 */
export function toOpeningHoursSpecification(periods: MapsPeriod[]) {
  const byRange = new Map<string, number[]>();
  for (const p of periods) {
    const key = `${p.open}|${p.close}`;
    if (!byRange.has(key)) byRange.set(key, []);
    byRange.get(key)!.push(p.day);
  }

  return [...byRange.entries()].map(([key, days]) => {
    const [opens, closes] = key.split('|');
    return {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: days.sort().map((d) => SCHEMA_DAYS[d]),
      opens,
      closes,
    };
  });
}
