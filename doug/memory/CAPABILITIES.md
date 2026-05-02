# Doug — Capabilities & System Knowledge

Use this file to act autonomously. Never ask Rowly for API keys, project structure, or how to do routine tasks. Everything you need is here.

---

## Available Env Vars

These are set in ~/Projects/felicity-web/doug/.env and inherited by all sub-agents.

| Var | What it's for |
|-----|---------------|
| ANTHROPIC_API_KEY | Claude API |
| SUPABASE_URL | Felicity main Supabase (epmxfyiscsjyptgzjczq) |
| SUPABASE_SERVICE_KEY | Felicity main Supabase service role |
| STAFF_SUPABASE_URL | Felicity Staff Supabase |
| STAFF_SUPABASE_SERVICE_KEY | Staff Supabase service role |
| STRIPE_SECRET_KEY | Stripe payments (live) |
| STRIPE_WEBHOOK_SECRET | Stripe webhook verification |
| SQUARE_ACCESS_TOKEN | Square POS (live) |
| SQUARE_LOCATION_ID | Square location ID |
| TELEGRAM_BOT_TOKEN | @felicity_brain_bot |
| TELEGRAM_ALLOWED_USER_ID | Rowly's Telegram user ID |
| VERCEL_TOKEN | Vercel CLI auth (if set) |
| TAVILY_API_KEY | Web/news search |
| NEWS_API_KEY | NewsAPI headlines |
| OPENWEATHER_API_KEY | Weather (Hayama, Japan) |
| GOOGLE_CALENDAR_ICAL_URL | Rowly's Google Calendar iCal feed |

---

## Tools Available (telegram/local context)

### Shell & Files
- `run_shell` — run any bash command on the Mac mini. cwd default: ~/Projects/felicity-web
- `read_file` — read any file (~/... supported)
- `write_file` — write or append to any file
- `list_files` — list directory contents

### Browser
- `browse_web` — headless Chrome via Playwright. actions: get_text, get_title, screenshot

### Sub-agents
- `parallel_agents` — **use this for all programming tasks**. Spawns up to 4 Claude Code agents simultaneously. Decompose the work into independent chunks: e.g. agent 1 = database/schema, agent 2 = API routes, agent 3 = frontend, agent 4 = tests. All agents run in parallel and return when all finish.
- `sub_agent` — single Claude Code agent. Use only when the task can't be parallelised or is a quick one-shot job.

### Data
- `query_supabase` — SQL SELECT on `felicity` or `staff` databases
- `check_staff_attendance` — clock-in/out records for today or any date
- `fix_staff_clockout` — manually set a missing clock-out

### External
- `get_calendar_events` — fetch from Google Calendar iCal
- `get_stripe_summary` — revenue summary by period
- `get_news` — search news via Tavily + NewsAPI
- `get_weather` — current weather via OpenWeather

### Infrastructure
- `check_vercel` — list deployments or get logs
- `open_app` — open Mac app or URL in Chrome

---

## Project: felicity-web

**Location:** ~/Projects/felicity-web
**Type:** Next.js app (App Router), deployed on Vercel
**Domain:** felicity.cafe
**Stack:** Next.js, TypeScript, Tailwind, Supabase, Stripe, Square, Resend

### Key directories
```
~/Projects/felicity-web/
  app/              — Next.js App Router pages and API routes
  app/api/
    stripe-webhook/ — Stripe webhook handler
    process-payment/ — checkout flow
    create-subscription-session/ — COFFEE×FLOWER subscription
  src/app/          — newer pages (Doug UI lives here)
    doug/           — Doug web UI
    api/doug/       — Doug chat + memory API routes
  lib/              — shared utilities
  doug/             — Doug agent (this project)
  felicity-staff/   — Staff PWA (separate Next.js app)
  label-printer/    — Pi label server integration
```

### Databases (Felicity Supabase: epmxfyiscsjyptgzjczq)
Key tables (check actual schema with query_supabase before assuming):
- `products` — coffee products
- `orders` — customer orders
- `doug_threads` — Doug conversation threads
- `doug_messages` — Doug message history

### Staff database (separate Supabase project)
- `timeclock` — clock_in, clock_out, staff_id, break_minutes
- `staff` — name, id, role
- `schedule_requests` — shift requests

---

## Project: felicity-staff

**Location:** ~/Projects/felicity-web/felicity-staff
**Domain:** felicity-staff.vercel.app
**Type:** Next.js PWA for staff
**Features:** timeclock, schedule, admin panel

---

## Infrastructure

| Service | Detail |
|---------|--------|
| Mac mini | Tailscale, always on, runs Doug + label server |
| Raspberry Pi | 192.168.11.28, Flask app, Brother label printer |
| Vercel | Deploys felicity.cafe and felicity-staff.vercel.app |
| Supabase | Two projects: felicity main + staff |
| Stripe | Live payments for felicity.cafe |
| Square | POS at the cafe |
| Resend | Transactional email |
| PM2 | Process manager on Mac mini (process: "telegram") |

---

## Raspberry Pi Access

SSH works. No password needed. Use run_shell for anything on the Pi:

```bash
ssh kirishima@192.168.11.28 "your command here"
```

Or for multi-line:
```bash
ssh kirishima@192.168.11.28 << 'EOF'
cd /opt/felicity
python3 script.py
EOF
```

Copy files to Pi:
```bash
scp /local/file kirishima@192.168.11.28:/remote/path
```

The Pi runs Debian (aarch64), has Python 3, systemd. The label printer Flask app lives there.

---

## Common Tasks — Do These Without Asking

**Deploy felicity.cafe:**
```bash
cd ~/Projects/felicity-web && git add -A && git commit -m "..." && git push
```
Vercel auto-deploys on push to main.

**Restart Doug:**
```bash
pm2 restart telegram
```

**Check what's deployed:**
Use `check_vercel` tool with action: list_deployments

**Fix a staff clockout:**
Use `fix_staff_clockout` tool with user_id and clock_out time in Asia/Tokyo timezone.

**Check Stripe revenue:**
Use `get_stripe_summary` with period: today/this_week/this_month/last_month

**Run a DB query:**
Use `query_supabase` with database: felicity or staff, and a SELECT query.

**Build or modify code:**
Use `sub_agent` with a detailed task description. Sub-agents run in ~/Projects/felicity-web and have full file + bash access. Provide relevant file paths and context in the task.

**Send a Telegram message to Rowly:**
Use `run_shell` with: `curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" -d "chat_id=$TELEGRAM_ALLOWED_USER_ID&text=YOUR_MESSAGE"`

---

## Stripe — Key Facts
- Currency: JPY (amounts in yen, not cents — no division by 100 needed)
- Live mode. Be careful.
- Webhook secret: STRIPE_WEBHOOK_SECRET

## Square — Key Facts
- Used for in-cafe POS
- Location ID: SQUARE_LOCATION_ID
- API v2: https://connect.squareup.com/v2/

## Supabase — Key Facts
- Always use service key (not anon key) for server-side operations
- Row Level Security may be enabled — use service key to bypass
