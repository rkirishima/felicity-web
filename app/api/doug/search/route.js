import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const _url = process.env.SUPABASE_URL_DOUG || process.env.NEXT_PUBLIC_DOUG_SUPABASE_URL || '';
const _key = process.env.SUPABASE_SERVICE_KEY_DOUG || process.env.SUPABASE_SERVICE_KEY || '';
const supabase = _url && _key ? createClient(_url, _key) : null;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  if (!q || q.length < 2) return NextResponse.json({ threads: [], messages: [] });

  const [{ data: threads }, { data: messages }] = await Promise.all([
    supabase
      .from('doug_threads')
      .select('id, title, project_id, updated_at, status, pinned')
      .ilike('title', `%${q}%`)
      .eq('archived', false)
      .order('updated_at', { ascending: false })
      .limit(8),
    supabase
      .from('doug_messages')
      .select('id, thread_id, content, role, created_at')
      .ilike('content', `%${q}%`)
      .order('created_at', { ascending: false })
      .limit(12),
  ]);

  // Fetch thread info for message results
  const threadIds = [...new Set((messages || []).map(m => m.thread_id))];
  let msgThreads = [];
  if (threadIds.length > 0) {
    const { data } = await supabase
      .from('doug_threads')
      .select('id, title, project_id')
      .in('id', threadIds)
      .eq('archived', false);
    msgThreads = data || [];
  }

  return NextResponse.json({
    threads: threads || [],
    messages: (messages || []).map(m => ({
      ...m,
      thread: msgThreads.find(t => t.id === m.thread_id) || null,
    })).filter(m => m.thread),
  });
}
