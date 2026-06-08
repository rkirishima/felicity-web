import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname as _dirname, join as _join } from 'path';
config({ path: _join(_dirname(fileURLToPath(import.meta.url)), '.env') });
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Works both locally (SUPABASE_URL) and on Vercel (NEXT_PUBLIC_DOUG_SUPABASE_URL)
const _dougUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_DOUG_SUPABASE_URL;
const _dougKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY_DOUG;
const supabase = _dougUrl && _dougKey ? createClient(_dougUrl, _dougKey) : null;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Felicity main DB (reservations, orders — separate from Doug's Supabase)
const felicityDb = process.env.FELICITY_SUPABASE_URL
  ? createClient(process.env.FELICITY_SUPABASE_URL, process.env.FELICITY_SUPABASE_SERVICE_KEY)
  : null;

const CONTEXT_WINDOW = 20;      // most recent messages to include verbatim
const SUMMARY_THRESHOLD = 40;   // compress old messages into summary when thread exceeds this
const TOPIC_SUMMARY_AFTER = 3;  // generate searchable topic summary after this many messages
const TOPIC_REFRESH_EVERY = 8;  // refresh topic summary every N messages after that

// ── memory ────────────────────────────────────────────────────────────────────

async function loadMemory() {
  const files = ['SOUL.md', 'IDENTITY.md', 'MEMORY.md', 'CAPABILITIES.md'];
  const parts = await Promise.all(
    files.map(f => readFile(join(__dirname, 'memory', f), 'utf8').catch(() => ''))
  );
  return parts.filter(Boolean).join('\n\n---\n\n');
}

// ── thread history ─────────────────────────────────────────────────────────────

async function getThreadHistory(threadId) {
  const { data, error } = await supabase
    .from('doug_messages')
    .select('role, content')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .limit(CONTEXT_WINDOW);

  if (error) throw error;
  return (data || []).reverse();
}

// ── context summary ───────────────────────────────────────────────────────────

async function getThreadMeta(threadId) {
  const { data } = await supabase
    .from('doug_threads')
    .select('context_summary, project_id')
    .eq('id', threadId)
    .single();
  return data || {};
}

async function getProjectNotes(projectId) {
  if (!projectId) return null;
  const { data } = await supabase
    .from('doug_project_notes')
    .select('notes')
    .eq('project_id', projectId)
    .single();
  const notes = data?.notes?.trim();
  return notes || null;
}

async function getContextSummary(threadId) {
  const { data } = await supabase
    .from('doug_threads')
    .select('context_summary')
    .eq('id', threadId)
    .single();
  return data?.context_summary || null;
}

// Generates a short searchable topic summary after every few messages.
// Stored in doug_threads.topic_summary — separate from context_summary (which is for compression).
async function maybeUpdateTopicSummary(threadId) {
  try {
    const { count } = await supabase
      .from('doug_messages')
      .select('*', { count: 'exact', head: true })
      .eq('thread_id', threadId);

    if (!count || count < TOPIC_SUMMARY_AFTER) return;

    // Check if we need to regenerate
    const { data: thread } = await supabase
      .from('doug_threads')
      .select('topic_summary, topic_summary_at_count')
      .eq('id', threadId)
      .single();

    const lastCount = thread?.topic_summary_at_count || 0;
    const needsUpdate = !thread?.topic_summary || (count - lastCount) >= TOPIC_REFRESH_EVERY;
    if (!needsUpdate) return;

    // Fetch a sample of the thread (first 5 + last 5 messages)
    const { data: msgs } = await supabase
      .from('doug_messages')
      .select('role, content')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(20);

    if (!msgs?.length) return;

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Summarize this conversation in 2-3 sentences for a searchable index. Cover: what topic/project it's about, key decisions made, current status, anything built or shipped. Be specific — include project names, feature names, technical details. No fluff.\n\n${msgs.map(m => `${m.role.toUpperCase()}: ${m.content.slice(0, 300)}`).join('\n\n')}`,
      }],
    });

    const summary = response.content[0].text.trim();
    await supabase.from('doug_threads').update({
      topic_summary: summary,
      topic_summary_at_count: count,
    }).eq('id', threadId);
  } catch {
    // non-critical
  }
}

