'use client';
import { useState } from 'react';

interface CollapsibleAboutProps {
  content: string;
  readMoreLabel?: string;
  readLessLabel?: string;
}

export function CollapsibleAbout({
  content,
  readMoreLabel = '続きを読む',
  readLessLabel = '閉じる',
}: CollapsibleAboutProps) {
  const [expanded, setExpanded] = useState(false);
  const paragraphs = content.split('\n\n').filter(Boolean);
  const visible = expanded ? paragraphs : paragraphs.slice(0, 1);

  return (
    <div className="space-y-6 text-[16px] font-light text-[#2C2416] leading-relaxed">
      {visible.map((p, idx) => (
        <p key={idx} className="max-w-2xl">{p}</p>
      ))}
      {paragraphs.length > 1 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="font-mono text-[10px] tracking-[0.14em] text-[#7AAFC4] hover:text-[#2C2416] transition-colors uppercase"
        >
          {expanded ? readLessLabel : readMoreLabel} {expanded ? '↑' : '↓'}
        </button>
      )}
    </div>
  );
}
