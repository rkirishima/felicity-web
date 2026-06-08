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
  max_attendees?: number;
  status: string;
  confirmed_date: string | null;
  external_url: string | null;
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
  const isConfirmed = event.status === 'confirmed' || event.status === 'full';
  const isFull = event.status === 'full';
  const isExternal = !!event.external_url;
  const maxAttendees = event.max_attendees && event.max_attendees > 0 ? event.max_attendees : null;

  const sortedDates = [...event.event_dates].sort((a, b) => a.date.localeCompare(b.date));

  // Count of registered attendees (yes votes on confirmed date, or max yes_count if not confirmed)
  const registeredCount = (() => {
    if (event.confirmed_date) {
      const d = sortedDates.find((x) => x.date === event.confirmed_date);
      return d?.yes_count || 0;
    }
    return Math.max(0, ...sortedDates.map((d) => d.yes_count));
  })();

  const remainingSeats = maxAttendees ? Math.max(0, maxAttendees - registeredCount) : null;

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
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {isConfirmed && !isFull && (
                <span className="inline-block bg-[#7AAFC4] text-white font-mono text-[9px] tracking-[0.16em] uppercase px-2.5 py-1 rounded-sm">
                  {isEn ? 'Confirmed!' : '\u958B\u50AC\u6C7A\u5B9A\uFF01'}
                </span>
              )}
              {isFull && (
                <span className="inline-block bg-[#C87A7A] text-white font-mono text-[9px] tracking-[0.16em] uppercase px-2.5 py-1 rounded-sm">
                  {isEn ? 'Sold Out' : '\u6E80\u54E1\u5FA1\u793C'}
                </span>
              )}
              {maxAttendees && !isFull && !isExternal && (
                <span className="inline-block font-mono text-[10px] text-[#8C7B6B]">
                  {registeredCount}/{maxAttendees}{isEn ? '' : '\u540D'}
                </span>
              )}
              {isExternal && (
                <span className="inline-block font-mono text-[9px] tracking-[0.16em] uppercase text-[#8C7B6B] border border-[#DDD5C5] px-2.5 py-1 rounded-sm">
                  {isEn ? 'External signup' : '\u5916\u90E8\u30B5\u30A4\u30C8\u3088\u308A\u7533\u8FBC'}
                </span>
              )}
            </div>

            <h4 className="text-[18px] font-light text-[#2C2416] mb-2">{title}</h4>
            {desc && (
              <p className="text-[13px] text-[#8C7B6B] leading-relaxed mb-4">{desc}</p>
            )}

            {/* Date pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {sortedDates.map((d) => {
                const isWinner = !isExternal && isConfirmed && event.confirmed_date === d.date;
                const pillBg = isExternal ? '#7AAFC4' : isWinner ? '#7AAFC4' : '#F4EFE4';
                const pillBorder = isExternal ? '#7AAFC4' : isWinner ? '#7AAFC4' : '#DDD5C5';
                const pillColor = isExternal || isWinner ? '#fff' : '#2C2416';
                return (
                  <div
                    key={d.id}
                    className="flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[12px] font-mono border"
                    style={{ backgroundColor: pillBg, borderColor: pillBorder, color: pillColor }}
                  >
                    <span>{formatDateShort(d.date, locale)}</span>
                    {!isExternal && d.yes_count > 0 && (
                      <span style={{ color: isWinner ? '#fff' : '#7AAFC4' }}>
                        {'\u25CB'}{d.yes_count}
                      </span>
                    )}
                    {!isExternal && d.maybe_count > 0 && (
                      <span style={{ color: isWinner ? 'rgba(255,255,255,0.7)' : '#C8B89A' }}>
                        {'\u25B3'}{d.maybe_count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Confirmed date display — skip for external events (pills already show full range) */}
            {!isExternal && isConfirmed && event.confirmed_date && (
              <p className="text-[13px] text-[#2C2416] font-light mb-3">
                {isEn ? 'Date: ' : '\u65E5\u7A0B\uFF1A'}
                <span className="font-mono">{formatDateShort(event.confirmed_date, locale)}</span>
                {remainingSeats !== null && remainingSeats > 0 && (
                  <span className="ml-2 text-[#7AAFC4] font-mono text-[11px]">
                    {isEn
                      ? `(${remainingSeats} seat${remainingSeats === 1 ? '' : 's'} left)`
                      : `\uFF08\u3042\u3068${remainingSeats}\u540D\uFF09`}
                  </span>
                )}
              </p>
            )}

            {/* Vote/Register button — show unless full */}
            {isExternal && event.external_url ? (
              <a
                href={event.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 border border-[#7AAFC4] bg-[#7AAFC4] text-white font-mono text-[10px] tracking-[0.16em] uppercase px-5 py-2.5 hover:bg-[#5F95AB] hover:border-[#5F95AB] transition-colors"
              >
                {isEn ? 'Apply on official site' : '\u7533\u8FBC\u306F\u3053\u3061\u3089'}
                <span aria-hidden>{'\u2192'}</span>
              </a>
            ) : !isFull ? (
              <button
                onClick={() => setShowVote(true)}
                className="border border-[#7AAFC4] text-[#7AAFC4] font-mono text-[10px] tracking-[0.16em] uppercase px-5 py-2.5 hover:bg-[#7AAFC4] hover:text-white transition-colors"
              >
                {isConfirmed
                  ? (isEn ? 'Register' : '\u53C2\u52A0\u3092\u767B\u9332')
                  : (isEn ? 'Vote on dates' : '\u65E5\u7A0B\u306B\u6295\u7968\u3059\u308B')}
              </button>
            ) : (
              <p className="text-[13px] text-[#C87A7A] font-light">
                {isEn ? 'Registration closed.' : '\u52DF\u96C6\u3092\u7DE0\u3081\u5207\u308A\u307E\u3057\u305F\u3002'}
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