// Find threads related to the current message — used to surface forgotten context.
async function findRelatedThreads(message, excludeThreadId) {
  try {
    const keywords = message
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 6);

    if (!keywords.length) return [];

    // Search titles and topic summaries
    const conditions = keywords.map(k =>
      `title.ilike.%${k}%,topic_summary.ilike.%${k}%`
    ).join(',');

    const { data } = await supabase
      .from('doug_threads')
      .select('id, title, topic_summary, updated_at')
      .or(conditions)
      .neq('id', excludeThreadId)
      .not('topic_summary', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(3);

    return (data || []).map(t => ({
      id: t.id,
      title: t.title,
      summary: t.topic_summary,
      updated: new Date(t.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));
  } catch {
    return [];
  }
}

async function maybeGenerateSummary(threadId) {
  try {
    const { count } = await supabase
      .from('doug_messages')
      .select('*', { count: 'exact', head: true })
      .eq('thread_id', threadId);

    if (!count || count <= SUMMARY_THRESHOLD) return;

    const existing = await getContextSummary(threadId);
    if (existing) return;

    const { data: oldMsgs } = await supabase
      .from('doug_messages')
      .select('role, content')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(count - CONTEXT_WINDOW);

    if (!oldMsgs?.length) return;

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Summarize this conversation into a compact context block. Preserve key facts, decisions, topics covered, and important details. Be specific and concise.\n\n${oldMsgs.map(m => `${m.role.toUpperCase()}: ${m.content.slice(0, 500)}`).join('\n\n')}`,
      }],
    });

    const summary = response.content[0].text.trim();
    await supabase.from('doug_threads').update({ context_summary: summary }).eq('id', threadId);
  } catch {
    // non-critical
  }
}

// ── persist messages ──────────────────────────────────────────────────────────

async function saveMessage(threadId, role, content, imageUrl = null) {
  const row = { thread_id: threadId, role, content };
  if (imageUrl) row.image_url = imageUrl;

  const { error } = await supabase.from('doug_messages').insert(row);
  if (error) throw error;

  const now = new Date().toISOString();
  await supabase
    .from('doug_threads')
    .update({
      updated_at: now,
      last_message_at: now,
      last_message_preview: content.slice(0, 120).replace(/\n/g, ' '),
    })
    .eq('id', threadId);
}

// ── auto title ────────────────────────────────────────────────────────────────

async function autoTitle(threadId, firstMessage, firstReply) {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 15,
      messages: [{
        role: 'user',
        content: `Give this conversation a 2-5 word title. Specific, not generic. No quotes, no punctuation, no full stops.\n\nUser: ${firstMessage.slice(0, 200)}\nAssistant: ${firstReply.slice(0, 200)}`,
      }],
    });
    const title = response.content[0].text.trim().slice(0, 60);
    await supabase.from('doug_threads').update({ title }).eq('id', threadId);
  } catch {
    // non-critical
  }
}


// ── tool definitions ──────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'get_calendar_events',
    description: 'Fetch upcoming events from the user\'s Google Calendar. Use this when the user asks about their schedule, what\'s on today/tomorrow/this week, or any calendar-related question.',
    input_schema: {
      type: 'object',
      properties: {
        days_ahead: {
          type: 'number',
          description: 'How many days ahead to fetch events (default 7, max 30)',
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of events to return (default 10)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_stripe_summary',
    description: 'Get a revenue summary from Stripe. Shows total sales, number of orders, and top products for a given period.',
    input_schema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month'],
          description: 'The time period to summarise',
        },
      },
      required: ['period'],
    },
  },
  {
    name: 'get_news',
    description: 'Get current news headlines and stories. Use this for US politics, world news, MAGA/Trump news, or any current events. Also handles sports when asked about Ohtani or soccer/World Cup. Searches web and news sources for live stories.',
    input_schema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'What to search for, e.g. "Trump MAGA", "US politics today", "Ohtani", "World Cup", "Gaza", "US economy"',
        },
        category: {
          type: 'string',
          enum: ['politics', 'world', 'sports', 'business', 'technology', 'general'],
          description: 'News category filter (optional)',
        },
      },
      required: ['topic'],
    },
  },
  {
    name: 'get_square_summary',
    description: 'Get sales summary from Square POS at Felicity Cafe. Shows total sales, number of transactions, and breakdown by item for a given period.',
    input_schema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month'],
          description: 'The time period to summarise',
        },
      },
      required: ['period'],
    },
  },
  {
    name: 'get_weather',
    description: 'Get the current weather and forecast for a location.',
    input_schema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'City name or location, e.g. "Osaka, Japan"',
        },
        days: {
          type: 'number',
          description: 'Days of forecast (1-7, default 3)',
        },
      },
      required: ['location'],
    },
  },
  {
    name: 'list_reservations',
    description: 'List cafe reservations. Defaults to today if no date given.',
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD format. Defaults to today.' },
        status: { type: 'string', description: 'Filter by status: pending, confirmed, cancelled, completed' },
      },
    },
  },
  {
    name: 'update_reservation',
    description: 'Update a reservation status (confirm, cancel, or complete).',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Reservation UUID' },
        status: { type: 'string', enum: ['confirmed', 'cancelled', 'completed'], description: 'New status' },
      },
      required: ['id', 'status'],
    },
  },
];

// ── tool executors ────────────────────────────────────────────────────────────

async function executeTool(name, input, userId = 'doug') {
  switch (name) {
    case 'get_calendar_events':
      return await toolGetCalendarEvents(input, userId);
    case 'get_stripe_summary':
      return await toolGetStripeSummary(input);
    case 'get_square_summary':
      return await toolGetSquareSummary(input);
    case 'get_news':
      return await toolGetNews(input);
    case 'get_weather':
      return await toolGetWeather(input);
    case 'list_reservations':
      return await toolListReservations(input);
    case 'update_reservation':
      return await toolUpdateReservation(input);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

async function toolListReservations({ date, status }) {
  if (!felicityDb) return { error: 'Reservation database not configured.' };
  const d = date || new Date().toISOString().split('T')[0];
  let query = felicityDb.from('reservations').select('*').eq('date', d).order('time');
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) return { error: error.message };
  if (!data?.length) return { message: `No reservations for ${d}.`, date: d, reservations: [] };
  return {
    date: d,
    count: data.length,
    reservations: data.map(r => ({
      id: r.id.slice(0, 8),
      full_id: r.id,
      time: r.time,
      name: r.name,
      party_size: r.party_size,
      floor: r.floor_preference || null,
      contact: r.contact,
      notes: r.notes || null,
      status: r.status,
    })),
  };
}

async function toolUpdateReservation({ id, status }) {
  if (!felicityDb) return { error: 'Reservation database not configured.' };
  // Support both short (8-char) and full UUIDs
  let query = felicityDb.from('reservations').update({ status }).select().single();
  if (id.length <= 8) {
    query = felicityDb.from('reservations').select('*').ilike('id', `${id}%`).limit(1).single();
    const { data: found } = await query;
    if (!found) return { error: 'Reservation not found.' };
    const { data, error } = await felicityDb.from('reservations').update({ status }).eq('id', found.id).select().single();
    if (error) return { error: error.message };
    return { updated: true, name: data.name, date: data.date, time: data.time, status: data.status };
  }
  const { data, error } = await felicityDb.from('reservations').update({ status }).eq('id', id).select().single();
  if (error) return { error: error.message };
  if (!data) return { error: 'Reservation not found.' };
  return { updated: true, name: data.name, date: data.date, time: data.time, status: data.status };
}

async function toolGetCalendarEvents({ days_ahead = 7, max_results = 10 }) {
  try {
    const icalUrl = process.env.GOOGLE_CALENDAR_ICAL_URL;
    if (!icalUrl) return { error: 'Google Calendar not connected. Add GOOGLE_CALENDAR_ICAL_URL to env vars.' };

    const res = await fetch(icalUrl);
    if (!res.ok) return { error: `Failed to fetch calendar: ${res.status}` };

    const ical = await res.text();
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + Math.min(days_ahead, 30));

    // Parse VEVENT blocks
    const events = [];
    const eventBlocks = ical.split('BEGIN:VEVENT').slice(1);

    for (const block of eventBlocks) {
      const get = (key) => {
        const match = block.match(new RegExp(`${key}[^:]*:([^\r\n]+)`));
        return match ? match[1].trim() : null;
      };

      const summary = get('SUMMARY') || '(no title)';
      const dtstart = get('DTSTART');
      const dtend = get('DTEND');
      const location = get('LOCATION');
      const description = get('DESCRIPTION');

      if (!dtstart) continue;

      // Parse date — handles both datetime (20260412T090000Z) and date-only (20260412)
      const parseIcalDate = (s) => {
        if (!s) return null;
        if (s.length === 8) return new Date(`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`);
        return new Date(`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}T${s.slice(9,11)}:${s.slice(11,13)}:${s.slice(13,15)}Z`);
      };

      const startDate = parseIcalDate(dtstart);
      if (!startDate || startDate < now || startDate > end) continue;

      events.push({
        title: summary,
        start: startDate.toISOString(),
        end: dtend ? parseIcalDate(dtend)?.toISOString() : null,
        location: location || null,
        description: description ? description.slice(0, 200).replace(/\\n/g, ' ') : null,
      });
    }

    events.sort((a, b) => new Date(a.start) - new Date(b.start));
    const trimmed = events.slice(0, max_results);

    return { events: trimmed, count: trimmed.length, range_days: days_ahead };
  } catch (err) {
    return { error: err.message };
  }
}


async function toolGetStripeSummary({ period }) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) return { error: 'Stripe not configured.' };

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const now = new Date();
    let start, end;

    switch (period) {
      case 'today':
        start = new Date(now); start.setHours(0, 0, 0, 0);
        end = new Date(now); end.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        start = new Date(now); start.setDate(start.getDate() - 1); start.setHours(0, 0, 0, 0);
        end = new Date(now); end.setDate(end.getDate() - 1); end.setHours(23, 59, 59, 999);
        break;
      case 'this_week':
        start = new Date(now); start.setDate(start.getDate() - start.getDay()); start.setHours(0, 0, 0, 0);
        end = new Date(now);
        break;
      case 'last_week':
        start = new Date(now); start.setDate(start.getDate() - start.getDay() - 7); start.setHours(0, 0, 0, 0);
        end = new Date(now); end.setDate(end.getDate() - end.getDay() - 1); end.setHours(23, 59, 59, 999);
        break;
      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now);
        break;
      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      default:
        start = new Date(now); start.setHours(0, 0, 0, 0);
        end = new Date(now);
    }

    const charges = await stripe.charges.list({
      created: { gte: Math.floor(start.getTime() / 1000), lte: Math.floor(end.getTime() / 1000) },
      limit: 100,
    });

    const successful = charges.data.filter(c => c.status === 'succeeded');
    const total = successful.reduce((sum, c) => sum + c.amount, 0);
    const currency = successful[0]?.currency?.toUpperCase() || 'JPY';

    return {
      period,
      total_amount: total,
      currency,
      total_formatted: `${currency} ${(total / 100).toLocaleString()}`,
      order_count: successful.length,
      start: start.toISOString(),
      end: end.toISOString(),
    };
  } catch (err) {
    return { error: err.message };
  }
}

async function toolGetSquareSummary({ period }) {
  try {
    if (!process.env.SQUARE_ACCESS_TOKEN) return { error: 'Square not configured.' };

    const now = new Date();
    let start, end;

    switch (period) {
      case 'today':
        start = new Date(now); start.setHours(0, 0, 0, 0);
        end = new Date(now);
        break;
      case 'yesterday':
        start = new Date(now); start.setDate(start.getDate() - 1); start.setHours(0, 0, 0, 0);
        end = new Date(now); end.setDate(end.getDate() - 1); end.setHours(23, 59, 59, 999);
        break;
      case 'this_week':
        start = new Date(now); start.setDate(start.getDate() - start.getDay()); start.setHours(0, 0, 0, 0);
        end = new Date(now);
        break;
      case 'last_week':
        start = new Date(now); start.setDate(start.getDate() - start.getDay() - 7); start.setHours(0, 0, 0, 0);
        end = new Date(now); end.setDate(end.getDate() - end.getDay() - 1); end.setHours(23, 59, 59, 999);
        break;
      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now);
        break;
      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      default:
        start = new Date(now); start.setHours(0, 0, 0, 0);
        end = new Date(now);
    }

    const res = await fetch('https://connect.squareup.com/v2/orders/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-01-18',
      },
      body: JSON.stringify({
        location_ids: [process.env.SQUARE_LOCATION_ID],
        query: {
          filter: {
            date_time_filter: {
              created_at: {
                start_at: start.toISOString(),
                end_at: end.toISOString(),
              },
            },
            state_filter: { states: ['COMPLETED'] },
          },
        },
        limit: 500,
      }),
    });

    const json = await res.json();
    if (!res.ok) return { error: json.errors?.[0]?.detail || `Square API error ${res.status}` };

    const orders = json.orders || [];
    const total = orders.reduce((sum, o) => sum + (o.total_money?.amount || 0), 0);

    // Count items sold
    const itemCounts = {};
    for (const order of orders) {
      for (const item of order.line_items || []) {
        const name = item.name || 'Unknown';
        const qty = parseInt(item.quantity || '1', 10);
        itemCounts[name] = (itemCounts[name] || 0) + qty;
      }
    }
    const topItems = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, qty]) => ({ name, qty }));

    return {
      period,
      total_amount: total,
      currency: 'JPY',
      total_formatted: `¥${total.toLocaleString()}`,
      order_count: orders.length,
      top_items: topItems,
      start: start.toISOString(),
      end: end.toISOString(),
    };
  } catch (err) {
    return { error: err.message };
  }
}

async function toolGetNews({ topic, category }) {
  const results = [];
  const errors = [];

  // ── Tavily: web search for real-time stories ──────────────────────────────
  if (process.env.TAVILY_API_KEY) {
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: topic,
          search_depth: 'basic',
          include_answer: true,
          max_results: 5,
          topic: 'news',
        }),
      });
      const json = await res.json();
      if (json.results) {
        results.push(...json.results.map(r => ({
          source: 'web',
          title: r.title,
          url: r.url,
          snippet: r.content?.slice(0, 300),
          published: r.published_date || null,
        })));
      }
      if (json.answer) results.unshift({ source: 'summary', title: 'Summary', snippet: json.answer });
    } catch (err) {
      errors.push(`Tavily: ${err.message}`);
    }
  }

  // ── NewsAPI: structured headlines ─────────────────────────────────────────
  if (process.env.NEWS_API_KEY) {
    try {
      const q = encodeURIComponent(topic);
      const url = `https://newsapi.org/v2/everything?q=${q}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.articles) {
        results.push(...json.articles.map(a => ({
          source: a.source?.name || 'NewsAPI',
          title: a.title,
          url: a.url,
          snippet: a.description?.slice(0, 300),
          published: a.publishedAt,
        })));
      }
    } catch (err) {
      errors.push(`NewsAPI: ${err.message}`);
    }
  }

  if (results.length === 0 && errors.length > 0) {
    return { error: 'News search not configured. Add TAVILY_API_KEY and/or NEWS_API_KEY to env vars.' };
  }

  // Deduplicate by title
  const seen = new Set();
  const unique = results.filter(r => {
    if (seen.has(r.title)) return false;
    seen.add(r.title);
    return true;
  });

  return { topic, results: unique.slice(0, 8), errors: errors.length ? errors : undefined };
}

