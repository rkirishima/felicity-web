import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

const ALLOWED = ['SOUL', 'IDENTITY', 'MEMORY', 'HEARTBEAT'];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');
  if (!ALLOWED.includes(file)) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  try {
    const content = await readFile(
      join(process.cwd(), 'doug', 'memory', `${file}.md`),
      'utf8'
    );
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: 'read error' }, { status: 500 });
  }
}
