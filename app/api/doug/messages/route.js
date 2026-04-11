import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL_DOUG || process.env.NEXT_PUBLIC_DOUG_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY_DOUG || process.env.SUPABASE_SERVICE_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get('threadId');
  if (!threadId) return NextResponse.json({ error: 'missing threadId' }, { status: 400 });

  const { data, error } = await supabase
    .from('doug_messages')
    .select('id, role, content, image_url, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
