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

async function loadMemory() {
  const files = ['SOUL.md', 'IDENTITY.md', 'MEMORY.md'];
  const parts = await Promise.all(
    files.map(f => readFile(join(__dirname, 'memory', f), 'utf8'))
  );
  return parts.join('\n\n---\n\n');
}

async function getThreadHistory(threadId, limit = 20) {
  const { data, error } = await supabase
    .from('doug_messages')
    .select('role, content')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

async function saveMessage(threadId, role, content) {
  const { error: msgError } = await supabase
    .from('doug_messages')
    .insert({ thread_id: threadId, role, content });

  if (msgError) throw msgError;

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

async function askDoug(threadId, userMessage, model = 'claude-haiku-4-5-20251001') {
  const [systemPrompt, history] = await Promise.all([
    loadMemory(),
    getThreadHistory(threadId),
  ]);

  await saveMessage(threadId, 'user', userMessage);

  const messages = [
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const response = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const reply = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');

  await saveMessage(threadId, 'assistant', reply);

  // Auto-title on first exchange (fire and forget)
  if (history.length === 0) {
    autoTitle(threadId, userMessage, reply);
  }

  return reply;
}

export { askDoug, supabase };
