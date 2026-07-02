'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import OrderCard from '@/components/OrderCard';
import { useAudio } from '@/hooks/useAudio';
import type { Order } from '@/types';

const POLL_INTERVAL = 5_000; // 5 seconds
const TTL = 12 * 60 * 60 * 1000; // forget local state after 12h
const WATCHDOG_LIMIT = 5 * 60 * 1000; // hard reload if nothing succeeded for 5 min
const RELOAD_COOLDOWN = 10 * 60 * 1000; // never reload-loop faster than this

const COMPLETED_KEY = 'kds-completed';
const SEEN_KEY = 'kds-seen';
const TICKS_KEY = 'kds-item-ticks';
const SNAPSHOT_KEY = 'kds-snapshot';
const RELOAD_KEY = 'kds-last-reload';

// localStorage can throw (private mode, quota) — the KDS must survive that
function lsGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function lsSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // non-fatal: state just won't survive a reload
  }
}

function loadIdMap(key: string): Map<string, number> {
  const raw = lsGet(key);
  if (!raw) return new Map();
  try {
    const entries = JSON.parse(raw) as [string, number][];
    const now = Date.now();
    return new Map(entries.filter(([, ts]) => now - ts < TTL));
  } catch {
    return new Map();
  }
}

function saveIdMap(key: string, map: Map<string, number>) {
  lsSet(key, JSON.stringify([...map.entries()]));
}

// orderId -> { ts, done: [itemIndex, ...] }
type TickStore = Record<string, { ts: number; done: number[] }>;

function loadTicks(): TickStore {
  const raw = lsGet(TICKS_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as TickStore;
    const now = Date.now();
    const fresh: TickStore = {};
    for (const [id, entry] of Object.entries(parsed)) {
      if (now - entry.ts < TTL) fresh[id] = entry;
    }
    return fresh;
  } catch {
    return {};
  }
}

