'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Header } from '@/app/components/Header';
import { CheckoutForm } from '@/app/components/CheckoutForm';
import { useCart } from '@/app/hooks/useCart';

const translations = {
  ja: {
    orderConfirmed: '注文確認',
    thankYou: 'ご注文ありがとうございます',
    orderID: '注文番号',
    confirmationEmail: '確認メールをお送りしました。',
    processingTime: 'お気に入りからのご注文をいただき、ありがとうございます。',
    returnHome: 'ホームに戻る',
    checkout: 'チェックアウト',
    reviewOrder: 'ご注文内容をご確認いただき、お支払い情報をご入力ください',
    continueShopping: '← 買い物を続ける',
  },
  en: {
    orderConfirmed: 'Order Confirmed',
    thankYou: 'Thank you for your purchase!',
    orderID: 'Order ID',
    confirmationEmail: 'A confirmation email has been sent to your inbox.',
    processingTime: 'Please allow 1-2 business days for processing.',
    returnHome: 'Return to Home',
    checkout: 'Checkout',
    reviewOrder: 'Review your order and enter your payment details',
    continueShopping: '← Continue Shopping',
  },
};

function CheckoutPageContent({ language = 'ja' }: { language: 'ja' | 'en' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const items = useCart((state) => state.items);
  const clearCart = useCart((state) => state.clearCart);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const t = translations[language];

  // Check if we're showing confirmation (from search params)
  useEffect(() => {
    const confirmed = searchParams?.get('confirmed') === 'true';
    const id = searchParams?.get('orderId');
    if (confirmed && id) {
      setOrderConfirmed(true);
      setOrderId(id);
      clearCart();
    }
  }, [searchParams, clearCart]);

  // Don't redirect - allow checkout page to load even with empty cart
  // Cart will be populated from localStorage on mount

  const checkoutUrl = language === 'en' ? '/en/checkout' : '/checkout';
  const homeUrl = language === 'en' ? '/en/' : '/';

  return (
    <>
      {/* Main content */}
      <div className="pt-24 pb-20">
        <div className="max-w-2xl mx-auto px-8">
          {orderConfirmed ? (
            // Order Confirmation
            <div className="text-center space-y-8">
              <div className="space-y-3">
                <div className="text-6xl mb-4">✓</div>
                <h1 className="text-[clamp(32px,5vw,48px)] font-light text-[#2C2416]">
                  {t.orderConfirmed}
                </h1>
                <p className="text-[16px] text-[#8C7B6B]">
                  {t.thankYou}
                </p>
              </div>

              <div className="bg-[#EDE5D8] p-8 rounded-sm space-y-4">
                <div className="text-left border-b border-[#DDD5C5] pb-4">
                  <p className="text-[13px] text-[#8C7B6B] font-mono tracking-[0.08em] uppercase mb-2">
                    {t.orderID}
                  </p>
                  <p className="text-[17px] text-[#2C2416] font-mono">{orderId}</p>
                </div>

                <div className="text-center space-y-2">
                  <p className="text-[14px] text-[#8C7B6B]">
                    {t.confirmationEmail}
                  </p>
                  <p className="text-[14px] text-[#8C7B6B]">
                    {t.processingTime}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href={homeUrl}
                  className="inline-block bg-[#7AAFC4] text-[#2C2416] font-mono text-[13px] tracking-[0.08em] uppercase px-8 py-3 hover:bg-[#6A9DB3] transition-colors rounded-sm"
                >
                  {t.returnHome}
                </Link>
              </div>
            </div>
          ) : (
            // Checkout Form
            <div className="space-y-8">
              <div className="space-y-2">
                <h1 className="text-[clamp(36px,5vw,52px)] font-light text-[#2C2416]">
                  {t.checkout}
                </h1>
                <p className="text-[16px] text-[#8C7B6B]">
                  {t.reviewOrder}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Form */}
                <div className="lg:col-span-2">
                  <CheckoutForm
                    language={language}
                    onSuccess={(id) => {
                      router.push(`${checkoutUrl}?confirmed=true&orderId=${id}`);
                    }}
                    onError={(error) => {
                      console.error('Checkout error:', error);
                    }}
                  />
                </div>

                {/* Right: Order Summary Sidebar */}
                <div className="bg-[#EDE5D8] p-6 rounded-sm h-fit">
                  <h3 className="font-light text-[18px] text-[#2C2416] mb-6">ご注文内容</h3>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start pb-4 border-b border-[#DDD5C5] last:border-b-0">
                        <div>
                          <p className="text-[14px] text-[#2C2416]">{item.name}</p>
                          <p className="text-[12px] text-[#8C7B6B] mt-1">数量: {item.quantity ?? 1}</p>
                        </div>
                        <p className="font-mono text-[13px] text-[#2C2416] flex-shrink-0">
                          ¥{(item.price * (item.quantity ?? 1)).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Back to Cart */}
              <div className="text-center">
                <Link
                  href={language === 'en' ? '/en/#merch' : '/#merch'}
                  className="text-[#8C7B6B] hover:text-[#2C2416] text-[14px] font-mono tracking-[0.08em] uppercase transition-colors"
                >
                  {t.continueShopping}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-[#F4EFE4]">
      {/* Header */}
      <Header locale="ja" pathname="/checkout" contactLabel="お問い合わせ" />

      {/* Content with Suspense boundary */}
      <Suspense fallback={
        <div className="pt-24 pb-20 text-center">
          <p className="text-[#8C7B6B]">Loading checkout...</p>
        </div>
      }>
        <CheckoutPageContent language="ja" />
      </Suspense>
    </main>
  );
}
