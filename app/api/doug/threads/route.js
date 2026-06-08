import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const _url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL_DOUG || process.env.NEXT_PUBLIC_DOUG_SUPABASE_URL || '';
const _key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY_DOUG || process.env.SUPABASE_SERVICE_KEY || '';
const supabase = _url && _key ? createClient(_url, _key) : null;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const project = searchParams.get('project');
  const search = searchParams.get('search');
  const archived = searchParams.get('archived') === 'true';

  let query = supabase
    .from('doug_threads')
    .select('*')
    .or(archived ? 'archived.eq.true' : 'archived.eq.false,archived.is.null')
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false });

  if (project) query = query.eq('project_id', project);
  if (search) query = query.ilike('title', `%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const { title, model, project_id } = await request.json();
  const { data, error } = await supabase
    .from('doug_threads')
    .insert({ title, model_used: model, project_id: project_id || null, cost_usd: 0 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });

  const updates = await request.json();
  const allowed = ['title', 'pinned', 'status', 'archived', 'project_id'];
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k))
  );

  const { data, error } = await supabase
    .from('doug_threads')
    .update(filtered)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });

  const { error } = await supabase.from('doug_threads').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