async function toolGetWeather({ location, days = 3 }) {
  try {
    if (!process.env.OPENWEATHER_API_KEY) {
      return { error: 'Weather not configured (missing OPENWEATHER_API_KEY).' };
    }

    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${process.env.OPENWEATHER_API_KEY}`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();
    if (!geoData.length) return { error: `Location not found: ${location}` };

    const { lat, lon } = geoData[0];
    const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&cnt=${days * 8}&units=metric&appid=${process.env.OPENWEATHER_API_KEY}`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    const daily = {};
    for (const item of weatherData.list || []) {
      const date = item.dt_txt.split(' ')[0];
      if (!daily[date]) daily[date] = { temps: [], conditions: [] };
      daily[date].temps.push(item.main.temp);
      daily[date].conditions.push(item.weather[0].description);
    }

    const forecast = Object.entries(daily).slice(0, days).map(([date, d]) => ({
      date,
      min_temp: Math.round(Math.min(...d.temps)),
      max_temp: Math.round(Math.max(...d.temps)),
      condition: d.conditions[0],
    }));

    return { location, forecast };
  } catch (err) {
    return { error: err.message };
  }
}

// ── core: streaming ask with tool use ─────────────────────────────────────────

async function* streamAskDoug(threadId, userMessage, model = 'claude-haiku-4-5-20251001', imageUrl = null, options = {}) {
  const { userId = 'doug', extraTools = [], extraExecutors = {} } = options;
  const [systemPrompt, history, threadMeta] = await Promise.all([
    loadMemory(),
    getThreadHistory(threadId),
    getThreadMeta(threadId),
  ]);

  const { context_summary: contextSummary, project_id: projectId } = threadMeta;
  const projectNotes = await getProjectNotes(projectId);

  await saveMessage(threadId, 'user', userMessage, imageUrl);

  const isFirstMessage = history.length === 0 && !contextSummary;

  // On the first message, find related threads and surface them to Doug
  let relatedThreads = [];
  if (isFirstMessage) {
    relatedThreads = await findRelatedThreads(userMessage, threadId);
  }

  const system = [
    {
      type: 'text',
      text: systemPrompt + '\n\n---\n\nYou have access to the cafe reservation system. When Rowly asks about reservations, use your tools to look them up. You can list, confirm, or cancel reservations. Show data clearly — use the short ID (first 8 chars) when referencing reservations.',
      cache_control: { type: 'ephemeral' },
    },
    ...(projectNotes ? [{
      type: 'text',
      text: `Project context (${projectId}):\n${projectNotes}`,
    }] : []),
    ...(contextSummary ? [{
      type: 'text',
      text: `Earlier conversation summary:\n${contextSummary}`,
    }] : []),
    ...(relatedThreads.length > 0 ? [{
      type: 'text',
      text: `Related past threads (mention these if relevant — Rowly forgets things):\n${relatedThreads.map(t => `- "${t.title}" (${t.updated}): ${t.summary}`).join('\n')}`,
    }] : []),
  ];

  const userContent = [
    ...(imageUrl ? [{ type: 'image', source: { type: 'url', url: imageUrl } }] : []),
    { type: 'text', text: userMessage || ' ' },
  ];

  // Build the conversation — we'll extend this as tools are called
  const messages = [
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userContent },
  ];

  let fullReply = '';

  // Agentic loop — keep going until stop_reason is 'end_turn' (no more tool calls)
  while (true) {
    let stopReason = null;
    let toolUseBlocks = [];
    let currentTextBlock = '';

    const allTools = [...TOOLS, ...extraTools];

    const stream = anthropic.messages.stream({
      model,
      max_tokens: 2048,
      system,
      tools: allTools,
      messages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        currentTextBlock += event.delta.text;
        fullReply += event.delta.text;
        yield event.delta.text;
      }

      if (event.type === 'content_block_stop') {
        // nothing needed here — we collect below
      }

      if (event.type === 'message_delta') {
        stopReason = event.delta.stop_reason;
      }
    }

    // Get the final message to extract tool_use blocks
    const finalMsg = await stream.finalMessage();
    toolUseBlocks = finalMsg.content.filter(b => b.type === 'tool_use');

    if (stopReason !== 'tool_use' || toolUseBlocks.length === 0) {
      // Done — no more tool calls
      break;
    }

    // Add assistant's response (including tool_use blocks) to messages
    messages.push({ role: 'assistant', content: finalMsg.content });

    // Execute tools sequentially so we can yield status messages
    const toolResults = [];
    for (const toolBlock of toolUseBlocks) {
      const statusMsg = `\n\n*Using ${toolBlock.name.replace(/_/g, ' ')}...*\n\n`;
      fullReply += statusMsg;
      yield statusMsg;

      const result = toolBlock.name in extraExecutors
        ? await extraExecutors[toolBlock.name](toolBlock.input)
        : await executeTool(toolBlock.name, toolBlock.input, userId);

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolBlock.id,
        content: JSON.stringify(result),
      });
    }

    // Add tool results to messages for next iteration
    messages.push({ role: 'user', content: toolResults });
  }

  // Save final reply
  await saveMessage(threadId, 'assistant', fullReply);

  if (isFirstMessage) autoTitle(threadId, userMessage, fullReply).catch(() => {});
  maybeGenerateSummary(threadId).catch(() => {});
  maybeUpdateTopicSummary(threadId).catch(() => {});
}

