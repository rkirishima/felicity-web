'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '@/app/hooks/useCart';
import { PREFECTURES } from '@/lib/prefectures';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutFormProps {
  language?: 'ja' | 'en';
  onSuccess?: (orderId: string) => void;
  onError?: (error: string) => void;
}

const translations = {
  ja: {
    checkout: 'チェックアウト',
    orderSummary: 'ご注文内容',
    shippingAddress: '配送先住所',
    paymentMethod: 'お支払い方法',
    stripePayment: 'Stripeでお支払う',
    bankTransfer: '銀行振込',
    emailPlaceholder: 'your@email.com',
    fullName: 'お名前',
    phone: '電話番号',
    postalCodeFormat: '郵便番号 (XXX-XXXX)',
    prefecture: '都道府県',
    city: '市区町村',
    streetAddress: '住所',
    building: '建物名・号室（任意）',
    subtotal: '小計（税込み）',
    shipping: '配送料',
    free: '無料',
    total: '合計',
    proceedToPayment: 'お支払いへ進む',
    processing: 'お支払い処理中...',
    allFieldsRequired: 'すべての必須フィールドを入力してください。',
    bankDetails: '銀行振込先',
    bankName: '銀行名',
    branchName: '支店名',
    accountType: '口座種別',
    accountNumber: '口座番号',
    accountHolder: '口座名義',
    transferDeadline: 'ご注文から7日以内にお振込みください',
    confirmOrder: 'ご注文確認',
    loadingPayment: 'お支払いフォームを読み込み中...',
  },
  en: {
    checkout: 'Checkout',
    orderSummary: 'Order Summary',
    shippingAddress: 'Shipping Address',
    paymentMethod: 'Payment Method',
    stripePayment: 'Pay with Stripe',
    bankTransfer: 'Bank Transfer',
    emailPlaceholder: 'your@email.com',
    fullName: 'Full Name',
    phone: 'Phone Number',
    postalCodeFormat: 'Postal Code (XXX-XXXX)',
    prefecture: 'Prefecture',
    city: 'City',
    streetAddress: 'Street Address',
    building: 'Building / Apartment (Optional)',
    subtotal: 'Subtotal (tax included)',
    shipping: 'Shipping',
    free: 'Free',
    total: 'Total',
    proceedToPayment: 'Proceed to Payment',
    processing: 'Processing...',
    allFieldsRequired: 'Please fill in all required fields.',
    bankDetails: 'Bank Transfer Details',
    bankName: 'Bank Name',
    branchName: 'Branch Name',
    accountType: 'Account Type',
    accountNumber: 'Account Number',
    accountHolder: 'Account Holder',
    transferDeadline: 'Please transfer within 7 days of order',
    confirmOrder: 'Confirm Order',
    loadingPayment: 'Loading payment form...',
  },
};

// Inner form — rendered inside <Elements> provider
function StripePaymentForm({
  language,
  onSuccess,
  onError,
  formData,
  total,
}: {
  language: 'ja' | 'en';
  onSuccess?: (orderId: string) => void;
  onError?: (error: string) => void;
  formData: { email: string; fullName: string };
  total: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = translations[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'Payment failed');
      setIsLoading(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        receipt_email: formData.email,
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'Payment failed');
      if (onError) onError(confirmError.message || 'Payment failed');
      setIsLoading(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      const orderId = `FLC-${Date.now()}`;
      if (onSuccess) onSuccess(orderId);
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
          defaultValues: { billingDetails: { email: formData.email, name: formData.fullName } },
        }}
      />
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-sm text-[14px]">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={isLoading || !stripe}
        className="w-full bg-[#2C2416] text-white py-4 rounded-sm font-light text-[16px] hover:bg-[#1a1410] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? t.processing : `${t.proceedToPayment} — ¥${total.toLocaleString('ja-JP')}`}
      </button>
    </form>
  );
}

