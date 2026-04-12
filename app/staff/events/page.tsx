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

interface Vote {
  id: string;
  event_date_id: string;
  voter_name: string;
  voter_email: string;
  response: string;
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
  created_at: string;
  event_dates: EventDate[];
  event_votes: Vote[];
}

const STATUS_COLORS: Record<string, string> = {
  open: '#7AAFC4',
  confirmed: '#6B9E6B',
  closed: '#8C7B6B',
  cancelled: '#C87A7A',
};

export default function StaffEventsPage() {
  const [staffKey, setStaffKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // New event form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    title_en: '',
    description: '',
    description_en: '',
    photo: '',
    min_votes: 3,
  });
  const [newDates, setNewDates] = useState<{ date: string; start_time: string; end_time: string }[]>([
    { date: '', start_time: '', end_time: '' },
  ]);

  // Expanded event detail
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const headers = {
    'Content-Type': 'application/json',
    'x-staff-key': staffKey,
  };

  async function login() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/events/admin', { headers: { 'x-staff-key': staffKey } });
      if (!res.ok) throw new Error('Invalid key');
      const data = await res.json();
      setEvents(data);
      setAuthenticated(true);
    } catch {
      setError('Invalid staff key');
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    const res = await fetch('/api/events/admin', { headers: { 'x-staff-key': staffKey } });
    if (res.ok) setEvents(await res.json());
  }

  async function createEvent() {
    setError('');
    if (!form.title || !form.title_en) {
      setError('Title (JA + EN) required');
      return;
    }

    const dates = newDates
      .filter((d) => d.date)
      .map((d) => ({
        date: d.date,
        start_time: d.start_time || null,
        end_time: d.end_time || null,
      }));

    if (dates.length === 0) {
      setError('At least one candidate date required');
      return;
    }

    try {
      const res = await fetch('/api/events/admin', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...form, dates }),
      });
      if (!res.ok) throw new Error('Create failed');
      setShowForm(false);
      setForm({ title: '', title_en: '', description: '', description_en: '', photo: '', min_votes: 3 });
      setNewDates([{ date: '', start_time: '', end_time: '' }]);
      await refresh();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch('/api/events/admin', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ id, status }),
    });
    await refresh();
  }

  async function deleteEvent(id: string) {
    if (!confirm('Delete this event and all votes?')) return;
    await fetch(`/api/events/admin?id=${id}`, { method: 'DELETE', headers });
    await refresh();
  }

  async function addDate(eventId: string, date: string, startTime: string, endTime: string) {
    await fetch('/api/events/admin', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        id: eventId,
        add_dates: [{ date, start_time: startTime || null, end_time: endTime || null }],
      }),
    });
    await refresh();
  }

  async function removeDate(eventId: string, dateId: string) {
    await fetch('/api/events/admin', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ id: eventId, remove_date_ids: [dateId] }),
    });
    await refresh();
  }

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#F4EFE4] flex items-center justify-center p-4">
        <div className="bg-[#EDE5D8] border border-[#DDD5C5] rounded-sm p-8 w-full max-w-sm">
          <h1 className="text-[20px] font-light text-[#2C2416] mb-6">Staff Events</h1>
          <input
            type="password"
            value={staffKey}
            onChange={(e) => setStaffKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            placeholder="Staff key"
            className="w-full bg-[#F4EFE4] border border-[#DDD5C5] px-4 py-3 text-[14px] text-[#2C2416] rounded-sm outline-none focus:border-[#7AAFC4] mb-4"
          />
          {error && <p className="text-[12px] text-red-600 mb-3">{error}</p>}
          <button
            onClick={login}
            disabled={loading}
            className="w-full border border-[#7AAFC4] text-[#7AAFC4] font-mono text-[10px] tracking-[0.16em] uppercase px-6 py-3 hover:bg-[#7AAFC4] hover:text-white transition-colors"
          >
            {loading ? 'Checking...' : 'Login'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4EFE4] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-[24px] font-light text-[#2C2416]">Event Management</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="border border-[#7AAFC4] text-[#7AAFC4] font-mono text-[10px] tracking-[0.16em] uppercase px-5 py-2.5 hover:bg-[#7AAFC4] hover:text-white transition-colors"
          >
            {showForm ? 'Cancel' : '+ New Event'}
          </button>
        </div>

        {/* New event form */}
        {showForm && (
          <div className="bg-[#EDE5D8] border border-[#DDD5C5] rounded-sm p-6 mb-8">
            <h2 className="text-[16px] font-light text-[#2C2416] mb-4">New Event</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Title (JA)"
                className="bg-[#F4EFE4] border border-[#DDD5C5] px-3 py-2 text-[13px] text-[#2C2416] rounded-sm outline-none focus:border-[#7AAFC4]"
              />
              <input
                value={form.title_en}
                onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                placeholder="Title (EN)"
                className="bg-[#F4EFE4] border border-[#DDD5C5] px-3 py-2 text-[13px] text-[#2C2416] rounded-sm outline-none focus:border-[#7AAFC4]"
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description (JA)"
                rows={2}
                className="bg-[#F4EFE4] border border-[#DDD5C5] px-3 py-2 text-[13px] text-[#2C2416] rounded-sm outline-none focus:border-[#7AAFC4]"
              />
              <textarea
                value={form.description_en}
                onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                placeholder="Description (EN)"
                rows={2}
                className="bg-[#F4EFE4] border border-[#DDD5C5] px-3 py-2 text-[13px] text-[#2C2416] rounded-sm outline-none focus:border-[#7AAFC4]"
              />
              <input
                value={form.photo}
                onChange={(e) => setForm({ ...form, photo: e.target.value })}
                placeholder="Photo path (e.g. /experiences/ai-seminar.jpg)"
                className="bg-[#F4EFE4] border border-[#DDD5C5] px-3 py-2 text-[13px] text-[#2C2416] rounded-sm outline-none focus:border-[#7AAFC4]"
              />
              <div className="flex items-center gap-2">
                <label className="text-[12px] text-[#8C7B6B]">Min votes:</label>
                <input
                  type="number"
                  value={form.min_votes}
                  onChange={(e) => setForm({ ...form, min_votes: parseInt(e.target.value) || 3 })}
                  min={1}
                  className="w-16 bg-[#F4EFE4] border border-[#DDD5C5] px-3 py-2 text-[13px] text-[#2C2416] rounded-sm outline-none focus:border-[#7AAFC4]"
                />
              </div>
            </div>

            {/* Candidate dates */}
            <p className="text-[12px] text-[#8C7B6B] mb-2 font-mono uppercase tracking-wider">Candidate dates</p>
            {newDates.map((d, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="date"
                  value={d.date}
                  onChange={(e) => {
                    const updated = [...newDates];
                    updated[i].date = e.target.value;
                    setNewDates(updated);
                  }}
                  className="bg-[#F4EFE4] border border-[#DDD5C5] px-3 py-2 text-[13px] text-[#2C2416] rounded-sm outline-none focus:border-[#7AAFC4]"
                />
                <input
                  type="time"
                  value={d.start_time}
                  onChange={(e) => {
                    const updated = [...newDates];
                    updated[i].start_time = e.target.value;
                    setNewDates(updated);
                  }}
                  placeholder="Start"
                  className="w-28 bg-[#F4EFE4] border border-[#DDD5C5] px-3 py-2 text-[13px] text-[#2C2416] rounded-sm outline-none focus:border-[#7AAFC4]"
                />
                <input
                  type="time"
                  value={d.end_time}
                  onChange={(e) => {
                    const updated = [...newDates];
                    updated[i].end_time = e.target.value;
                    setNewDates(updated);
                  }}
                  placeholder="End"
                  className="w-28 bg-[#F4EFE4] border border-[#DDD5C5] px-3 py-2 text-[13px] text-[#2C2416] rounded-sm outline-none focus:border-[#7AAFC4]"
                />
                {newDates.length > 1 && (
                  <button
                    onClick={() => setNewDates(newDates.filter((_, j) => j !== i))}
                    className="text-[#C87A7A] hover:text-red-600 px-2"
                  >
                    x
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setNewDates([...newDates, { date: '', start_time: '', end_time: '' }])}
              className="text-[12px] text-[#7AAFC4] font-mono mb-4 hover:underline"
            >
              + Add date
            </button>

            {error && <p className="text-[12px] text-red-600 mb-3">{error}</p>}

            <div>
              <button
                onClick={createEvent}
                className="border border-[#7AAFC4] text-[#7AAFC4] font-mono text-[10px] tracking-[0.16em] uppercase px-6 py-3 hover:bg-[#7AAFC4] hover:text-white transition-colors"
              >
                Create Event
              </button>
            </div>
          </div>
        )}

        {/* Event list */}
        <div className="space-y-4">
          {events.map((event) => {
            const isExpanded = expandedId === event.id;
            const sortedDates = [...event.event_dates].sort((a, b) => a.date.localeCompare(b.date));

            // Group votes by date
            const votesByDate: Record<string, Vote[]> = {};
            event.event_votes?.forEach((v) => {
              if (!votesByDate[v.event_date_id]) votesByDate[v.event_date_id] = [];
              votesByDate[v.event_date_id].push(v);
            });

            return (
              <div key={event.id} className="bg-[#EDE5D8] border border-[#DDD5C5] rounded-sm">
                {/* Summary row */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#E8E0D2] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : event.id)}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[event.status] || '#8C7B6B' }}
                    />
                    <span className="text-[15px] text-[#2C2416]">{event.title}</span>
                    <span className="font-mono text-[10px] text-[#8C7B6B] uppercase tracking-wider">
                      {event.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-[#8C7B6B]">
                      {sortedDates.length} dates / {event.event_votes?.length || 0} votes
                    </span>
                    <span className="text-[#8C7B6B] text-[12px]">{isExpanded ? '\u25B2' : '\u25BC'}</span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-[#DDD5C5] p-4">
                    <div className="text-[12px] text-[#8C7B6B] mb-4">
                      {event.title_en} | min: {event.min_votes} votes
                      {event.confirmed_date && (
                        <span className="ml-2 text-[#6B9E6B]">Confirmed: {event.confirmed_date}</span>
                      )}
                    </div>

                    {/* Vote table */}
                    <div className="overflow-x-auto mb-4">
                      <table className="w-full text-[12px]">
                        <thead>
                          <tr className="border-b border-[#DDD5C5]">
                            <th className="text-left py-2 pr-4 text-[#8C7B6B] font-mono uppercase text-[10px]">Voter</th>
                            {sortedDates.map((d) => (
                              <th key={d.id} className="text-center py-2 px-2 text-[#8C7B6B] font-mono text-[10px]">
                                {d.date.slice(5)}
                                <br />
                                <span className="text-[#7AAFC4]">{'\u25CB'}{d.yes_count}</span>{' '}
                                <span className="text-[#C8B89A]">{'\u25B3'}{d.maybe_count}</span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {/* Get unique voters */}
                          {Array.from(new Set(event.event_votes?.map((v) => v.voter_email) || []))
                            .map((email) => {
                              const voterVotes = event.event_votes?.filter((v) => v.voter_email === email) || [];
                              const voterName = voterVotes[0]?.voter_name || email;
                              return (
                                <tr key={email} className="border-b border-[#DDD5C5]/50">
                                  <td className="py-1.5 pr-4 text-[#2C2416]">{voterName}</td>
                                  {sortedDates.map((d) => {
                                    const vote = voterVotes.find((v) => v.event_date_id === d.id);
                                    const symbol =
                                      vote?.response === 'yes' ? '\u25CB'
                                        : vote?.response === 'maybe' ? '\u25B3'
                                          : '\u00D7';
                                    const color =
                                      vote?.response === 'yes' ? '#7AAFC4'
                                        : vote?.response === 'maybe' ? '#C8B89A'
                                          : '#DDD5C5';
                                    return (
                                      <td key={d.id} className="text-center py-1.5 px-2 font-mono" style={{ color }}>
                                        {symbol}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {event.status === 'open' && (
                        <button
                          onClick={() => updateStatus(event.id, 'closed')}
                          className="font-mono text-[10px] tracking-wider uppercase border border-[#8C7B6B] text-[#8C7B6B] px-3 py-1.5 hover:bg-[#8C7B6B] hover:text-white transition-colors"
                        >
                          Close voting
                        </button>
                      )}
                      {event.status === 'open' && (
                        <button
                          onClick={() => updateStatus(event.id, 'cancelled')}
                          className="font-mono text-[10px] tracking-wider uppercase border border-[#C87A7A] text-[#C87A7A] px-3 py-1.5 hover:bg-[#C87A7A] hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                      {(event.status === 'closed' || event.status === 'cancelled') && (
                        <button
                          onClick={() => updateStatus(event.id, 'open')}
                          className="font-mono text-[10px] tracking-wider uppercase border border-[#7AAFC4] text-[#7AAFC4] px-3 py-1.5 hover:bg-[#7AAFC4] hover:text-white transition-colors"
                        >
                          Reopen
                        </button>
                      )}
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="font-mono text-[10px] tracking-wider uppercase border border-red-400 text-red-400 px-3 py-1.5 hover:bg-red-400 hover:text-white transition-colors"
                      >
                        Delete
                      </button>
                    </div>

                    {/* Add date inline */}
                    <AddDateForm eventId={event.id} onAdd={addDate} />

                    {/* Remove dates */}
                    <div className="mt-3">
                      <p className="font-mono text-[9px] text-[#8C7B6B] uppercase tracking-wider mb-1">Dates</p>
                      {sortedDates.map((d) => (
                        <div key={d.id} className="flex items-center gap-2 text-[12px] text-[#2C2416] mb-1">
                          <span className="font-mono">{d.date}</span>
                          {d.start_time && <span className="text-[#8C7B6B] font-mono">{d.start_time?.slice(0, 5)}-{d.end_time?.slice(0, 5)}</span>}
                          <button
                            onClick={() => removeDate(event.id, d.id)}
                            className="text-[#C87A7A] hover:text-red-600 text-[10px] font-mono"
                          >
                            remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {events.length === 0 && (
            <p className="text-center text-[#8C7B6B] text-[14px] py-12">
              No events yet. Create one to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function AddDateForm({ eventId, onAdd }: { eventId: string; onAdd: (id: string, date: string, start: string, end: string) => void }) {
  const [date, setDate] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  function handleAdd() {
    if (!date) return;
    onAdd(eventId, date, start, end);
    setDate('');
    setStart('');
    setEnd('');
  }

  return (
    <div className="flex gap-2 mt-3 items-end">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="bg-[#F4EFE4] border border-[#DDD5C5] px-2 py-1.5 text-[12px] text-[#2C2416] rounded-sm outline-none focus:border-[#7AAFC4]"
      />
      <input
        type="time"
        value={start}
        onChange={(e) => setStart(e.target.value)}
        className="w-24 bg-[#F4EFE4] border border-[#DDD5C5] px-2 py-1.5 text-[12px] text-[#2C2416] rounded-sm outline-none focus:border-[#7AAFC4]"
      />
      <input
        type="time"
        value={end}
        onChange={(e) => setEnd(e.target.value)}
        className="w-24 bg-[#F4EFE4] border border-[#DDD5C5] px-2 py-1.5 text-[12px] text-[#2C2416] rounded-sm outline-none focus:border-[#7AAFC4]"
      />
      <button
        onClick={handleAdd}
        className="text-[#7AAFC4] font-mono text-[10px] tracking-wider uppercase border border-[#7AAFC4] px-3 py-1.5 hover:bg-[#7AAFC4] hover:text-white transition-colors"
      >
        + Add
      </button>
    </div>
  );
}
