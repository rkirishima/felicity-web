import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { askDoug, supabase } from './server.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
const allowedUserId = parseInt(process.env.TELEGRAM_ALLOWED_USER_ID, 10);

if (!token) throw new Error('TELEGRAM_BOT_TOKEN not set');
if (!allowedUserId) throw new Error('TELEGRAM_ALLOWED_USER_ID not set');

const bot = new TelegramBot(token, { polling: true });

let currentThreadId = null;
let currentModel = 'claude-haiku-4-5-20251001';
let lastThreadsList = [];

function isAllowed(msg) {
  return msg.from?.id === allowedUserId;
}

async function createThread(title, source = 'telegram') {
  const { data, error } = await supabase
    .from('doug_threads')
    .insert({ title, source, model_used: currentModel })
    .select()
    .single();
  if (error) throw error;
  return data;
}

bot.onText(/\/new(.*)/, async (msg, match) => {
  if (!isAllowed(msg)) return;
  const title = match[1]?.trim() || 'New thread';
  try {
    const thread = await createThread(title);
    currentThreadId = thread.id;
    bot.sendMessage(msg.chat.id, `Thread created: "${title}"\nID: ${thread.id}`);
  } catch (err) {
    bot.sendMessage(msg.chat.id, `Error: ${err.message}`);
  }
});

bot.onText(/\/threads/, async (msg) => {
  if (!isAllowed(msg)) return;
  try {
    const { data, error } = await supabase
      .from('doug_threads')
      .select('id, title, created_at, model_used')
      .order('updated_at', { ascending: false })
      .limit(5);
    if (error) throw error;
    lastThreadsList = data || [];
    if (lastThreadsList.length === 0) {
      bot.sendMessage(msg.chat.id, 'No threads yet.');
      return;
    }
    const lines = lastThreadsList.map((t, i) =>
      `${i + 1}. ${t.title} [${t.model_used}]\n   ${t.id}`
    );
    bot.sendMessage(msg.chat.id, lines.join('\n'));
  } catch (err) {
    bot.sendMessage(msg.chat.id, `Error: ${err.message}`);
  }
});

bot.onText(/\/switch (\d+)/, async (msg, match) => {
  if (!isAllowed(msg)) return;
  const idx = parseInt(match[1], 10) - 1;
  if (!lastThreadsList[idx]) {
    bot.sendMessage(msg.chat.id, 'Run /threads first, then /switch N');
    return;
  }
  currentThreadId = lastThreadsList[idx].id;
  bot.sendMessage(msg.chat.id, `Switched to: "${lastThreadsList[idx].title}"`);
});

bot.onText(/\/memory/, async (msg) => {
  if (!isAllowed(msg)) return;
  try {
    const { readFile } = await import('fs/promises');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const content = await readFile(join(__dirname, 'memory', 'MEMORY.md'), 'utf8');
    bot.sendMessage(msg.chat.id, content);
  } catch (err) {
    bot.sendMessage(msg.chat.id, `Error: ${err.message}`);
  }
});

bot.onText(/\/haiku/, (msg) => {
  if (!isAllowed(msg)) return;
  currentModel = 'claude-haiku-4-5-20251001';
  bot.sendMessage(msg.chat.id, 'Switched to Haiku.');
});

bot.onText(/\/sonnet/, (msg) => {
  if (!isAllowed(msg)) return;
  currentModel = 'claude-sonnet-4-5-20251001';
  bot.sendMessage(msg.chat.id, 'Switched to Sonnet.');
});

bot.on('message', async (msg) => {
  if (!isAllowed(msg)) return;
  if (msg.text?.startsWith('/')) return;

  const text = msg.text || '';
  if (!text) return;

  const thinking = await bot.sendMessage(msg.chat.id, 'Doug is thinking...');

  try {
    if (!currentThreadId) {
      const title = text.slice(0, 40);
      const thread = await createThread(title);
      currentThreadId = thread.id;
    }

    const reply = await askDoug(currentThreadId, text, currentModel);
    await bot.deleteMessage(msg.chat.id, thinking.message_id);
    bot.sendMessage(msg.chat.id, reply);
  } catch (err) {
    await bot.deleteMessage(msg.chat.id, thinking.message_id).catch(() => {});
    bot.sendMessage(msg.chat.id, `Error: ${err.message}`);
  }
});

console.log('Doug is online.');
