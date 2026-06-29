// Grind options for coffee bean products.
//
// Customers choose whole bean or ground; if ground, drip-use or espresso-use.
// Mirrors the in-store Square POS "挽き方" modifier so the Pi label printer can
// apply the right expiry (豆 = 4 months, 粉 = 2 months).
//
// Price is identical across grinds — this is a free fulfillment option, carried
// as metadata through cart → checkout → Stripe → order record → label print.

export type GrindOption = 'whole' | 'drip' | 'espresso';

export const DEFAULT_GRIND: GrindOption = 'whole';

type Locale = 'ja' | 'en';

interface GrindMeta {
  value: GrindOption;
  ja: string;      // primary label shown in the selector
  en: string;
  subJa: string;   // grind-size hint
  subEn: string;
  noteJa: string;  // compact label appended to item names in order records
  noteEn: string;
}

export const GRIND_OPTIONS: GrindMeta[] = [
  {
    value: 'whole',
    ja: '豆のまま',
    en: 'Whole bean',
    subJa: '挽かずにお届け',
    subEn: 'Unground',
    noteJa: '豆のまま',
    noteEn: 'Whole bean',
  },
  {
    value: 'drip',
    ja: '粉 / ドリップ用',
    en: 'Ground / Drip',
    subJa: '中細挽き',
    subEn: 'Medium-fine',
    noteJa: '粉・ドリップ用',
    noteEn: 'Ground · Drip',
  },
  {
    value: 'espresso',
    ja: '粉 / エスプレッソ用',
    en: 'Ground / Espresso',
    subJa: '極細挽き',
    subEn: 'Extra-fine',
    noteJa: '粉・エスプレッソ用',
    noteEn: 'Ground · Espresso',
  },
];

export function getGrindMeta(grind: GrindOption | undefined): GrindMeta {
  return GRIND_OPTIONS.find((o) => o.value === grind) ?? GRIND_OPTIONS[0];
}

// Selector label, e.g. "粉 / ドリップ用".
export function grindLabel(grind: GrindOption | undefined, locale: Locale = 'ja'): string {
  const m = getGrindMeta(grind);
  return locale === 'en' ? m.en : m.ja;
}

// Compact label for appending to item names, e.g. "粉・ドリップ用".
export function grindNote(grind: GrindOption | undefined, locale: Locale = 'ja'): string {
  const m = getGrindMeta(grind);
  return locale === 'en' ? m.noteEn : m.noteJa;
}

// "Brazil Santa Alina 200g" → "Brazil Santa Alina 200g（粉・ドリップ用）".
// Used in human-facing order records (Square note, email, Telegram). The clean
// `name` field is kept separate so the label printer's size-suffix parser still
// works; grind is also passed to the printer as its own field.
export function withGrindNote(name: string, grind: GrindOption | undefined, locale: Locale = 'ja'): string {
  const note = grindNote(grind, locale);
  return locale === 'en' ? `${name} (${note})` : `${name}（${note}）`;
}

// Whole bean prints as 'bean' (4-month expiry); ground prints as 'powder'
// (2-month expiry) regardless of drip vs espresso.
export function grindToPrintType(grind: GrindOption | undefined): 'bean' | 'powder' {
  return grind && grind !== 'whole' ? 'powder' : 'bean';
}
