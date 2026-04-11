import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_DOUG_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY_DOUG
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'missing projectId' }, { status: 400 });

  const { data } = await supabase
    .from('doug_project_notes')
    .select('notes, updated_at')
    .eq('project_id', projectId)
    .single();

  return NextResponse.json({ notes: data?.notes ?? '', updated_at: data?.updated_at ?? null });
}

export async function PATCH(request) {
  const { projectId, notes } = await request.json();
  if (!projectId) return NextResponse.json({ error: 'missing projectId' }, { status: 400 });

  const { data, error } = await supabase
    .from('doug_project_notes')
    .upsert({ project_id: projectId, notes: notes ?? '', updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
