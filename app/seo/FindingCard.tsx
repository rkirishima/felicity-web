'use client';

import { useState } from 'react';
import type { Finding } from '@/app/lib/seo/types';

const DOT: Record<Finding['severity'], string> = {
  red: '🔴',
  yellow: '🟡',
  green: '🟢',
};

const STATE_LABEL: Record<Finding['severity'], { ja: string; en: string }> = {
  red: { ja: '今すぐ直す', en: 'Fix now' },
  yellow: { ja: '直したほうがいい', en: 'Worth fixing' },
  green: { ja: '問題なし', en: 'All good' },
};

export function FindingCard({ finding, lang }: { finding: Finding; lang: 'ja' | 'en' }) {
  const [copied, setCopied] = useState(false);
  const t = finding[lang];
  const isEn = lang === 'en';

  const copy = async () => {
    if (!finding.copyText) return;
    try {
      await navigator.clipboard.writeText(finding.copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // クリップボードが使えない環境では選択してもらう
      setCopied(false);
    }
  };

  return (
    <div
      className={`rounded-lg border bg-[#EDE5D8] p-5 ${
        finding.severity === 'red' ? 'border-[#C96A5B]' : 'border-[#DDD5C5]'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-[18px] leading-none pt-[2px]">{DOT[finding.severity]}</span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8C7B6B]">
            {STATE_LABEL[finding.severity][lang]}
          </p>
          <h3 className="mt-1 text-[17px] font-medium leading-snug text-[#2C2416]">{t.title}</h3>

          <p className="mt-3 text-[14px] leading-relaxed text-[#5C5248]">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#8C7B6B]">
              {isEn ? 'Why it matters' : 'お店への影響'}
            </span>
            <br />
            {t.impact}
          </p>

          <p className="mt-3 text-[14px] leading-relaxed text-[#2C2416]">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#8C7B6B]">
              {isEn ? 'What to do' : 'やること'}
            </span>
            <br />
            {t.action}
          </p>

          {finding.copyText && (
            <div className="mt-4">
              <button
                onClick={copy}
                className={`rounded-sm px-4 py-2 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
                  copied
                    ? 'bg-[#7AAFC4] text-[#2C2416]'
                    : 'bg-[#DDD5C5] text-[#5C5248] hover:bg-[#7AAFC4] hover:text-[#2C2416]'
                }`}
              >
                {copied ? (isEn ? '✓ Copied' : '✓ コピーしました') : isEn ? 'Copy the fix' : '修正文をコピー'}
              </button>
              <pre className="mt-3 max-h-56 overflow-auto rounded border border-[#DDD5C5] bg-[#F4EFE4] p-3 text-[11px] leading-relaxed text-[#5C5248]">
                {finding.copyText}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
