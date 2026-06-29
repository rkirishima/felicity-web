import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TOKEN_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const STATUS_LABEL: Record<string, { ja: string; en: string; color: string }> = {
  open: { ja: '募集中', en: 'Open', color: '#7AAFC4' },
  confirmed: { ja: '開催確定', en: 'Confirmed', color: '#6B9E6B' },
  full: { ja: '満員御礼', en: 'Full', color: '#C8A961' },
  closed: { ja: '受付終了', en: 'Closed', color: '#8C7B6B' },
  cancelled: { ja: '中止', en: 'Cancelled', color: '#C87A7A' },
};

function formatTimeRange(start?: string | null, end?: string | null) {
  if (!start && !end) return null;
  const s = start ? start.slice(0, 5) : '';
  const e = end ? end.slice(0, 5) : '';
  return `${s}–${e}`;
}

function formatJpDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dow = ['日', '月', '火', '水', '木', '金', '土'][date.getUTCDay()];
  return `${y}年${m}月${d}日（${dow}）`;
}

interface OrganizerPageProps {
  params: Promise<{ token: string }>;
}

export const dynamic = 'force-dynamic';

export default async function OrganizerView({ params }: OrganizerPageProps) {
  const { token } = await params;
  if (!TOKEN_RE.test(token)) notFound();

  const { data: event } = await supabase
    .from('events')
    .select(
      'id, title, title_en, description, status, confirmed_date, max_attendees, event_dates(id, date, start_time, end_time, yes_count, maybe_count), event_votes(id, event_date_id, voter_name, voter_email, response, created_at)'
    )
    .eq('organizer_token', token)
    .maybeSingle();

  if (!event) notFound();

  const dates = [...(event.event_dates || [])].sort((a: any, b: any) =>
    a.date.localeCompare(b.date)
  );
  const votes = event.event_votes || [];

  // Group voters by date, prioritize "yes", then "maybe"
  const votesByDate: Record<string, any[]> = {};
  for (const v of votes) {
    (votesByDate[v.event_date_id] ||= []).push(v);
  }

  const targetDate = event.confirmed_date
    ? dates.find((d: any) => d.date === event.confirmed_date)
    : dates[0];

  const yesVotes = targetDate ? (votesByDate[targetDate.id] || []).filter((v) => v.response === 'yes') : [];
  const maybeVotes = targetDate ? (votesByDate[targetDate.id] || []).filter((v) => v.response === 'maybe') : [];
  const seatsLeft =
    event.max_attendees && event.max_attendees > 0
      ? Math.max(0, event.max_attendees - yesVotes.length)
      : null;

  const statusInfo = STATUS_LABEL[event.status] || { ja: event.status, en: event.status, color: '#8C7B6B' };

  return (
    <div className="min-h-screen bg-[#F4EFE4] text-[#2C2416] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#8C7B6B] mb-2">
          Organizer view · Felicity Cafe
        </div>
        <h1 className="text-[24px] leading-tight mb-1">{event.title}</h1>
        {event.title_en && event.title_en !== event.title && (
          <p className="text-[14px] text-[#8C7B6B] mb-4">{event.title_en}</p>
        )}

        <div className="flex items-center gap-2 mb-6">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: statusInfo.color }}
          />
          <span className="font-mono text-[11px] tracking-wider uppercase">
            {statusInfo.ja} / {statusInfo.en}
          </span>
        </div>

        {/* Date + counts */}
        {targetDate && (
          <div className="bg-[#EDE5D8] border border-[#DDD5C5] rounded-sm p-5 mb-6">
            <div className="text-[16px] mb-1">{formatJpDate(targetDate.date)}</div>
            {formatTimeRange(targetDate.start_time, targetDate.end_time) && (
              <div className="text-[13px] text-[#8C7B6B] mb-4 font-mono">
                {formatTimeRange(targetDate.start_time, targetDate.end_time)}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 text-center">
              <Stat label="参加 yes" value={yesVotes.length} accent="#7AAFC4" />
              <Stat label="検討 maybe" value={maybeVotes.length} accent="#C8B89A" />
              <Stat
                label={event.max_attendees ? '残席' : '定員'}
                value={seatsLeft !== null ? seatsLeft : '—'}
                accent="#6B9E6B"
              />
            </div>

            {event.max_attendees ? (
              <p className="text-[11px] text-[#8C7B6B] font-mono mt-3 text-center">
                定員 {event.max_attendees}名
              </p>
            ) : null}
          </div>
        )}

        {/* Multiple date breakdown if there's more than one candidate date */}
        {dates.length > 1 && !event.confirmed_date && (
          <div className="bg-[#EDE5D8] border border-[#DDD5C5] rounded-sm p-5 mb-6">
            <h2 className="font-mono text-[10px] tracking-wider uppercase text-[#8C7B6B] mb-3">
              候補日ごとの投票
            </h2>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#DDD5C5]">
                  <th className="text-left py-2 text-[#8C7B6B] font-mono text-[10px]">DATE</th>
                  <th className="text-right py-2 text-[#7AAFC4] font-mono text-[10px]">YES</th>
                  <th className="text-right py-2 text-[#C8B89A] font-mono text-[10px]">MAYBE</th>
                </tr>
              </thead>
              <tbody>
                {dates.map((d: any) => (
                  <tr key={d.id} className="border-b border-[#DDD5C5]/50">
                    <td className="py-1.5">
                      <span className="font-mono">{d.date}</span>
                      {formatTimeRange(d.start_time, d.end_time) && (
                        <span className="text-[#8C7B6B] font-mono ml-2">
                          {formatTimeRange(d.start_time, d.end_time)}
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 text-right font-mono">{d.yes_count}</td>
                    <td className="py-1.5 text-right font-mono">{d.maybe_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Attendee list */}
        <div className="bg-[#EDE5D8] border border-[#DDD5C5] rounded-sm p-5 mb-6">
          <h2 className="font-mono text-[10px] tracking-wider uppercase text-[#8C7B6B] mb-3">
            参加者リスト
          </h2>
          {yesVotes.length === 0 && maybeVotes.length === 0 ? (
            <p className="text-[13px] text-[#8C7B6B]">
              まだエントリーがありません。
            </p>
          ) : (
            <>
              {yesVotes.length > 0 && (
                <div className="mb-4">
                  <div className="font-mono text-[10px] text-[#7AAFC4] uppercase mb-2">
                    参加 / Confirmed ({yesVotes.length})
                  </div>
                  <AttendeeList items={yesVotes} />
                </div>
              )}
              {maybeVotes.length > 0 && (
                <div>
                  <div className="font-mono text-[10px] text-[#C8B89A] uppercase mb-2">
                    検討中 / Maybe ({maybeVotes.length})
                  </div>
                  <AttendeeList items={maybeVotes} />
                </div>
              )}
            </>
          )}
        </div>

        <p className="text-[10px] text-[#8C7B6B] font-mono text-center mt-8">
          このページのURLは関係者限定です。共有にご注意ください。
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <div>
      <div className="text-[28px] font-mono leading-none" style={{ color: accent }}>
        {value}
      </div>
      <div className="text-[10px] text-[#8C7B6B] font-mono uppercase tracking-wider mt-1">
        {label}
      </div>
    </div>
  );
}

function AttendeeList({ items }: { items: any[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((v) => (
        <li key={v.id} className="text-[13px] flex flex-col">
          <span className="text-[#2C2416]">{v.voter_name}</span>
          <a
            href={`mailto:${v.voter_email}`}
            className="text-[11px] text-[#8C7B6B] hover:text-[#7AAFC4] font-mono"
          >
            {v.voter_email}
          </a>
        </li>
      ))}
    </ul>
  );
}