export default function Kitchen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<number | null>(null);
  const { playAlert, unlock } = useAudio();

  const completedIds = useRef<Map<string, number>>(new Map());
  const seenIds = useRef<Map<string, number>>(new Map());
  const itemTicks = useRef<TickStore>({});
  const firstLoad = useRef(true);
  const inFlight = useRef(false);
  const lastSuccessRef = useRef(Date.now()); // start "healthy" so watchdog waits a full window

  // Re-apply locally ticked items on top of fresh server data,
  // otherwise every poll wipes the kitchen's checkmarks
  const applyTicks = useCallback((order: Order): Order => {
    const done = new Set(itemTicks.current[order.id]?.done ?? []);
    if (done.size === 0) return order;
    return {
      ...order,
      items: order.items.map((item, i) =>
        done.has(i) ? { ...item, completed: true } : item
      ),
    };
  }, []);

  const fetchOrders = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' });
      const data = await res.json();

      if (!Array.isArray(data.orders)) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      // Filter out orders the kitchen already marked done locally
      const activeOrders = (data.orders as Order[])
        .filter((o) => !completedIds.current.has(o.id))
        .map(applyTicks);

      // Alert on genuinely new order IDs (count-based logic missed 0→1)
      const now = Date.now();
      let hasNew = false;
      for (const o of activeOrders) {
        if (!seenIds.current.has(o.id)) {
          seenIds.current.set(o.id, now);
          hasNew = true;
        }
      }
      if (hasNew) {
        saveIdMap(SEEN_KEY, seenIds.current);
        if (!firstLoad.current) playAlert();
      }
      firstLoad.current = false;

      setOrders(activeOrders);
      lsSet(SNAPSHOT_KEY, JSON.stringify({ ts: now, orders: activeOrders }));
      lastSuccessRef.current = now;
      setLastSuccess(now);
      setError(
        data.stale ? 'Square接続が不安定 — 表示は少し前の状態です' : null
      );
    } catch (err: any) {
      // Keep showing the last known orders; on a cold start fall back to the
      // saved snapshot so a reload while offline still shows something
      if (firstLoad.current) {
        firstLoad.current = false;
        const raw = lsGet(SNAPSHOT_KEY);
        if (raw) {
          try {
            const snap = JSON.parse(raw) as { ts: number; orders: Order[] };
            if (Date.now() - snap.ts < TTL) {
              setOrders(
                snap.orders
                  .filter((o) => !completedIds.current.has(o.id))
                  .map(applyTicks)
              );
            }
          } catch {
            // corrupt snapshot — ignore
          }
        }
      }
      setError(`接続エラー: ${err.message ?? err}`);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [playAlert, applyTicks]);

  // Load persisted state on mount
  useEffect(() => {
    completedIds.current = loadIdMap(COMPLETED_KEY);
    seenIds.current = loadIdMap(SEEN_KEY);
    itemTicks.current = loadTicks();
  }, []);

  // Clock tick every 30s
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  // Poll Square orders
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Refetch immediately when the tablet comes back (visibility / network / focus)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchOrders();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', fetchOrders);
    window.addEventListener('focus', fetchOrders);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', fetchOrders);
      window.removeEventListener('focus', fetchOrders);
    };
  }, [fetchOrders]);

  // Keep the tablet screen awake (best-effort; re-acquire when tab returns)
  useEffect(() => {
    let lock: { release?: () => Promise<void> } | null = null;
    const acquire = async () => {
      try {
        lock = await (navigator as any).wakeLock?.request('screen');
      } catch {
        // unsupported or denied — nothing we can do
      }
    };
    acquire();
    const onVisible = () => {
      if (document.visibilityState === 'visible') acquire();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release?.().catch(() => {});
    };
  }, []);

  // Unlock audio on the first touch (iOS blocks autoplay until a gesture)
  useEffect(() => {
    const onFirstTouch = () => {
      unlock();
      window.removeEventListener('pointerdown', onFirstTouch);
    };
    window.addEventListener('pointerdown', onFirstTouch);
    return () => window.removeEventListener('pointerdown', onFirstTouch);
  }, [unlock]);

  // Watchdog: if nothing has succeeded for a while, a hard reload recovers
  // from any wedged JS state. Cooldown prevents reload loops while offline.
  useEffect(() => {
    const watchdog = setInterval(() => {
      const now = Date.now();
      if (now - lastSuccessRef.current < WATCHDOG_LIMIT) return;
      if (navigator.onLine === false) return; // reload won't help without network
      const lastReload = parseInt(lsGet(RELOAD_KEY) || '0', 10);
      if (now - lastReload < RELOAD_COOLDOWN) return;
      lsSet(RELOAD_KEY, String(now));
      window.location.reload();
    }, 30_000);
    return () => clearInterval(watchdog);
  }, []);

  const handleItemComplete = (orderId: string, itemIndex: number) => {
    const entry = itemTicks.current[orderId] ?? { ts: Date.now(), done: [] };
    if (!entry.done.includes(itemIndex)) entry.done.push(itemIndex);
    entry.ts = Date.now();
    itemTicks.current[orderId] = entry;
    lsSet(TICKS_KEY, JSON.stringify(itemTicks.current));
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              items: o.items.map((item, i) =>
                i === itemIndex ? { ...item, completed: true } : item
              ),
            }
          : o
      )
    );
  };

  const handleOrderComplete = (orderId: string) => {
    completedIds.current.set(orderId, Date.now());
    saveIdMap(COMPLETED_KEY, completedIds.current);
    delete itemTicks.current[orderId];
    lsSet(TICKS_KEY, JSON.stringify(itemTicks.current));
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">&#9749;</div>
          <p className="text-xl text-gray-400">Loading orders...</p>
        </div>
      </div>
    );
  }

  const staleMinutes = lastSuccess
    ? Math.floor((clock.getTime() - lastSuccess) / 60_000)
    : null;

  return (
    <div className="bg-gray-900 text-white h-screen flex flex-col">
      {/* Connection banner — loud and unmissable when data may be stale */}
      {error && (
        <div className="bg-red-600 text-white text-center py-1 text-sm font-bold flex-shrink-0">
          &#9888; {error}
          {staleMinutes !== null && staleMinutes >= 1 && (
            <span> ｜ 最終更新 {staleMinutes}分前</span>
          )}
        </div>
      )}

      <div className="flex flex-col flex-1 p-4 min-h-0">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h1 className="text-3xl font-bold">Kitchen</h1>
          <div className="flex items-center gap-4">
            <span
              className={`w-3 h-3 rounded-full ${error ? 'bg-red-500' : 'bg-green-500'}`}
              title={error ? 'disconnected' : 'connected'}
            />
            <span className="text-lg text-gray-400">
              {clock.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="bg-yellow-500 text-black px-3 py-1 rounded-full font-bold text-lg">
              {orders.length}
            </span>
          </div>
        </div>

        {/* Order grid */}
        <div className="flex-1 overflow-y-auto">
          {orders.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-8xl mb-4 opacity-20">&#9749;</div>
                <p className="text-2xl text-gray-600">No food orders</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  now={clock}
                  onItemComplete={handleItemComplete}
                  onOrderComplete={handleOrderComplete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
