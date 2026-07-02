'use client';

import type { Order } from '@/types';

interface OrderCardProps {
  order: Order;
  now: Date;
  onItemComplete: (orderId: string, itemIndex: number) => void;
  onOrderComplete: (orderId: string) => void;
}

function getAgeMinutes(createdAt: string, now: Date): number {
  return Math.floor((now.getTime() - new Date(createdAt).getTime()) / 60_000);
}

function formatAge(minutes: number): string {
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h${minutes % 60}m`;
}

export default function OrderCard({
  order,
  now,
  onItemComplete,
  onOrderComplete,
}: OrderCardProps) {
  const allItemsComplete = order.items.every((item) => item.completed);
  const ageMinutes = getAgeMinutes(order.created_at, now);

  const ageClass =
    ageMinutes >= 10
      ? 'age-critical'
      : ageMinutes >= 5
        ? 'age-warning'
        : 'new-order';

  return (
    <div
      className={`order-card bg-gray-800 rounded-lg p-4 border-2 border-yellow-500 flex flex-col ${ageClass}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h2 className="text-xl font-bold">
            {order.ticket_name || `#${order.id.slice(-4)}`}
          </h2>
          <p className="text-sm text-gray-400">
            {new Date(order.created_at).toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
            })}
            <span
              className={`ml-2 font-bold ${
                ageMinutes >= 10
                  ? 'text-red-400'
                  : ageMinutes >= 5
                    ? 'text-orange-400'
                    : 'text-green-400'
              }`}
            >
              {formatAge(ageMinutes)}
            </span>
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2 flex-1">
        {order.items.map((item, index) => (
          <button
            key={index}
            onClick={() => !item.completed && onItemComplete(order.id, index)}
            disabled={item.completed}
            className={`w-full text-left p-3 rounded flex justify-between items-center transition-colors ${
              item.completed
                ? 'bg-gray-700/50 line-through text-gray-500'
                : 'bg-gray-700 border-l-4 border-yellow-400 active:bg-gray-600'
            }`}
          >
            <div className="flex-1">
              <p className="font-semibold text-lg">
                {item.qty}x {item.name}
              </p>
              {item.modifiers && (
                <p className="text-sm text-blue-300 mt-1">{item.modifiers}</p>
              )}
              {item.note && (
                <p className="text-sm text-yellow-300 mt-1">{item.note}</p>
              )}
            </div>
            {!item.completed && (
              <span className="text-yellow-400 text-2xl font-bold ml-2">
                &#10003;
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Complete button */}
      <div className="mt-3 pt-3 border-t border-gray-700">
        {allItemsComplete ? (
          <button
            onClick={() => onOrderComplete(order.id)}
            className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 py-3 rounded-lg font-bold text-xl transition-colors"
          >
            DONE
          </button>
        ) : (
          <span className="text-sm text-gray-500">
            {order.items.filter((i) => i.completed).length}/{order.items.length} done
          </span>
        )}
      </div>
    </div>
  );
}
