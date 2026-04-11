import { streamAskDoug } from '../../../../doug/server.js';

const MODEL_MAP = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-5-20251001',
};

export async function POST(request) {
  const { threadId, message, model } = await request.json();
  const resolvedModel = MODEL_MAP[model] ?? MODEL_MAP.haiku;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamAskDoug(threadId, message, resolvedModel)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (err) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
