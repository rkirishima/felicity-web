// スコアと「今週直すべきトップ3」。
//
// スコアは 100 点満点。各チェックの weight(売上インパクト) を満点とし、
// 赤は満額、黄は半額を引く。チェックが増えても 0-100 に収まる。

import type { Finding } from './types';

export function calculateScore(findings: Finding[]): number {
  const total = findings.reduce((sum, f) => sum + f.weight, 0);
  if (total === 0) return 100;

  const lost = findings.reduce((sum, f) => {
    if (f.severity === 'red') return sum + f.weight;
    if (f.severity === 'yellow') return sum + f.weight * 0.5;
    return sum;
  }, 0);

  return Math.max(0, Math.min(100, Math.round(100 * (1 - lost / total))));
}

/**
 * 直すべき順。赤を黄より先に出し、同じ色なら売上インパクトが大きい順。
 * 緑（問題なし）は候補に入れない。
 */
export function prioritize(findings: Finding[]): Finding[] {
  return findings
    .filter((f) => f.severity !== 'green')
    .sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === 'red' ? -1 : 1;
      return b.weight - a.weight;
    });
}

export function topThree(findings: Finding[]): Finding[] {
  return prioritize(findings).slice(0, 3);
}
