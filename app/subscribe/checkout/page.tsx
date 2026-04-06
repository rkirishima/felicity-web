'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const PLAN_LABELS: Record<string, string> = {
  small: 'Plan S — 豆100g + 花束S ¥3,800/月',
  medium: 'Plan M — 豆200g + 花束M ¥5,800/月',
  large: 'Plan L — 豆200g + アレンジメント ¥8,800/月',
};

function CheckoutRedirect() {
  const searchParams = useSearchParams();
  const plan = searchParams?.get('plan') ?? '';

  useEffect(() => {
    if (!plan) return;
    fetch('/api/create-subscription-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.url) window.location.href = data.url;
      });
  }, [plan]);

  return (
    <div className="min-h-screen bg-[#F4EFE4] flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="font-mono text-[11px] tracking-[0.2em] text-[#7AAFC4] uppercase">
          お支払いページへ移動中...
        </p>
        {plan && (
          <p className="text-[14px] text-[#8C7B6B]">{PLAN_LABELS[plan]}</p>
        )}
        <div className="w-6 h-6 border border-[#2C2416] border-t-transparent rounded-full animate-spin mx-auto mt-4" />
      </div>
    </div>
  );
}

export default function SubscribeCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F4EFE4] flex items-center justify-center">
        <div className="w-6 h-6 border border-[#2C2416] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CheckoutRedirect />
    </Suspense>
  );
}
