'use client';
import { useState } from 'react';
import Image from 'next/image';
import { VoteModal } from './VoteModal';

interface EventDate {
  id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  yes_count: number;
  maybe_count: number;
}

interface Event {
  id: string;
  title: string;
  title_en: string;
  description: string | null;
  description_en: string | null;
  photo: string | null;
  min_votes: number;
  status: string;
  confirmed_date: string | null;
  event_dates: EventDate[];
}

interface Props {
  event: Event;
  locale: 'ja' | 'en';
  onUpdate: (updated: Event) => void;
}

function formatDateShort(dateStr: string, locale: 'ja' | 'en'): string {
  const d = new Date(dateStr + 'T00:00:00');
  const dayNames = locale === 'ja'
    ? ['日', '月', '火', '水', '木', '金', '土']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dow = dayNames[d.getDay()];
  return locale === 'ja' ? `${month}/${day}(${dow})` : `${month}/${day}`;
}

export function WorkshopCard({ event, locale, onUpdate }: Props) {
  const [showVote, setShowVote] = useState(false);
  const isEn = locale === 'en';
  const title = isEn ? event.title_en : event.title;
  const desc = isEn ? event.description_en : event.description;
  const isConfirmed = event.status === 'confirmed';

  const sortedDates = [...event.event_dates].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <div className="bg-[#EDE5D8] border border-[#DDD5C5] rounded-sm overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Photo */}
          {event.photo && (
            <div className="relative w-full md:w-48 h-48 md:h-auto flex-shrink-0">
              <Image
                src={event.photo}
                alt={title}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 p-5 md:p-6">
            {/* Status badge */}
            {isConfirmed && (
              <span className="inline-block bg-[#7AAFC4] text-white font-mono text-[9px] tracking-[0.16em] uppercase px-2.5 py-1 rounded-sm mb-3">
                {isEn ? 'Confirmed!' : '\u958B\u50AC\u6C7A\u5B9A\uFF01'}
              </span>
            )}

            <h4 className="text-[18px] font-light text-[#2C2416] mb-2">{title}</h4>
            {desc && (
              <p className="text-[13px] text-[#8C7B6B] leading-relaxed mb-4">{desc}</p>
            )}

            {/* Date pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {sortedDates.map((d) => {
                const isWinner = isConfirmed && event.confirmed_date === d.date;
                return (
                  <div
                    key={d.id}
                    className="flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[12px] font-mono border"
                    style={{
                      backgroundColor: isWinner ? '#7AAFC4' : '#F4EFE4',
                      borderColor: isWinner ? '#7AAFC4' : '#DDD5C5',
                      color: isWinner ? '#fff' : '#2C2416',
                    }}
                  >
                    <span>{formatDateShort(d.date, locale)}</span>
                    {d.yes_count > 0 && (
                      <span style={{ color: isWinner ? '#fff' : '#7AAFC4' }}>
                        {'\u25CB'}{d.yes_count}
                      </span>
                    )}
                    {d.maybe_count > 0 && (
                      <span style={{ color: isWinner ? 'rgba(255,255,255,0.7)' : '#C8B89A' }}>
                        {'\u25B3'}{d.maybe_count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Vote button — only for open events */}
            {!isConfirmed && (
              <button
                onClick={() => setShowVote(true)}
                className="border border-[#7AAFC4] text-[#7AAFC4] font-mono text-[10px] tracking-[0.16em] uppercase px-5 py-2.5 hover:bg-[#7AAFC4] hover:text-white transition-colors"
              >
                {isEn ? 'Vote on dates' : '\u65E5\u7A0B\u306B\u6295\u7968\u3059\u308B'}
              </button>
            )}

            {/* Confirmed date display */}
            {isConfirmed && event.confirmed_date && (
              <p className="text-[13px] text-[#2C2416] font-light">
                {isEn ? 'Date: ' : '\u65E5\u7A0B\uFF1A'}
                <span className="font-mono">{formatDateShort(event.confirmed_date, locale)}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {showVote && (
        <VoteModal
          eventId={event.id}
          eventTitle={title}
          dates={event.event_dates}
          locale={locale}
          onClose={() => setShowVote(false)}
          onVoted={(updated) => onUpdate(updated)}
        />
      )}
    </>
  );
}
