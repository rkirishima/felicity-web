import { NextResponse } from 'next/server';

// Next 14 statically caches GET route handlers at build time by default —
// without this the KDS serves a frozen snapshot of orders forever.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SQUARE_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const LOCATION_ID = process.env.SQUARE_LOCATION_ID;

// Food category IDs in Square
const FOOD_CATEGORY_IDS = new Set([
  'RI55HB4EQLMKHRTKRRS5KGKZ', // フード
  'AT4HRD57QYQATBMDDNAU6UDI', // フード
  'ZG5KZN3EGXAGFMOKY2VN26OE', // Food
  '3K7I257HOJUFP6PDXAO24REP', // ランチ
  'IVEDMGOO73OZKVD2RAC5NFQU', // セットメニュー
  'NUYAW7DMKHCH6SRKEOIERO5B', // お菓子
  'PRG4INQ53WL5NCSW5O7YWI3B', // お菓子
]);

const SQUARE_TIMEOUT = 15_000;

// Cache catalog: variation_id -> { name, isFood }
let catalogCache: Map<string, { name: string; isFood: boolean }> | null = null;
let catalogCacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Last successful order list — served (marked stale) when Square is unreachable
let lastGood: { orders: unknown[]; time: number } | null = null;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

async function sq(path: string, body?: object) {
  const res = await fetch(`https://connect.squareup.com/v2${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${SQUARE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    ...(body && { body: JSON.stringify(body) }),
    cache: 'no-store',
    signal: AbortSignal.timeout(SQUARE_TIMEOUT),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Square ${path} → ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json();
}

// One retry — a single dropped connection shouldn't surface as an outage
async function sqRetry(path: string, body?: object) {
  try {
    return await sq(path, body);
  } catch {
    return sq(path, body);
  }
}

async function buildCatalogCache() {
  if (catalogCache && Date.now() - catalogCacheTime < CACHE_TTL) {
    return catalogCache;
  }

  try {
    const map = new Map<string, { name: string; isFood: boolean }>();
    let cursor: string | undefined;

    do {
      const url = '/catalog/list?types=ITEM' + (cursor ? `&cursor=${cursor}` : '');
      const data = await sqRetry(url);

      if (data.objects) {
        for (const item of data.objects) {
          const catIds = item.item_data?.categories?.map((c: { id: string }) => c.id) || [];
          const isFood = catIds.some((id: string) => FOOD_CATEGORY_IDS.has(id));

          for (const v of item.item_data?.variations || []) {
            map.set(v.id, { name: item.item_data.name, isFood });
          }
        }
      }
      cursor = data.cursor;
    } while (cursor);

    catalogCache = map;
    catalogCacheTime = Date.now();
    return map;
  } catch (err) {
    // Stale catalog beats no catalog — item names/categories rarely change mid-service
    if (catalogCache) return catalogCache;
    throw err;
  }
}

export async function GET() {
  if (!SQUARE_TOKEN || !LOCATION_ID) {
    return NextResponse.json(
      { error: 'SQUARE_ACCESS_TOKEN / SQUARE_LOCATION_ID not configured' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const catalog = await buildCatalogCache();

    // Fetch orders from last 12 hours
    const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const data = await sqRetry('/orders/search', {
      location_ids: [LOCATION_ID],
      query: {
        filter: {
          state_filter: { states: ['OPEN', 'COMPLETED'] },
          date_time_filter: { created_at: { start_at: since } },
        },
        sort: { sort_field: 'CREATED_AT', sort_order: 'ASC' },
      },
      limit: 50,
    });

    const orders = (data.orders || [])
      .map((order: any) => {
        // Filter line items to food only
        const foodItems = (order.line_items || [])
          .filter((li: any) => {
            const info = catalog.get(li.catalog_object_id);
            return info?.isFood;
          })
          .map((li: any, i: number) => ({
            index: i,
            name: li.name,
            qty: parseInt(li.quantity, 10),
            note: li.note || '',
            modifiers: (li.modifiers || []).map((m: any) => m.name).join(', '),
          }));

        if (foodItems.length === 0) return null;

        return {
          id: order.id,
          created_at: order.created_at,
          state: order.state,
          ticket_name: order.ticket_name || '',
          items: foodItems,
        };
      })
      .filter(Boolean);

    lastGood = { orders, time: Date.now() };
    return NextResponse.json(
      { orders, serverTime: new Date().toISOString() },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err: any) {
    console.error('Square API error:', err);
    // Serve the last good list rather than blanking the kitchen screen
    if (lastGood) {
      return NextResponse.json(
        {
          orders: lastGood.orders,
          stale: true,
          staleSince: new Date(lastGood.time).toISOString(),
          error: err.message,
        },
        { headers: NO_STORE_HEADERS }
      );
    }
    return NextResponse.json(
      { error: err.message },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
