/**
 * Doug proactive cron jobs — runs on the Mac mini via PM2 cron_restart.
 * Checks staff attendance, sends Telegram alerts without being asked.
 */

import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { createClient } from '@supabase/supabase-js';

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
const chatId = process.env.TELEGRAM_ALLOWED_USER_ID;

async function notify(message) {
  try {
    await bot.sendMessage(chatId, message);
  } catch (err) {
    console.error('[cron] Telegram send failed:', err.message);
  }
}

// ── staff attendance check ────────────────────────────────────────────────────
// Runs at end of business day. Alerts if anyone didn't clock out.

async function checkStaffAttendance() {
  const url = process.env.STAFF_SUPABASE_URL;
  const key = process.env.STAFF_SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    console.log('[cron] Staff Supabase not configured, skipping attendance check.');
    return;
  }

  const supabase = createClient(url, key);
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
  const dayStart = new Date(`${today}T00:00:00+09:00`).toISOString();
  const dayEnd   = new Date(`${today}T23:59:59+09:00`).toISOString();

  const { data, error } = await supabase
    .from('timeclock')
    .select('staff_id, clock_in, clock_out, staff(name)')
    .gte('clock_in', dayStart)
    .lte('clock_in', dayEnd);

  if (error) {
    console.error('[cron] Attendance check failed:', error.message);
    return;
  }

  const records = data || [];
  const unclosed = records.filter(r => r.clock_in && !r.clock_out);

  if (unclosed.length === 0) {
    console.log(`[cron] ${today} attendance OK — all staff clocked out.`);
    return;
  }

  const names = unclosed.map(r => `• ${r.staff?.name || r.staff_id} (出勤: ${new Date(r.clock_in).toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' })})`).join('\n');
  const msg = `⚠️ 退勤忘れ (${today})\n\n${names}\n\n退勤時間を修正するには「[名前]の退勤を[時間]にして」と送ってください。`;

  await notify(msg);
  console.log(`[cron] Alerted: ${unclosed.length} staff unclosed.`);
}

// ── run the job specified by JOB env var ─────────────────────────────────────

const job = process.env.CRON_JOB;

switch (job) {
  case 'staff_attendance':
    checkStaffAttendance().then(() => process.exit(0)).catch(err => {
      console.error('[cron] Error:', err.message);
      process.exit(1);
    });
    break;

  default:
    console.error(`[cron] Unknown job: ${job}. Set CRON_JOB env var.`);
    process.exit(1);
}
