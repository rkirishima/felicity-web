// Felicity SEOコーチ — 型定義
//
// 設計方針: 判定はすべてサーバー側で行い、日本語/英語の両方の文面を
// Finding に埋め込んで返す。クライアントは言語を切り替えるだけでよく、
// 画面側に SEO の判断ロジックを持たせない。

export type Severity = 'red' | 'yellow' | 'green';

/** 画面に出す言語別の文面。専門用語は使わない。 */
export interface FindingText {
  /** 何が起きているか（1行・専門用語なし） */
  title: string;
  /** 売上・来店にどう影響するか（1文） */
  impact: string;
  /** 具体的にやること */
  action: string;
}

export interface Finding {
  id: string;
  severity: Severity;
  /** 0-100。スコア計算と「今週直すべきトップ3」の並び順に使う売上インパクト */
  weight: number;
  category: 'page' | 'local' | 'schema';
  /** 対象ページ（サイト全体の指摘なら undefined） */
  url?: string;
  ja: FindingText;
  en: FindingText;
  /** 「コピー」ボタンでそのまま貼れる修正文。JSON-LD や meta 文面など */
  copyText?: string;
  /** copyText の種類。画面の見せ方を変えるために使う */
  copyKind?: 'text' | 'json' | 'html';
}

export interface PageSnapshot {
  url: string;
  path: string;
  status: number;
  locale: 'ja' | 'en';
  title: string | null;
  description: string | null;
  canonical: string | null;
  robots: string | null;
  h1: string[];
  og: Record<string, string>;
  hreflang: Record<string, string>;
  images: { src: string; alt: string | null }[];
  links: string[];
  videos: { src: string; preload: string | null }[];
  jsonLd: unknown[];
  mapEmbeds: string[];
  /** 本文テキスト（NAP 照合用。長さは抑える） */
  text: string;
  htmlBytes: number;
}

export interface ScanReport {
  scannedAt: string;
  baseUrl: string;
  score: number;
  /** Googleマップから取れた営業時間。鍵が無ければ null */
  maps: import('./maps').MapsHours | null;
  pages: PageSnapshot[];
  findings: Finding[];
  /** 売上インパクト順の上位3件 */
  top3: Finding[];
  errors: string[];
}
