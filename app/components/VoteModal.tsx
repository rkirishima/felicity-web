'use client';
import { useState, useEffect } from 'react';

interface EventDate {
  id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  yes_count: number;
  maybe_count: number;
}

interface Props {
  eventId: string;
  eventTitle: string;
  dates: EventDate[];
  locale: 'ja' | 'en';
  onClose: () => void;
  onVoted: (updated: any) => void;
}

type Response = 'yes' | 'maybe' | 'no';

const STORAGE_KEY = 'felicity-voter';

function formatDate(dateStr: string, locale: 'ja' | 'en'): string {
  const d = new Date(dateStr + 'T00:00:00');
  const dayNames = locale === 'ja'
    ? ['日', '月', '火', '水', '木', '金', '土']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dow = dayNames[d.getDay()];
  return locale === 'ja' ? `${month}/${day}(${dow})` : `${month}/${day} ${dow}`;
}

function formatTime(start: string | null, end: string | null): string {
  if (!start) return '';
  const fmt = (t: string) => t.slice(0, 5);
  return end ? `${fmt(start)}\u2013${fmt(end)}` : fmt(start);
}

export function VoteModal({ eventId, eventTitle, dates, locale, onClose, onVoted }: Props) {
  const isEn = locale === 'en';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [votes, setVotes] = useState<Record<string, Response>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { name: n, email: e } = JSON.parse(saved);
        if (n) setName(n);
        if (e) setEmail(e);
      }
    } catch {}
  }, []);

  // Initialize all dates to 'no'
  useEffect(() => {
    const initial: Record<string, Response> = {};
    dates.forEach((d) => { initial[d.id] = 'no'; });
    setVotes(initial);
  }, [dates]);

  function setVote(dateId: string, response: Response) {
    setVotes((prev) => ({ ...prev, [dateId]: response }));
  }

  async function handleSubmit() {
    if (!name.trim() || !email.trim()) {
      setError(isEn ? 'Name and email are required.' : 'お名前とメールアドレスを入力してください。');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: name.trim(), email: email.trim() }));

      const res = await fetch('/api/events/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          voter_name: name.trim(),
          voter_email: email.trim(),
          votes: Object.entries(votes).map(([date_id, response]) => ({ date_id, response })),
        }),
      });

      if (!res.ok) throw new Error('Vote failed');

      const updated = await res.json();
      onVoted(updated);
      setDone(true);
    } catch {
      setError(isEn ? 'Something went wrong. Please try again.' : 'エラーが発生しました。もう一度お試しください。');
    } finally {
      setSubmitting(false);
    }
  }

  const responseButtons: { value: Response; label: string; color: string; activeBg: string }[] = [
    { value: 'yes', label: '\u25CB', color: '#7AAFC4', activeBg: '#7AAFC4' },
    { value: 'maybe', label: '\u25B3', color: '#C8B89A', activeBg: '#C8B89A' },
    { value: 'no', label: '\u00D7', color: '#DDD5C5', activeBg: '#DDD5C5' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(44, 36, 22, 0.7)' }}
      onClick={onClose}
    >
      <div
        className="bg-[#EDE5D8] w-full max-w-md rounded-sm overflow-y-auto max-h-[90vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8C7B6B] hover:text-[#2C2416] transition-colors"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>

        <div className="p-6 md:p-8">
          {done ? (
            /* Success state */
            <div className="text-center py-8">
              <div className="text-[#7AAFC4] text-4xl mb-4">{'\u2713'}</div>
              <h3 className="text-[20px] font-light text-[#2C2416] mb-2">
                {isEn ? 'Thank you!' : 'ありがとうございます!'}
              </h3>
              <p className="text-[13px] text-[#8C7B6B]">
                {isEn
                  ? 'Your vote has been recorded. We\'ll notify you when the date is confirmed.'
                  : '投票を受け付けました。日程が決まりましたらご連絡いたします。'}
              </p>
              <button
                onClick={onClose}
                className="mt-6 border border-[#7AAFC4] text-[#7AAFC4] font-mono text-[10px] tracking-[0.16em] uppercase px-6 py-3 hover:bg-[#7AAFC4] hover:text-white transition-colors"
              >
                {isEn ? 'Close' : '閉じる'}
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <p className="font-mono text-[9px] tracking-[0.3em] text-[#7AAFC4] uppercase mb-2">
                {isEn ? 'Schedule Vote' : '日程投票'}
              </p>
              <h3 className="text-[20px] font-light text-[#2C2416] mb-6">
                {eventTitle}
              </h3>

              {/* Name + Email */}
              <div className="space-y-3 mb-6">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isEn ? 'Your name' : 'お名前'}
                  className="w-full bg-[#F4EFE4] border border-[#DDD5C5] px-4 py-3 text-[14px] text-[#2C2416] placeholder-[#C8B89A] rounded-sm outline-none focus:border-[#7AAFC4] transition-colors"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isEn ? 'Email address' : 'メールアドレス'}
                  className="w-full bg-[#F4EFE4] border border-[#DDD5C5] px-4 py-3 text-[14px] text-[#2C2416] placeholder-[#C8B89A] rounded-sm outline-none focus:border-[#7AAFC4] transition-colors"
                />
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mb-4 pb-3 border-b border-[#DDD5C5]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#7AAFC4] font-mono text-[14px]">{'\u25CB'}</span>
                  <span className="font-mono text-[9px] tracking-[0.1em] text-[#8C7B6B] uppercase">
                    {isEn ? 'Available' : '参加可'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#C8B89A] font-mono text-[14px]">{'\u25B3'}</span>
                  <span className="font-mono text-[9px] tracking-[0.1em] text-[#8C7B6B] uppercase">
                    {isEn ? 'Maybe' : '未定'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#DDD5C5] font-mono text-[14px]">{'\u00D7'}</span>
                  <span className="font-mono text-[9px] tracking-[0.1em] text-[#8C7B6B] uppercase">
                    {isEn ? 'No' : '不可'}
                  </span>
                </div>
              </div>

              {/* Date rows */}
              <div className="space-y-2 mb-6">
                {dates
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between bg-[#F4EFE4] rounded-sm px-4 py-3"
                    >
                      <div>
                        <span className="text-[14px] text-[#2C2416] font-light">
                          {formatDate(d.date, locale)}
                        </span>
                        {d.start_time && (
                          <span className="text-[12px] text-[#8C7B6B] ml-2 font-mono">
                            {formatTime(d.start_time, d.end_time)}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        {responseButtons.map((btn) => (
                          <button
                            key={btn.value}
                            onClick={() => setVote(d.id, btn.value)}
                            className="w-10 h-10 rounded-sm flex items-center justify-center font-mono text-[16px] transition-all border"
                            style={{
                              backgroundColor: votes[d.id] === btn.value ? btn.activeBg : 'transparent',
                              color: votes[d.id] === btn.value ? '#fff' : btn.color,
                              borderColor: votes[d.id] === btn.value ? btn.activeBg : '#DDD5C5',
                            }}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>

              {error && (
                <p className="text-[12px] text-red-600 mb-4">{error}</p>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full border border-[#7AAFC4] text-[#7AAFC4] font-mono text-[11px] tracking-[0.16em] uppercase px-6 py-3.5 hover:bg-[#7AAFC4] hover:text-white transition-colors disabled:opacity-50"
              >
                {submitting
                  ? (isEn ? 'Submitting...' : '送信中...')
                  : (isEn ? 'Submit Vote' : '投票する')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
