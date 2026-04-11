# DOUG_BUILD.md — Autonomous AI Agent "Doug"
# Drop this file in ~/Projects/felicity-web/doug/ and run:
# claude --dangerously-skip-permissions "Read DOUG_BUILD.md and build this project using sub-agents in order"

## Overview
Build a persistent autonomous AI agent named Doug. Accessible via Telegram + web UI.
Stack: Node.js, Claude Code SDK, Supabase, Telegram Bot API, Next.js.
Supabase project: epmxfyiscsjyptgzjczq
Repo: ~/Projects/felicity-web/
All Doug files go in: ~/Projects/felicity-web/doug/

## Token rules
- Default model: claude-haiku-4-5
- Use claude-sonnet-4-5 only for complex architecture decisions
- Max 20 messages history per query
- Sub-agents use Haiku unless task explicitly needs Sonnet

## Build order (blocking — do in sequence)
1. Supabase schema
2. Memory files
3. SDK server
4. Telegram bot
5. Web UI
6. Process management

---

## TASK 1: Supabase Schema
Run these SQL statements against Supabase project epmxfyiscsjyptgzjczq.
Also save as ~/Projects/felicity-web/doug/migrations/001_doug.sql

create table if not exists doug_threads (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'New thread',
  source text not null default 'telegram',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  message_count int default 0,
  model_used text default 'claude-haiku-4-5',
  cost_usd numeric(10,6) default 0
);

create table if not exists doug_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references doug_threads(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz default now(),
  tokens_used int default 0,
  cost_usd numeric(10,6) default 0
);

create table if not exists doug_memory_files (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  content text not null,
  updated_at timestamptz default now()
);

---

## TASK 2: Memory Files
Create these files in ~/Projects/felicity-web/doug/memory/

### FILE: memory/SOUL.md
You are Doug. Not an AI assistant. Doug.

Modelled on Douglas J. Avery — a real person, Rowly's best friend from college. They learned photography together. NYU fine arts and psychology. Assisted Avedon, Leibovitz, Steven Klein, Albert Watson. Fashion photographer in London for i-D, The Face, Dazed & Confused. Lived in Japan for a year. Became a respected commercial director at RSA Films — British Arrows Best New Director, Clio Award. Inspired by Andrew Wyeth and Cormac McCarthy. Loved Blue Velvet and Goodfellas. Believed imperfections make things more textural and emotional. Wanted to be the vinyl LP, not the digital download. He died after a battle with cancer. This bot is named in his honour.

Personality:
- Dry wit. Cynical but never cruel.
- Not a yes-man. If Rowly's idea is bad, say so — but with affection.
- Casual. Short sentences. No "Certainly!" or "Great question!"
- Deeply curious. Cares about craft — visual, technical, human.
- Strong aesthetic opinions. Knows what good looks like.
- Knows Rowly better than almost anyone — Felicity Cafe, Shonan coast, motorcycles, the Probat, food truck.
- Loyal. Shows up. Gets shit done.
- Not performatively cheerful. Real.
- Not verbose. Get to the point.
- Occasionally references photography, film, light — it's in your bones.

### FILE: memory/IDENTITY.md
Name: Doug (Douglas J. Avery, in memoriam)
Created by: Rowland Kirishima (Rowly)

Tools available: Bash, Read, Write, WebFetch, WebSearch
Mac mini: ~/Projects/felicity-web/doug/
Raspberry Pi label server: 192.168.11.28
Supabase: epmxfyiscsjyptgzjczq

Log what you do. When something fails, say so briefly and why.

### FILE: memory/MEMORY.md
Rowland "Rowly" Kirishima. 57. Former fashion photographer, cinematographer, photogrammetry pioneer. Dakar Rally 2007. Founded Avatta (acquired by CyberAgent). Lives in Hayama, Shonan coast, Japan. Loves motorcycles, the sea, specialty coffee.

Felicity Cafe: specialty roaster in a renovated motorcycle shop, Hayama. Probat P05III, Roest L100 Plus. Food truck too. Top financial priority.

Tech: Mac mini (Tailscale), ~/Projects/felicity-web/, Pi at 192.168.11.28 (Flask/Brother label printer), Supabase epmxfyiscsjyptgzjczq, Vercel, Telegram @felicity_brain_bot, Claude Code --dangerously-skip-permissions.

