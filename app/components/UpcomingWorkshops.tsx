'use client';
import { useState, useEffect } from 'react';
import { WorkshopCard } from './WorkshopCard';

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
  external_url: string | null;
  event_dates: EventDate[];
}

interface Props {
  locale: 'ja' | 'en';
}

export function UpcomingWorkshops({ locale }: Props) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const isEn = locale === 'en';

  useEffect(() => {
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setEvents(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleUpdate(updated: Event) {
    setEvents((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e))
    );
  }

  // Don't render anything if no events
  if (loading || events.length === 0) return null;

  return (
    <div className="mt-16 border-t border-[#DDD5C5] pt-12">
      <p className="font-mono text-[10px] tracking-[0.2em] text-[#8C7B6B] uppercase mb-5 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-[#7AAFC4]" />
        {isEn ? 'Upcoming workshops' : '\u958B\u50AC\u4E88\u5B9A\u306E\u30EF\u30FC\u30AF\u30B7\u30E7\u30C3\u30D7'}
      </p>
      <p className="text-[15px] font-light text-[#2C2416] mb-8">
        {isEn
          ? 'Vote on your preferred dates. Events are confirmed when enough people join.'
          : '\u53C2\u52A0\u3067\u304D\u308B\u65E5\u7A0B\u306B\u6295\u7968\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u4EBA\u6570\u304C\u96C6\u307E\u308A\u6B21\u7B2C\u3001\u958B\u50AC\u304C\u6C7A\u5B9A\u3057\u307E\u3059\u3002'}
      </p>
      <div className="space-y-4">
        {events.map((event) => (
          <WorkshopCard
            key={event.id}
            event={event}
            locale={locale}
            onUpdate={handleUpdate}
          />
        ))}
      </div>
    </div>
  );
}