// ── non-streaming wrapper ─────────────────────────────────────────────────────

async function askDoug(threadId, userMessage, model = 'claude-haiku-4-5-20251001', options = {}) {
  let fullReply = '';
  for await (const chunk of streamAskDoug(threadId, userMessage, model, null, options)) {
    fullReply += chunk;
  }
  return fullReply;
}

// ── morning briefing (called by Vercel Cron) ─────────────────────────────────

async function fetchFelicityEventsContext() {
  // Pull upcoming events from the main Felicity Supabase (separate from
  // Doug's own DB) so the briefing can call them out without needing tools.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return '';

  try {
    const client = createClient(url, key);
    const todayStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date());
    const horizon = new Date(Date.now() + 31 * 86_400_000);
    const horizonStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(horizon);

    const { data: events, error } = await client
      .from('events')
      .select('title, confirmed_date, max_attendees, event_dates(date, start_time, end_time, yes_count)')
      .eq('event_type', 'one_off')
      .in('status', ['confirmed', 'open'])
      .gte('confirmed_date', todayStr)
      .lte('confirmed_date', horizonStr)
      .order('confirmed_date');

    if (error || !events || events.length === 0) {
      return '\n\nUpcoming Felicity cafe events (next 31 days): none scheduled.';
    }

    const lines = events.map(e => {
      const sameDay = (e.event_dates || []).filter(d => d.date === e.confirmed_date);
      const slots = sameDay
        .map(d => `${(d.start_time || '').slice(0, 5)}–${(d.end_time || '').slice(0, 5)} (参加${d.yes_count}${e.max_attendees ? `/${e.max_attendees}` : ''})`)
        .join(', ');
      return `- ${e.confirmed_date}: ${e.title}${slots ? ' — ' + slots : ''}`;
    });
    return '\n\nUpcoming Felicity cafe events (next 31 days):\n' + lines.join('\n');
  } catch (err) {
    console.error('Failed to fetch Felicity events for briefing:', err.message);
    return '';
  }
}

