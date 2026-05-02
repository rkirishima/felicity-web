import { NextResponse } from 'next/server';
import { askDoug } from '../../../../../doug/server.js';

const MODEL_MAP = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-5-20251001',
};

export async function POST(request) {
  const { threadId, message, model } = await request.json();
  const resolvedModel = MODEL_MAP[model] ?? MODEL_MAP.haiku;
  try {
    const reply = await askDoug(threadId, message, resolvedModel);
    return NextResponse.json({ reply });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