export function CheckoutForm({ language = 'ja', onSuccess, onError }: CheckoutFormProps) {
  const items = useCart((state) => state.items);
  const getTotalPrice = useCart((state) => state.getTotalPrice);
  const getShippingCost = useCart((state) => state.getShippingCost);
  const subtotal = getTotalPrice();
  const shipping = getShippingCost();
  const total = subtotal + shipping;

  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'bank-transfer'>('stripe');
  const [formError, setFormError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(false);

  // Address form state
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [prefecture, setPrefecture] = useState('');
  const [city, setCity] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [building, setBuilding] = useState('');
  const [addressComplete, setAddressComplete] = useState(false);

  const t = translations[language];

  // Create PaymentIntent when address is complete and stripe is selected
  useEffect(() => {
    if (!addressComplete || paymentMethod !== 'stripe' || clientSecret) return;
    if (total <= 0) return;

    setLoadingIntent(true);
    fetch('/api/process-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: total, currency: 'jpy', email, fullName, items }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setFormError(data.message || 'Failed to initialize payment');
        }
      })
      .catch(() => setFormError('Failed to initialize payment'))
      .finally(() => setLoadingIntent(false));
  }, [addressComplete, paymentMethod]);

  const handleAddressSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim() || !phone.trim() || !prefecture || !city.trim() || !streetAddress.trim()) {
      setFormError(t.allFieldsRequired);
      return;
    }
    setFormError(null);
    setAddressComplete(true);
  };

  const handleBankTransfer = () => {
    if (!email.trim() || !fullName.trim() || !phone.trim() || !prefecture || !city.trim() || !streetAddress.trim()) {
      setFormError(t.allFieldsRequired);
      return;
    }
    const orderId = 'ORDER-' + Date.now();
    if (onSuccess) onSuccess(orderId);
  };

  return (
    <div className="space-y-8">
      {/* Order Summary */}
      <div className="bg-[#EDE5D8] rounded-sm p-6">
        <h2 className="text-[18px] font-light text-[#2C2416] mb-4">{t.orderSummary}</h2>
        <div className="space-y-2 text-[14px] text-[#8C7B6B]">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span>{item.name} × {item.quantity ?? 1}</span>
              <span>¥{(item.price * (item.quantity ?? 1)).toLocaleString('ja-JP')}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-[#DDD5C5] mt-4 pt-4">
          <div className="flex justify-between text-[14px] text-[#8C7B6B] mb-2">
            <span>{t.subtotal}</span>
            <span>¥{subtotal.toLocaleString('ja-JP')}</span>
          </div>
          <div className="flex justify-between text-[14px] text-[#8C7B6B] mb-4">
            <span>{t.shipping}</span>
            <span>{shipping === 0 ? t.free : `¥${shipping.toLocaleString('ja-JP')}`}</span>
          </div>
          <div className="flex justify-between text-[16px] font-light text-[#2C2416]">
            <span>{t.total}</span>
            <span>¥{total.toLocaleString('ja-JP')}</span>
          </div>
        </div>
      </div>

      {/* Payment Method Selector */}
      <div className="border border-[#DDD5C5] rounded-sm p-6">
        <h2 className="text-[18px] font-light text-[#2C2416] mb-6">{t.paymentMethod}</h2>
        <div className="space-y-4">
          <label className={`flex items-start gap-4 p-4 border-2 rounded-sm cursor-pointer ${paymentMethod === 'stripe' ? 'border-[#7AAFC4] bg-blue-50' : 'border-[#DDD5C5] hover:bg-gray-50'}`}>
            <input type="radio" name="payment" value="stripe" checked={paymentMethod === 'stripe'}
              onChange={(e) => { setPaymentMethod('stripe'); setClientSecret(null); }}
              className="mt-1" />
            <div>
              <div className="font-light text-[#2C2416]">{t.stripePayment}</div>
              <div className="text-[12px] text-[#8C7B6B]">Google Pay • PayPay • クレジットカード</div>
            </div>
          </label>

          <label className={`flex items-start gap-4 p-4 border-2 rounded-sm cursor-pointer ${paymentMethod === 'bank-transfer' ? 'border-[#7AAFC4] bg-blue-50' : 'border-[#DDD5C5] hover:bg-gray-50'}`}>
            <input type="radio" name="payment" value="bank-transfer" checked={paymentMethod === 'bank-transfer'}
              onChange={(e) => setPaymentMethod('bank-transfer')}
              className="mt-1" />
            <div>
              <div className="font-light text-[#2C2416]">{t.bankTransfer}</div>
            </div>
          </label>

          {paymentMethod === 'bank-transfer' && (
            <div className="mt-4 p-4 bg-[#F4EFE4] rounded-sm text-[14px]">
              <div className="font-light text-[#2C2416] mb-4">{t.bankDetails}</div>
              <div className="space-y-2 text-[#8C7B6B]">
                <div className="flex justify-between"><span>{t.bankName}:</span><span>住信SBIネット銀行</span></div>
                <div className="flex justify-between"><span>{t.branchName}:</span><span>法人第一支店</span></div>
                <div className="flex justify-between"><span>{t.accountType}:</span><span>普通</span></div>
                <div className="flex justify-between"><span>{t.accountNumber}:</span><span>2373525</span></div>
                <div className="flex justify-between"><span>{t.accountHolder}:</span><span>フェリシティ</span></div>
                <div className="text-[12px] mt-4 pt-4 border-t border-[#DDD5C5]">{t.transferDeadline}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Shipping Address */}
      <div className="border border-[#DDD5C5] rounded-sm p-6">
        <h2 className="text-[18px] font-light text-[#2C2416] mb-6">{t.shippingAddress}</h2>
        <form onSubmit={handleAddressSubmit} className="space-y-4">
          <input type="email" placeholder={t.emailPlaceholder} value={email} onChange={(e) => { setEmail(e.target.value); setAddressComplete(false); setClientSecret(null); }} required className="w-full px-4 py-2 border border-[#DDD5C5] rounded-sm text-[14px]" />
          <input type="text" placeholder={t.fullName} value={fullName} onChange={(e) => { setFullName(e.target.value); setAddressComplete(false); setClientSecret(null); }} required className="w-full px-4 py-2 border border-[#DDD5C5] rounded-sm text-[14px]" />
          <input type="tel" placeholder={t.phone} value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full px-4 py-2 border border-[#DDD5C5] rounded-sm text-[14px]" />
          <input type="text" placeholder={t.postalCodeFormat} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} maxLength={8} className="w-full px-4 py-2 border border-[#DDD5C5] rounded-sm text-[14px]" />
          <select value={prefecture} onChange={(e) => setPrefecture(e.target.value)} required className="w-full px-4 py-2 border border-[#DDD5C5] rounded-sm text-[14px]">
            <option value="">{t.prefecture}</option>
            {PREFECTURES.map((pref) => <option key={pref} value={pref}>{pref}</option>)}
          </select>
          <input type="text" placeholder={t.city} value={city} onChange={(e) => setCity(e.target.value)} required className="w-full px-4 py-2 border border-[#DDD5C5] rounded-sm text-[14px]" />
          <input type="text" placeholder={t.streetAddress} value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} required className="w-full px-4 py-2 border border-[#DDD5C5] rounded-sm text-[14px]" />
          <input type="text" placeholder={t.building} value={building} onChange={(e) => setBuilding(e.target.value)} className="w-full px-4 py-2 border border-[#DDD5C5] rounded-sm text-[14px]" />

          {formError && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-sm text-[14px]">{formError}</div>
          )}

          {/* Show payment based on method */}
          {paymentMethod === 'bank-transfer' ? (
            <button type="button" onClick={handleBankTransfer}
              className="w-full bg-[#2C2416] text-white py-4 rounded-sm font-light text-[16px] hover:bg-[#1a1410]">
              {t.confirmOrder}
            </button>
          ) : !addressComplete ? (
            <button type="submit"
              className="w-full bg-[#2C2416] text-white py-4 rounded-sm font-light text-[16px] hover:bg-[#1a1410]">
              {t.proceedToPayment}
            </button>
          ) : null}
        </form>

        {/* Stripe Payment Element — shown after address is confirmed */}
        {addressComplete && paymentMethod === 'stripe' && (
          <div className="mt-6">
            {loadingIntent && (
              <p className="text-[14px] text-[#8C7B6B] text-center py-4">{t.loadingPayment}</p>
            )}
            {clientSecret && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'flat',
                    variables: {
                      colorPrimary: '#2C2416',
                      colorBackground: '#F4EFE4',
                      fontFamily: 'system-ui, sans-serif',
                    },
                  },
                  locale: language === 'ja' ? 'ja' : 'en',
                }}
              >
                <StripePaymentForm
                  language={language}
                  onSuccess={onSuccess}
                  onError={onError}
                  formData={{ email, fullName }}
                  total={total}
                />
              </Elements>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
