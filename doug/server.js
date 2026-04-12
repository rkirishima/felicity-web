import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname as _dirname, join as _join } from 'path';
config({ path: _join(_dirname(fileURLToPath(import.meta.url)), '.env') });
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Felicity main DB (reservations, orders — separate from Doug's Supabase)
const felicityDb = process.env.FELICITY_SUPABASE_URL
  ? createClient(process.env.FELICITY_SUPABASE_URL, process.env.FELICITY_SUPABASE_SERVICE_KEY)
  : null;

const CONTEXT_WINDOW = 20;      // most recent messages to include verbatim
const SUMMARY_THRESHOLD = 40;   // generate summary when thread exceeds this many messages

// ── memory ────────────────────────────────────────────────────────────────────

async function loadMemory() {
  const files = ['SOUL.md', 'IDENTITY.md', 'MEMORY.md'];
  const parts = await Promise.all(
    files.map(f => readFile(join(__dirname, 'memory', f), 'utf8'))
  );
  return parts.join('\n\n---\n\n');
}

// ── thread history ────────────────────────────────────────────────────────────

// Returns the most recent CONTEXT_WINDOW messages, in chronological order.
// Bug fix: was previously returning the FIRST N messages on long threads.
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

// Generates and stores a summary of the older portion of a long thread.
// Fire-and-forget — runs after the reply is sent.
async function maybeGenerateSummary(threadId) {
  try {
    const { count } = await supabase
      .from('doug_messages')
      .select('*', { count: 'exact', head: true })
      .eq('thread_id', threadId);

    if (!count || count <= SUMMARY_THRESHOLD) return;

    // Skip if we already have one
    const existing = await getContextSummary(threadId);
    if (existing) return;

    // Fetch all but the most recent CONTEXT_WINDOW messages
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

// ── reservation tools ────────────────────────────────────────────────────────

const RESERVATION_TOOLS = [
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

async function executeReservationTool(name, input) {
  if (!felicityDb) return 'Reservation database not configured.';

  if (name === 'list_reservations') {
    const date = input.date || new Date().toISOString().split('T')[0];
    let query = felicityDb.from('reservations').select('*').eq('date', date).order('time');
    if (input.status) query = query.eq('status', input.status);
    const { data, error } = await query;
    if (error) return `Error: ${error.message}`;
    if (!data?.length) return `No reservations for ${date}.`;
    return data.map(r =>
      `[${r.status.toUpperCase()}] ${r.time} — ${r.name} (${r.party_size}名)${r.floor_preference ? ` ${r.floor_preference}` : ''} | ${r.contact}${r.notes ? ` | ${r.notes}` : ''} | ID: ${r.id.slice(0, 8)}`
    ).join('\n');
  }

  if (name === 'update_reservation') {
    const { data, error } = await felicityDb
      .from('reservations')
      .update({ status: input.status })
      .eq('id', input.id)
      .select()
      .single();
    if (error) return `Error: ${error.message}`;
    if (!data) return `Reservation not found.`;
    return `Updated: ${data.name} ${data.date} ${data.time} → ${data.status}`;
  }

  return 'Unknown tool.';
}

// ── core: streaming ask ───────────────────────────────────────────────────────

async function* streamAskDoug(threadId, userMessage, model = 'claude-haiku-4-5-20251001', imageUrl = null) {
  const [systemPrompt, history, threadMeta] = await Promise.all([
    loadMemory(),
    getThreadHistory(threadId),
    getThreadMeta(threadId),
  ]);

  const { context_summary: contextSummary, project_id: projectId } = threadMeta;
  const projectNotes = await getProjectNotes(projectId);

  await saveMessage(threadId, 'user', userMessage, imageUrl);

  const isFirstMessage = history.length === 0 && !contextSummary;

  // System blocks (in order):
  // 1. Base memory — cached, same every call
  // 2. Project notes — uncached, specific to this project
  // 3. Thread summary — uncached, specific to this thread
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
  ];

  // Build user content — image block first if present, then text
  const userContent = [
    ...(imageUrl ? [{ type: 'image', source: { type: 'url', url: imageUrl } }] : []),
    { type: 'text', text: userMessage || ' ' },
  ];

  let currentMessages = [
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userContent },
  ];

  // Tool use loop — stream text, handle tool calls, continue
  let fullReply = '';
  let done = false;

  while (!done) {
    const streamOpts = { model, max_tokens: 1024, system, messages: currentMessages };
    if (felicityDb) streamOpts.tools = RESERVATION_TOOLS;

    let currentText = '';
    let toolUseBlock = null;
    let stopReason = '';

    const stream = anthropic.messages.stream(streamOpts);

    for await (const event of stream) {
      if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
        toolUseBlock = { id: event.content_block.id, name: event.content_block.name, input: '' };
      } else if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          currentText += event.delta.text;
          fullReply += event.delta.text;
          yield event.delta.text;
        } else if (event.delta.type === 'input_json_delta' && toolUseBlock) {
          toolUseBlock.input += event.delta.partial_json;
        }
      } else if (event.type === 'message_delta') {
        stopReason = event.delta.stop_reason || '';
      }
    }

    if (stopReason === 'tool_use' && toolUseBlock) {
      const input = JSON.parse(toolUseBlock.input);
      const result = await executeReservationTool(toolUseBlock.name, input);

      // Build assistant content for tool call turn
      const assistantContent = [];
      if (currentText) assistantContent.push({ type: 'text', text: currentText });
      assistantContent.push({ type: 'tool_use', id: toolUseBlock.id, name: toolUseBlock.name, input });

      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: assistantContent },
        { role: 'user', content: [{ type: 'tool_result', tool_use_id: toolUseBlock.id, content: result }] },
      ];
      // Loop continues — Claude will respond with natural language
    } else {
      done = true;
    }
  }

  // Save assistant reply — must complete before [DONE] reaches the client
  await saveMessage(threadId, 'assistant', fullReply);

  // Non-critical post-send work
  if (isFirstMessage) autoTitle(threadId, userMessage, fullReply).catch(() => {});
  maybeGenerateSummary(threadId).catch(() => {});
}

// ── non-streaming wrapper (used by Telegram bot) ──────────────────────────────

async function askDoug(threadId, userMessage, model = 'claude-haiku-4-5-20251001') {
  let fullReply = '';
  for await (const chunk of streamAskDoug(threadId, userMessage, model)) {
    fullReply += chunk;
  }
  return fullReply;
}

export { askDoug, streamAskDoug, supabase };