async function morningBriefing(userId = 'doug') {
  // Find or create a dedicated "Daily Briefing" thread
  let { data: thread } = await supabase
    .from('doug_threads')
    .select('id')
    .eq('title', '📅 Daily Briefing')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!thread) {
    const { data: newThread } = await supabase
      .from('doug_threads')
      .insert({ title: '📅 Daily Briefing', user_id: userId })
      .select('id')
      .single();
    thread = newThread;
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'Asia/Tokyo' });
  const isMondayJST = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tokyo', weekday: 'short' }).format(new Date()) === 'Mon';
  const eventsContext = await fetchFelicityEventsContext();

  const prompt = `Good morning. It's ${today} in Japan. Give me my morning briefing:

1. Check my Google Calendar — what's on today and tomorrow?
2. Get the latest US politics news (Trump/MAGA/Washington). What's the biggest story right now?
3. Any major world news I should know about?
4. Weather in Hayama, Kanagawa today.
5. Felicity cafe events: if something is happening today or tomorrow, lead with it (time, attendance, what's needed). ${isMondayJST ? "It's Monday — also summarise the upcoming month's events at the end of the briefing." : "Otherwise just mention the next upcoming event briefly so I keep it on my radar."}${eventsContext}

Be direct and concise. No fluff. If there's something genuinely crazy happening in US politics, lead with that — unless a cafe event is today or tomorrow, in which case lead with the event.`;

  return await askDoug(thread.id, prompt, 'claude-haiku-4-5-20251001', { userId });
}

export { askDoug, streamAskDoug, morningBriefing, supabase };
