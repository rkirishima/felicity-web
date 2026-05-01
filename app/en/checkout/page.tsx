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
    confirmationEmail: 'ご注文を受け付けました。',
    processingTime: '1〜2営業日以内に発送準備を開始いたします。',
    bankTransferNote: '下記の口座にお振込みをお願いいたします。',
    bankTransferDeadline: 'ご注文から7日以内にお振込みください。',
    bankTransferRef: '振込時のご依頼人名にご注文番号をご記載ください。',
    bankName: '銀行名',
    branchName: '支店名',
    accountType: '口座種別',
    accountNumber: '口座番号',
    accountHolder: '口座名義',
    transferAmount: 'お振込み金額',
    returnHome: 'ホームに戻る',
    checkout: 'レジ',
    reviewOrder: 'ご注文内容をご確認いただき、お支払い情報をご入力ください',
    continueShopping: '← 買い物を続ける',
  },
  en: {
    orderConfirmed: 'Order Confirmed',
    thankYou: 'Thank you for your purchase!',
    orderID: 'Order ID',
    confirmationEmail: 'Your order has been received.',
    processingTime: 'Please allow 1-2 business days for processing.',
    bankTransferNote: 'Please transfer the payment to the following account.',
    bankTransferDeadline: 'Please complete the transfer within 7 days.',
    bankTransferRef: 'Include your Order ID as the transfer reference.',
    bankName: 'Bank',
    branchName: 'Branch',
    accountType: 'Account Type',
    accountNumber: 'Account Number',
    accountHolder: 'Account Holder',
    transferAmount: 'Transfer Amount',
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
  const _hasHydrated = useCart((state) => state._hasHydrated);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [orderAmount, setOrderAmount] = useState<string | null>(null);
  const t = translations[language];

  // Check if we're showing confirmation (from search params)
  useEffect(() => {
    const confirmed = searchParams?.get('confirmed') === 'true';
    const id = searchParams?.get('orderId');
    const method = searchParams?.get('method');
    const amt = searchParams?.get('amount');
    if (confirmed && id) {
      setOrderConfirmed(true);
      setOrderId(id);
      setPaymentMethod(method);
      setOrderAmount(amt);
      clearCart();
    }
  }, [searchParams, clearCart]);

  // Redirect to home when cart is empty after hydration (e.g. back button after confirmation)
  useEffect(() => {
    if (_hasHydrated && items.length === 0 && !orderConfirmed) {
      router.push(language === 'en' ? '/en/' : '/');
    }
  }, [_hasHydrated, items.length, orderConfirmed, language, router]);

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
                <p className="text-[15px] text-[#8C7B6B]">
                  {t.thankYou}
                </p>
              </div>

              <div className="bg-[#EDE5D8] p-8 rounded-sm space-y-4">
                <div className="text-left border-b border-[#DDD5C5] pb-4">
                  <p className="text-[12px] text-[#8C7B6B] font-mono tracking-[0.08em] uppercase mb-2">
                    {t.orderID}
                  </p>
                  <p className="text-[16px] text-[#2C2416] font-mono">{orderId}</p>
                </div>

                {paymentMethod === 'bank-transfer' ? (
                  <div className="text-left space-y-4">
                    <p className="text-[14px] text-[#2C2416] font-light">{t.bankTransferNote}</p>
                    <div className="space-y-2 text-[14px] text-[#8C7B6B]">
                      <div className="flex justify-between"><span>{t.bankName}:</span><span>住信SBIネット銀行</span></div>
                      <div className="flex justify-between"><span>{t.branchName}:</span><span>法人第一支店</span></div>
                      <div className="flex justify-between"><span>{t.accountType}:</span><span>普通</span></div>
                      <div className="flex justify-between"><span>{t.accountNumber}:</span><span>2373525</span></div>
                      <div className="flex justify-between"><span>{t.accountHolder}:</span><span>フェリシティ</span></div>
                      {orderAmount && (
                        <div className="flex justify-between font-light text-[#2C2416]">
                          <span>{t.transferAmount}:</span>
                          <span>¥{Number(orderAmount).toLocaleString('ja-JP')}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-[13px] pt-4 border-t border-[#DDD5C5] space-y-2">
                      <p className="text-[#B8860B]">{t.bankTransferDeadline}</p>
                      <p className="text-[#8C7B6B]">{t.bankTransferRef}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <p className="text-[13px] text-[#8C7B6B]">{t.confirmationEmail}</p>
                    <p className="text-[13px] text-[#8C7B6B]">{t.processingTime}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Link
                  href={homeUrl}
                  className="inline-block bg-[#7AAFC4] text-[#2C2416] font-mono text-[11px] tracking-[0.08em] uppercase px-8 py-3 hover:bg-[#6A9DB3] transition-colors rounded-sm"
                >
                  {t.returnHome}
                </Link>
              </div>
            </div>
          ) : (
            // Checkout Form
            <div className="space-y-8">
              <div className="space-y-2">
                <h1 className="text-[clamp(32px,5vw,48px)] font-light text-[#2C2416]">
                  {t.checkout}
                </h1>
                <p className="text-[15px] text-[#8C7B6B]">
                  {t.reviewOrder}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Form */}
                <div className="lg:col-span-2">
                  <CheckoutForm
                    language={language}
                    onSuccess={(id, method) => {
                      const totalAmount = items.reduce((sum, item) => sum + item.price * (item.quantity ?? 1), 0);
                      router.push(`${checkoutUrl}?confirmed=true&orderId=${id}&method=${method}&amount=${totalAmount}`);
                    }}
                    onError={(error) => {
                      console.error('Checkout error:', error);
                    }}
                  />
                </div>

                {/* Right: Order Summary Sidebar */}
                <div className="bg-[#EDE5D8] p-6 rounded-sm h-fit">
                  <h3 className="font-light text-[16px] text-[#2C2416] mb-6">Order Summary</h3>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start pb-4 border-b border-[#DDD5C5] last:border-b-0">
                        <div>
                          <p className="text-[13px] text-[#2C2416]">{item.name}</p>
                          <p className="text-[11px] text-[#8C7B6B] mt-1">Qty: {item.quantity ?? 1}</p>
                        </div>
                        <p className="font-mono text-[12px] text-[#2C2416] flex-shrink-0">
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
                  className="text-[#8C7B6B] hover:text-[#2C2416] text-[13px] font-mono tracking-[0.08em] uppercase transition-colors"
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

export default function CheckoutPageEN() {
  return (
    <main className="min-h-screen bg-[#F4EFE4]">
      {/* Header */}
      <Header locale="en" pathname="/en/checkout" contactLabel="CONTACT" />

      {/* Quick Escape: Back to Home (visible above content) */}
      <div className="fixed top-20 left-8 z-50">
        <Link
          href="/en/"
          className="text-[13px] text-[#8C7B6B] hover:text-[#2C2416] font-mono tracking-[0.08em] uppercase transition-colors underline"
        >
          ← Return to Home
        </Link>
      </div>

      {/* Content with Suspense boundary */}
      <Suspense fallback={
        <div className="pt-24 pb-20 text-center">
          <p className="text-[#8C7B6B]">Loading checkout...</p>
        </div>
      }>
        <CheckoutPageContent language="en" />
      </Suspense>
    </main>
  );
}