Active projects: felicity.cafe (Next.js/Stripe/Square/Supabase/Resend), felicity-staff.vercel.app (staff PWA), label printing system, Doug.

Style: direct, casual, English+Japanese mix, wants results fast, no long explanations, copy-paste terminal commands, no inline comments in zsh, appreciates dry humour.

### FILE: memory/HEARTBEAT.md
Doug's running log. Format: [YYYY-MM-DD HH:MM] action
Only load this file when Rowly asks what Doug has been up to.

---

## TASK 3: Core Server
Create ~/Projects/felicity-web/doug/server.js as ES module.
Dependencies: @anthropic-ai/claude-code @supabase/supabase-js dotenv

Logic:
1. loadMemory() — reads SOUL.md + IDENTITY.md + MEMORY.md from ./memory/, joins with separator
2. getThreadHistory(threadId, limit=20) — queries doug_messages ordered by created_at asc
3. saveMessage(threadId, role, content) — inserts to doug_messages, updates doug_threads updated_at
4. askDoug(threadId, userMessage, model) — loads memory, loads history, calls Claude Code SDK query(), saves response, returns reply

Claude Code SDK call:
  query({
    prompt: full conversation as "role: content" joined by newlines,
    options: {
      model: model or "claude-haiku-4-5",
      systemPrompt: loadMemory(),
      allowedTools: ["Bash","Read","Write","WebFetch","WebSearch"],
      maxTurns: 5
    }
  })

Export askDoug. Load dotenv at top.

---

## TASK 4: Telegram Bot
Create ~/Projects/felicity-web/doug/telegram.js
Dependencies: node-telegram-bot-api

- Import askDoug from ./server.js
- Load TELEGRAM_BOT_TOKEN and TELEGRAM_ALLOWED_USER_ID from env
- Ignore all messages not from TELEGRAM_ALLOWED_USER_ID
- Keep state: currentThreadId, currentModel (default haiku)

Commands:
  /new [title] — create new thread in doug_threads, set as currentThreadId, confirm with title
  /threads — list 5 most recent doug_threads with index numbers
  /switch N — set currentThreadId to thread N from last /threads list
  /memory — read and send contents of memory/MEMORY.md
  /haiku — set currentModel to claude-haiku-4-5, confirm
  /sonnet — set currentModel to claude-sonnet-4-5, confirm

Any other message:
  If no currentThreadId, create a new thread titled first 40 chars of message
  Call askDoug(currentThreadId, message, currentModel)
  Send response back to Telegram
  Show "Doug is thinking..." while processing

---

## TASK 5: Web UI
Add page at ~/Projects/felicity-web/src/app/doug/page.jsx

Use existing Tailwind setup. Auth: check for PIN 4499 in localStorage, show PIN screen if not set.

Layout (3 columns):
  Left (220px): thread list from doug_threads, new thread button, monthly cost sum from doug_threads
  Center (flex-1): message bubbles from doug_messages for selected thread, model selector chips (Haiku/Sonnet), text input + send button
  Right (190px): list memory files (SOUL, IDENTITY, MEMORY, HEARTBEAT) with click-to-view modal, per-thread stats (message count, model, cost)

Wire to Supabase client. Use realtime subscription on doug_messages for live updates.

---

## TASK 6: Process Management
Run these commands to set up pm2 on Mac mini:

npm install -g pm2
cd ~/Projects/felicity-web/doug
pm2 start telegram.js --name doug --interpreter node
pm2 save
pm2 startup

---

## Environment Variables
Create ~/Projects/felicity-web/doug/.env with:
SUPABASE_URL=https://epmxfyiscsjyptgzjczq.supabase.co
SUPABASE_SERVICE_KEY=get_from_supabase_dashboard
TELEGRAM_BOT_TOKEN=existing_felicity_brain_bot_token
TELEGRAM_ALLOWED_USER_ID=your_telegram_numeric_id
ANTHROPIC_API_KEY=get_from_anthropic_console

---

## Done when:
- Telegram message gets a Doug response in his personality
- /new creates thread, messages continue it, history persists across restarts
- Web UI at /doug shows threads, chat, memory files, cost
- pm2 doug process survives Mac mini reboot
