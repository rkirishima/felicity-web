/**
 * Local tools — only run on the Mac mini (telegram.js / local agent).
 * Never imported by Vercel routes.
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile, appendFile, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const HOME = process.env.HOME || '/Users/doug';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── tool definitions (passed to Claude) ──────────────────────────────────────

export const LOCAL_TOOLS = [
  {
    name: 'run_shell',
    description: 'Run a shell command on the Mac mini. Use for: running scripts, checking system state, git operations, npm commands, opening apps, controlling the Mac. Output is capped at 3000 chars.',
    input_schema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'The shell command to run' },
        cwd: { type: 'string', description: 'Working directory (default: ~/Projects/felicity-web)' },
        timeout_seconds: { type: 'number', description: 'Timeout in seconds (default 30, max 120)' },
      },
      required: ['command'],
    },
  },
  {
    name: 'read_file',
    description: 'Read a file from the Mac mini filesystem.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute or home-relative path (~/... supported)' },
        max_lines: { type: 'number', description: 'Max lines to return (default 200)' },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write or append to a file on the Mac mini.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute or home-relative path' },
        content: { type: 'string', description: 'Content to write' },
        append: { type: 'boolean', description: 'If true, append instead of overwrite (default false)' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'list_files',
    description: 'List files in a directory on the Mac mini.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path (~/... supported)' },
      },
      required: ['path'],
    },
  },
  {
    name: 'browse_web',
    description: 'Browse a URL using headless Chrome (Playwright). Can get page text, take a screenshot, or click elements. Use for research, reading articles, checking websites.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to open' },
        action: {
          type: 'string',
          enum: ['get_text', 'get_title', 'screenshot'],
          description: 'What to do on the page (default: get_text)',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'parallel_agents',
    description: 'Spawn up to 4 Claude Code sub-agents IN PARALLEL for programming tasks. Use this for any non-trivial build — decompose into independent workstreams (e.g. schema, API, frontend, tests) and run them simultaneously. Each agent has full tool access and inherits all env vars. Returns results from all agents when they all finish.',
    input_schema: {
      type: 'object',
      properties: {
        agents: {
          type: 'array',
          description: 'Up to 4 agents to run in parallel',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Short label for this agent, e.g. "schema", "api", "frontend"' },
              task: { type: 'string', description: 'Detailed task description for this agent' },
              cwd: { type: 'string', description: 'Working directory (default: ~/Projects/felicity-web)' },
            },
            required: ['name', 'task'],
          },
        },
        model: {
          type: 'string',
          enum: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6'],
          description: 'Model for all agents (default: sonnet)',
        },
      },
      required: ['agents'],
    },
  },
  {
    name: 'sub_agent',
    description: 'Spawn a focused Claude Code sub-agent to handle a task autonomously. The sub-agent has full tool access (Bash, Read, Write, Edit, etc.) and can actually build code, write files, run commands, and complete multi-step tasks. Returns the full result when done.',
    input_schema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'Detailed description of what the sub-agent should do and return' },
        model: {
          type: 'string',
          enum: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6'],
          description: 'Model to use — haiku for fast/simple, sonnet for complex reasoning (default: sonnet)',
        },
        cwd: { type: 'string', description: 'Working directory for the sub-agent (default: ~/Projects/felicity-web)' },
      },
      required: ['task'],
    },
  },
  {
    name: 'query_supabase',
    description: 'Run a SQL query against a Supabase database. Use this to check staff attendance, orders, customers, any data. Available databases: "staff" (timeclock_records, schedule_requests), "felicity" (orders, products, customers).',
    input_schema: {
      type: 'object',
      properties: {
        database: {
          type: 'string',
          enum: ['staff', 'felicity'],
          description: 'Which Supabase project to query',
        },
        sql: {
          type: 'string',
          description: 'SQL SELECT query to run (read-only)',
        },
      },
      required: ['database', 'sql'],
    },
  },
  {
    name: 'search_threads',
    description: 'Search past conversation threads by topic, project name, or keyword. Use this when Rowly asks about something he might have discussed before, or when starting work on something that may have prior context. Returns matching threads with summaries.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What to search for, e.g. "Square sync", "subscription", "label printer"' },
        limit: { type: 'number', description: 'Max results (default 5)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'check_staff_attendance',
    description: 'Check staff clock-in/clock-out records. Use this to find who is currently clocked in, who forgot to clock out, or get an attendance summary for a date.',
    input_schema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date to check in YYYY-MM-DD format (default: today)',
        },
        check_type: {
          type: 'string',
          enum: ['unclosed', 'summary', 'all'],
          description: '"unclosed" = staff who clocked in but not out, "summary" = full day summary, "all" = all records',
        },
      },
      required: [],
    },
  },
  {
    name: 'fix_staff_clockout',
    description: 'Manually set a clock-out time for a staff member who forgot to clock out.',
    input_schema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'Staff user ID' },
        clock_out: { type: 'string', description: 'Clock-out time in ISO 8601 format, e.g. 2026-04-11T18:00:00+09:00' },
        date: { type: 'string', description: 'Date in YYYY-MM-DD format (default: today)' },
      },
      required: ['user_id', 'clock_out'],
    },
  },
  {
    name: 'check_vercel',
    description: 'Check Vercel deployment status, recent deployments, or runtime logs for any project.',
    input_schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list_deployments', 'deployment_status', 'logs'],
          description: 'What to check',
        },
        project: {
          type: 'string',
          description: 'Project name e.g. "felicity-web", "felicity-staff" (optional)',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'open_app',
    description: 'Open an application or URL on the Mac mini using macOS.',
    input_schema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'App name (e.g. "Figma", "Slack") or URL to open in Chrome' },
      },
      required: ['target'],
    },
  },
];

// ── tool executors ────────────────────────────────────────────────────────────

export const LOCAL_EXECUTORS = {
  search_threads: toolSearchThreads,
  run_shell: toolRunShell,
  read_file: toolReadFile,
  write_file: toolWriteFile,
  list_files: toolListFiles,
  browse_web: toolBrowseWeb,
  parallel_agents: (input) => toolParallelAgents(input),
  sub_agent: (input) => toolSubAgent(input),
  open_app: toolOpenApp,
  query_supabase: toolQuerySupabase,
  check_staff_attendance: toolCheckStaffAttendance,
  fix_staff_clockout: toolFixStaffClockout,
  check_vercel: toolCheckVercel,
};

// Factory that binds streaming callbacks — used by Telegram for live progress
export function createLocalExecutors({ onChunk, onDone } = {}) {
  return {
    ...LOCAL_EXECUTORS,
    parallel_agents: (input) => toolParallelAgents(input, { onChunk, onDone }),
    sub_agent: (input) => toolSubAgent(input, { onChunk, onDone }),
  };
}

async function toolSearchThreads({ query, limit = 5 }) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseKey) return { error: 'Supabase not configured' };

    const { createClient } = await import('@supabase/supabase-js');
    const db = createClient(supabaseUrl, supabaseKey);

    const keywords = query.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 2).slice(0, 6);
    if (!keywords.length) return { results: [] };

    const conditions = keywords.map(k => `title.ilike.%${k}%,topic_summary.ilike.%${k}%`).join(',');

    const { data, error } = await db
      .from('doug_threads')
      .select('id, title, topic_summary, updated_at, source')
      .or(conditions)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) return { error: error.message };

    return {
      query,
      results: (data || []).map(t => ({
        id: t.id,
        title: t.title,
        summary: t.topic_summary || '(no summary yet)',
        updated: new Date(t.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        source: t.source,
      })),
    };
  } catch (err) {
    return { error: err.message };
  }
}

function getSupabaseClient(database) {
  if (database === 'staff') {
    const url = process.env.STAFF_SUPABASE_URL;
    const key = process.env.STAFF_SUPABASE_SERVICE_KEY;
    if (!url || !key) return { error: 'Staff Supabase not configured. Add STAFF_SUPABASE_URL and STAFF_SUPABASE_SERVICE_KEY to doug/.env' };
    return { client: createClient(url, key) };
  }
  // felicity / default
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return { error: 'Felicity Supabase not configured.' };
  return { client: createClient(url, key) };
}

async function toolQuerySupabase({ database, sql }) {
  const conn = getSupabaseClient(database);
  if (conn.error) return conn;
  try {
    const { data, error } = await conn.client.rpc('exec_sql', { query: sql }).single();
    if (error) {
      // Fallback: try direct table query if exec_sql not available
      return { error: `SQL exec failed: ${error.message}. Use check_staff_attendance for attendance queries.` };
    }
    return { data };
  } catch (err) {
    return { error: err.message };
  }
}

async function toolCheckStaffAttendance({ date, check_type = 'unclosed' }) {
  const conn = getSupabaseClient('staff');
  if (conn.error) return conn;

  // date range for today JST (UTC+9)
  const jstDate = date || new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
  const dayStart = new Date(`${jstDate}T00:00:00+09:00`).toISOString();
  const dayEnd   = new Date(`${jstDate}T23:59:59+09:00`).toISOString();

  try {
    // Fetch timeclock records + staff names in one go
    const { data, error } = await conn.client
      .from('timeclock')
      .select('id, staff_id, clock_in, clock_out, break_minutes, staff(name)')
      .gte('clock_in', dayStart)
      .lte('clock_in', dayEnd)
      .order('clock_in', { ascending: true });

    if (error) throw error;
    const records = data || [];

    if (check_type === 'unclosed') {
      const unclosed = records.filter(r => r.clock_in && !r.clock_out);
      return {
        date: jstDate,
        unclosed_count: unclosed.length,
        unclosed: unclosed.map(r => ({
          staff_id: r.staff_id,
          name: r.staff?.name || r.staff_id,
          clocked_in_at: new Date(r.clock_in).toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' }),
        })),
      };
    }

    return {
      date: jstDate,
      total_staff: records.length,
      clocked_out: records.filter(r => r.clock_out).length,
      still_in: records.filter(r => r.clock_in && !r.clock_out).length,
      records: records.map(r => ({
        name: r.staff?.name || r.staff_id,
        staff_id: r.staff_id,
        in: new Date(r.clock_in).toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' }),
        out: r.clock_out
          ? new Date(r.clock_out).toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' })
          : '(not clocked out)',
      })),
    };
  } catch (err) {
    return { error: err.message };
  }
}

async function toolFixStaffClockout({ user_id, clock_out, date }) {
  const conn = getSupabaseClient('staff');
  if (conn.error) return conn;

  const jstDate = date || new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
  const dayStart = new Date(`${jstDate}T00:00:00+09:00`).toISOString();
  const dayEnd   = new Date(`${jstDate}T23:59:59+09:00`).toISOString();

  try {
    // Find the record
    const { data: record, error: findErr } = await conn.client
      .from('timeclock')
      .select('id, staff(name)')
      .eq('staff_id', user_id)
      .gte('clock_in', dayStart)
      .lte('clock_in', dayEnd)
      .single();

    if (findErr) throw findErr;

    // Update clock_out
    const { data, error } = await conn.client
      .from('timeclock')
      .update({ clock_out })
      .eq('id', record.id)
      .select('clock_in, clock_out, staff(name)')
      .single();

    if (error) throw error;
    return {
      success: true,
      staff_name: data.staff?.name,
      clock_in: data.clock_in,
      clock_out: data.clock_out,
    };
  } catch (err) {
    return { error: err.message };
  }
}

async function toolCheckVercel({ action, project }) {
  try {
    const projectFlag = project ? `--scope team_pmQANvtLD5KHsJVnM4IDRL7Q` : '';

    if (action === 'list_deployments') {
      const cmd = project
        ? `vercel ls ${project} --token $VERCEL_TOKEN 2>/dev/null | head -20`
        : `vercel ls --token $VERCEL_TOKEN 2>/dev/null | head -20`;
      const { stdout } = await execAsync(cmd, { env: { ...process.env, PATH: `/usr/local/bin:/opt/homebrew/bin:${process.env.PATH}` } });
      return { deployments: stdout };
    }

    if (action === 'logs') {
      const cmd = `vercel logs ${project || 'felicity-web'} --token $VERCEL_TOKEN 2>/dev/null | head -50`;
      const { stdout } = await execAsync(cmd, { env: { ...process.env, PATH: `/usr/local/bin:/opt/homebrew/bin:${process.env.PATH}` } });
      return { logs: stdout };
    }

    return { error: `Unknown action: ${action}` };
  } catch (err) {
    return { error: err.message };
  }
}

async function toolRunShell({ command, cwd, timeout_seconds = 30 }) {
  const workDir = cwd
    ? cwd.replace(/^~/, HOME)
    : join(HOME, 'Projects/felicity-web');

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: workDir,
      timeout: Math.min(timeout_seconds, 120) * 1000,
      env: { ...process.env, PATH: `/usr/local/bin:/opt/homebrew/bin:${process.env.PATH}` },
    });
    return {
      stdout: stdout.slice(0, 3000) || '(no output)',
      stderr: stderr.slice(0, 500) || null,
      exit_code: 0,
    };
  } catch (err) {
    return {
      stdout: err.stdout?.slice(0, 3000) || '',
      stderr: (err.stderr || err.message).slice(0, 1000),
      exit_code: err.code || 1,
    };
  }
}

async function toolReadFile({ path: filePath, max_lines = 200 }) {
  try {
    const resolved = filePath.replace(/^~/, HOME);
    const content = await readFile(resolved, 'utf8');
    const lines = content.split('\n');
    const truncated = lines.slice(0, max_lines).join('\n');
    return {
      content: truncated,
      total_lines: lines.length,
      shown_lines: Math.min(max_lines, lines.length),
    };
  } catch (err) {
    return { error: err.message };
  }
}

async function toolWriteFile({ path: filePath, content, append = false }) {
  try {
    const resolved = filePath.replace(/^~/, HOME);
    if (append) {
      await appendFile(resolved, content, 'utf8');
    } else {
      await writeFile(resolved, content, 'utf8');
    }
    return { success: true, path: resolved, bytes: content.length };
  } catch (err) {
    return { error: err.message };
  }
}

async function toolListFiles({ path: dirPath }) {
  try {
    const resolved = dirPath.replace(/^~/, HOME);
    const entries = await readdir(resolved, { withFileTypes: true });
    return {
      path: resolved,
      entries: entries.slice(0, 100).map(e => ({
        name: e.name,
        type: e.isDirectory() ? 'dir' : 'file',
      })),
      total: entries.length,
    };
  } catch (err) {
    return { error: err.message };
  }
}

async function toolBrowseWeb({ url, action = 'get_text' }) {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

    let result;
    if (action === 'get_text') {
      const text = await page.evaluate(() => document.body.innerText);
      result = { url: page.url(), text: text.slice(0, 6000) };
    } else if (action === 'get_title') {
      result = { title: await page.title(), url: page.url() };
    } else if (action === 'screenshot') {
      const buf = await page.screenshot({ type: 'jpeg', quality: 70, fullPage: false });
      result = { screenshot_base64: buf.toString('base64') };
    }

    await browser.close();
    return result;
  } catch (err) {
    if (err.message.includes('Cannot find module') || err.message.includes('playwright')) {
      return { error: 'Playwright not installed. Run: cd ~/Projects/felicity-web/doug && npm install playwright && npx playwright install chromium' };
    }
    return { error: err.message };
  }
}

async function toolParallelAgents({ agents, model = 'claude-sonnet-4-6' }, { onChunk, onDone } = {}) {
  const capped = (agents || []).slice(0, 4);
  if (capped.length === 0) return { error: 'No agents specified' };

  // Per-agent onChunk prefixes output with agent name
  const makeAgentChunk = (name) => onChunk
    ? async (chunk) => onChunk(`[${name}] ${chunk}`)
    : undefined;

  // Track done count — call onDone once all finish
  let doneCount = 0;
  const makeAgentDone = (name, success) => {
    doneCount++;
    if (doneCount === capped.length && onDone) {
      onDone(success, `All ${capped.length} agents finished`).catch(() => {});
    }
  };

  const promises = capped.map(agent =>
    toolSubAgent(
      { task: agent.task, model, cwd: agent.cwd },
      { onChunk: makeAgentChunk(agent.name), onDone: async (ok) => makeAgentDone(agent.name, ok) },
    ).then(result => ({ name: agent.name, ...result }))
     .catch(err => ({ name: agent.name, error: err.message }))
  );

  const results = await Promise.all(promises);
  return { agents: results };
}

async function toolSubAgent({ task, model = 'claude-sonnet-4-6', cwd: taskCwd }, { onChunk, onDone } = {}) {
  const CLAUDE = '/Users/doug/.local/bin/claude';
  const workDir = taskCwd ? taskCwd.replace(/^~/, HOME) : join(HOME, 'Projects/felicity-web');

  // Prepend project context so sub-agents don't ask about credentials or structure
  let context = '';
  try {
    context = await readFile(join(__dirname, 'memory', 'SUBAGENT_CONTEXT.md'), 'utf8');
  } catch {}
  const fullTask = context ? `${context}\n\n---\n\n## Task\n\n${task}` : task;

  return new Promise((resolve) => {
    const proc = spawn(CLAUDE, [
      '--dangerously-skip-permissions',
      '--print',
      '--model', model,
    ], {
      cwd: workDir,
      env: { ...process.env, PATH: `/usr/local/bin:/opt/homebrew/bin:${process.env.PATH}` },
    });

    proc.stdin.write(fullTask);
    proc.stdin.end();

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', d => {
      const chunk = d.toString();
      stdout += chunk;
      if (onChunk) onChunk(chunk).catch(() => {});
    });
    proc.stderr.on('data', d => { stderr += d.toString(); });

    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      if (onDone) onDone(false, stdout).catch(() => {});
      resolve({ error: 'Sub-agent timed out (5 min)' });
    }, 300_000);

    proc.on('close', code => {
      clearTimeout(timer);
      if (onDone) onDone(code === 0, stdout).catch(() => {});
      if (code !== 0 && !stdout.trim()) {
        resolve({ error: stderr.slice(0, 1000) || `Exit code ${code}` });
      } else {
        resolve({ result: stdout.slice(0, 8000), exit_code: code });
      }
    });

    proc.on('error', err => {
      clearTimeout(timer);
      if (onDone) onDone(false, stdout).catch(() => {});
      resolve({ error: err.message });
    });
  });
}

async function toolOpenApp({ target }) {
  try {
    // If it looks like a URL, open in Chrome
    if (target.startsWith('http://') || target.startsWith('https://')) {
      await execAsync(`open -a "Google Chrome" "${target}"`);
      return { success: true, action: `Opened ${target} in Chrome` };
    }
    // Otherwise open as app
    await execAsync(`open -a "${target}"`);
    return { success: true, action: `Opened ${target}` };
  } catch (err) {
    // Fallback: try open without -a
    try {
      await execAsync(`open "${target}"`);
      return { success: true, action: `Opened ${target}` };
    } catch (e) {
      return { error: e.message };
    }
  }
}
