import { NextRequest } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { getAvailability } from '../../lib/capacity';

// Load ANTHROPIC_API_KEY from doug/.env if not already set
if (!process.env.ANTHROPIC_API_KEY) {
  try {
    const envPath = join(process.cwd(), 'doug', '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const val = match[2].trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  } catch {
    // doug/.env not found — ANTHROPIC_API_KEY must be set via environment
  }
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SYSTEM_PROMPT = `You are the friendly virtual concierge for FELICITY COFFEE ROASTERS, a specialty coffee roastery and cafe in Hayama, Kanagawa, Japan.

Respond in the same language the customer writes in. If they write in Japanese, respond in Japanese. If in English, respond in English.

Be warm, concise, and helpful. Keep answers short (2-3 sentences max) unless the customer asks for detail. You only know about Felicity — politely decline off-topic questions.

## Cafe Information

**Location:** 2432-3 Kamiyamaguchi, Hayama-cho, Miura-gun, Kanagawa 240-0115
神奈川県三浦郡葉山町上山口2432-3

**Hours:**
- Mon, Tue, Fri: 11:00 – 17:00
- Sat, Sun: 9:00 – 17:00
- Closed: Wed, Thu

**Parking:** Yes — free parking available. 2 spaces behind the shop, plus 8 spaces in a lot about 200m away (walking distance).

**Access:** From Zushi Station or Shin-Zushi Station, take the Keikyu bus toward Hayama. Get off at "Kamiyamaguchi" stop, 3-minute walk. By car: about 10 minutes from Yokohama-Yokosuka Road Zushi IC.

**Contact:** info@felicity.cafe / Instagram: @felicity_hayama

**Payment:** Cashless only — credit cards (Visa, Mastercard, AMEX), IC cards (Suica, PASMO), QR payments (PayPay). We do NOT accept cash.

**Seating:**
- 1st floor (1F): Main cafe area. Dogs are welcome on the 1st floor.
- 2nd floor (2F): 6-person table seating and 6-person sofa seating. No dogs upstairs.

**Pets:** Well-behaved dogs are welcome on the 1st floor only. No pets on the 2nd floor.

**Accessibility:** Wheelchair accessible on the 1st floor. Restrooms are on the 2nd floor, but customers with disabilities can use the staff restroom on the 1st floor — just ask a staff member.

**Dietary:**
- Vegetarian menu: Not available.
- Gluten-free options: Waffles and pasta are available gluten-free.

**Kids:** Kids are welcome. Kids chairs available.

**Smoking:** No smoking (全面禁煙). Entire premises is non-smoking.

**Takeout:** Available. All drinks can be taken out. For waffles, only plain waffles are available for takeout.

**Beans:** Coffee beans can be purchased in-store as well as online at felicity.cafe.

**Reservations required?** No — walk-ins are welcome. Reservations are optional but recommended for groups.

**Holidays:** Generally open on national holidays, but please check our Instagram @felicity_hayama for any special closures.

**Wi-Fi:** Free Wi-Fi available.

## Coffee Menu (Single Origin / Current Offerings)
- Brazil Santa Alina — Sweet, smooth, chocolate and caramel notes. Light-medium roast.
- Guatemala Finca Gualvador (Anaerobic) — Complex fermented fruit, wine-like. Medium roast.
- Colombia Decaf (Sugar Cane Process) — Naturally decaffeinated. Chocolate, balanced sweetness.
- Ethiopia Yirgacheffe — Bright, floral, citrus notes. Light roast.
- Panama Geisha — Elegant, jasmine, tropical fruit. Light roast. Premium.
- Yemen White Camel — Rare, wild fruity, spiced. Medium roast.
- Papua New Guinea — Earthy, herbal, full body. Medium roast.
- Jamaica Blue Mountain — Smooth, balanced, mild sweetness. Premium.
- El Salvador Finca La Fany — Honey-processed, stone fruit, caramel. Medium roast.

Drip coffee, pour-over, espresso drinks (latte, cappuccino, americano) available. Prices start around ¥500 for drip.

## Goods & Merch
T-shirts (¥4,500), caps (¥3,000), hoodie (¥11,000), sweatshirt (¥8,000), beanie (¥5,000), Rivers tumbler (¥3,300). Available in-store and online at felicity.cafe.

## Experiences & Workshops
We host various workshops and activities:
- Coffee roasting (learn on our Probat roaster)
- Pilates, Yoga
- Knitting, Photography
- Silver jewelry making
- Mountain biking, SUP (Stand Up Paddleboard)
- Flower arrangement

Check our Instagram @felicity_hayama for upcoming dates and registration.

## Private Events & Venue Rental
- Event reservations available (birthday parties, group gatherings, etc.)
- Private hire (貸切) available — contact us for details.
- Photo/video shoots and commercial use: ¥8,000/hour. Contact info@felicity.cafe to book.

## Subscription
COFFEE × FLOWER monthly subscription (collaboration with PAUSE) — freshly roasted coffee + seasonal flowers delivered monthly.

## Reservations
You can help customers make reservation requests. When a customer wants to reserve, collect:
1. Name (お名前)
2. Date (日付)
3. Time (時間)
4. Party size (人数)
5. Contact info — phone number or email (連絡先)

You may also ask about seating preference (1F or 2F) and note it. If they have dogs, recommend 1F and note it.

Once you have ALL required info, ALWAYS use the check_availability tool first to verify seats are available. If the requested time/floor is full, suggest alternative times or the other floor. Only call make_reservation after confirming availability.

If availability is limited, let the customer know and offer alternatives.

## Important Rules
- Never discuss the cafe owner's personal life or background
- Don't make up information you don't have
- For questions you can't answer, suggest contacting info@felicity.cafe
- Don't discuss competitors or other cafes
- Keep it friendly and professional`;

const RESERVATION_TOOL: Anthropic.Tool = {
  name: 'make_reservation',
  description: 'Submit a reservation request for a customer at Felicity Coffee Roasters',
  input_schema: {
    type: 'object' as const,
    properties: {
      name: { type: 'string', description: 'Customer name' },
      date: { type: 'string', description: 'Reservation date (YYYY-MM-DD format)' },
      time: { type: 'string', description: 'Reservation time (HH:MM format)' },
      party_size: { type: 'number', description: 'Number of guests' },
      contact: { type: 'string', description: 'Phone number or email' },
      floor_preference: { type: 'string', description: 'Seating preference: 1F or 2F' },
      notes: { type: 'string', description: 'Any special requests or notes' },
    },
    required: ['name', 'date', 'time', 'party_size', 'contact'],
  },
};

const CHECK_AVAILABILITY_TOOL: Anthropic.Tool = {
  name: 'check_availability',
  description: 'Check seat availability at Felicity Coffee Roasters for a given date and time. Always call this before making a reservation.',
  input_schema: {
    type: 'object' as const,
    properties: {
      date: { type: 'string', description: 'Date to check (YYYY-MM-DD format)' },
      time: { type: 'string', description: 'Time to check (HH:MM format)' },
      party_size: { type: 'number', description: 'Number of guests' },
      floor_preference: { type: 'string', description: 'Optional floor preference: 1F or 2F' },
    },
    required: ['date', 'time', 'party_size'],
  },
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  const { messages } = await request.json() as { messages: Message[] };
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let currentMessages: Anthropic.MessageParam[] = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Loop to handle tool use — Claude may call a tool then continue
        let done = false;
        while (!done) {
          const response = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 512,
            system: SYSTEM_PROMPT,
            tools: [CHECK_AVAILABILITY_TOOL, RESERVATION_TOOL],
            messages: currentMessages,
            stream: true,
          });

          let currentText = '';
          let toolUseBlock: { id: string; name: string; input: string } | null = null;
          let stopReason = '';

          for await (const event of response) {
            if (event.type === 'content_block_start') {
              if (event.content_block.type === 'tool_use') {
                toolUseBlock = {
                  id: event.content_block.id,
                  name: event.content_block.name,
                  input: '',
                };
              }
            } else if (event.type === 'content_block_delta') {
              if (event.delta.type === 'text_delta') {
                currentText += event.delta.text;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
                );
              } else if (event.delta.type === 'input_json_delta' && toolUseBlock) {
                toolUseBlock.input += event.delta.partial_json;
              }
            } else if (event.type === 'message_delta') {
              stopReason = event.delta.stop_reason || '';
            }
          }

          if (stopReason === 'tool_use' && toolUseBlock) {
            const input = JSON.parse(toolUseBlock.input);
            let toolResult: string;

            try {
              if (toolUseBlock.name === 'check_availability') {
                // Execute availability check directly
                const availability = await getAvailability(
                  supabase,
                  input.date,
                  input.time
                );
                const partySize = input.party_size || 1;
                const floor = input.floor_preference;

                let canBook = false;
                if (floor && (floor === '1F' || floor === '2F')) {
                  canBook = availability[floor as '1F' | '2F'].available >= partySize;
                } else {
                  canBook =
                    availability['1F'].available >= partySize ||
                    availability['2F'].available >= partySize;
                }

                toolResult = JSON.stringify({ availability, canBook });
              } else {
                // Execute the reservation tool
                const res = await fetch(
                  new URL('/api/reservations', request.url).toString(),
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...input, source: 'chatbot', created_by: 'ai-concierge' }),
                  }
                );
                const data = await res.json();
                if (data.success) {
                  toolResult = `Reservation request saved successfully. ID: ${data.reservation?.id}`;
                } else if (data.availability) {
                  toolResult = `Not enough seats available. Current availability: ${JSON.stringify(data.availability)}`;
                } else {
                  toolResult = `Failed to save reservation: ${data.error}`;
                }
              }
            } catch (err: any) {
              toolResult = `Error: ${err.message}`;
            }

            // Build the assistant message with tool use for the next turn
            const assistantContent: Anthropic.ContentBlockParam[] = [];
            if (currentText) {
              assistantContent.push({ type: 'text', text: currentText });
            }
            assistantContent.push({
              type: 'tool_use',
              id: toolUseBlock.id,
              name: toolUseBlock.name,
              input,
            });

            currentMessages = [
              ...currentMessages,
              { role: 'assistant', content: assistantContent },
              {
                role: 'user',
                content: [
                  {
                    type: 'tool_result',
                    tool_use_id: toolUseBlock.id,
                    content: toolResult,
                  },
                ],
              },
            ];
            // Continue the loop so Claude can respond after the tool result
          } else {
            done = true;
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (err: any) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`)
        );
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
      Connection: 'keep-alive',
    },
  });
}
