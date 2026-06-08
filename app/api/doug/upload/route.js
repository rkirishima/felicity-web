import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 30;

const _url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_DOUG_SUPABASE_URL || '';
const _key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY_DOUG || '';
const supabase = _url && _key ? createClient(_url, _key) : null;

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get('file');
  const threadId = formData.get('threadId');

  if (!file || !threadId) {
    return NextResponse.json({ error: 'missing file or threadId' }, { status: 400 });
  }

  // Ensure bucket exists (no-op if already created)
  await supabase.storage.createBucket('doug-images', { public: true }).catch(() => {});

  const bytes = await file.arrayBuffer();
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${threadId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('doug-images')
    .upload(path, Buffer.from(bytes), {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage
    .from('doug-images')
    .getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
