'use client';

import { useCart } from '@/app/hooks/useCart';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const translations = {
  ja: {
    cart: 'カート',
    closeCart: 'カートを閉じる',
    emptyCart: 'カートは空です',
    continueShopping: 'ショッピングを続ける',
    remove: '削除',
    subtotal: '小計（税込み）',
    shipping: '配送料',
    free: '無料',
    freeShippingThreshold: '¥5,000以上で送料無料',
    total: '合計',
    checkout: 'お支払いへ進む',
    decreaseQty: '数量を減らす',
    increaseQty: '数量を増やす',
  },
  en: {
    cart: 'Cart',
    closeCart: 'Close cart',
    emptyCart: 'Your cart is empty',
    continueShopping: 'Continue shopping',
    remove: 'Remove',
    subtotal: 'Subtotal (tax included)',
    shipping: 'Shipping',
    free: 'Free',
    freeShippingThreshold: 'Free shipping on orders ¥5,000+',
    total: 'Total',
    checkout: 'Proceed to Checkout',
    decreaseQty: 'Decrease quantity',
    increaseQty: 'Increase quantity',
  },
};

export function CartDrawer() {
  const items = useCart((state) => state.items);
  const isOpen = useCart((state) => state.isOpen);
  const closeCart = useCart((state) => state.closeCart);
  const removeItem = useCart((state) => state.removeItem);
  const updateQuantity = useCart((state) => state.updateQuantity);
  const getTotalPrice = useCart((state) => state.getTotalPrice);
  const getShippingCost = useCart((state) => state.getShippingCost);
  const pathname = usePathname();
  const language = pathname?.startsWith('/en') ? 'en' : 'ja';
  const t = translations[language];

  if (!isOpen) return null;

  const subtotal = getTotalPrice();
  const shipping = getShippingCost();
  const total = subtotal + shipping;
  const checkoutUrl = language === 'en' ? '/en/checkout' : '/checkout';

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-screen w-full max-w-md z-50 bg-[#F4EFE4] flex flex-col shadow-lg animate-in slide-in-from-right-80 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DDD5C5] px-6 py-4 flex-shrink-0">
          <h2 className="font-light text-[22px] text-[#2C2416]">{t.cart}</h2>
          <button
            onClick={closeCart}
            aria-label={t.closeCart}
            className="text-[#8C7B6B] hover:text-[#2C2416] transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {items.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[#8C7B6B]">
              <p className="text-center">{t.emptyCart}</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="border-b border-[#DDD5C5] pb-6 last:border-b-0 last:pb-0">
                {/* Item name and price */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-[16px] font-light text-[#2C2416] flex-1">{item.name}</h3>
                  </div>
                  <p className="font-mono text-[13px] text-[#7AAFC4] flex-shrink-0 ml-4">
                    ¥{item.price.toLocaleString()}
                  </p>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-[#DDD5C5] rounded-sm">
                    <button
                      onClick={() => updateQuantity(item.id, (item.quantity ?? 1) - 1)}
                      className="px-3 py-1 text-[#8C7B6B] hover:text-[#2C2416] hover:bg-[#EDE5D8] transition-colors text-sm"
                      aria-label={`${t.decreaseQty} ${item.name}`}
                    >
                      −
                    </button>
                    <span className="px-4 py-1 text-[14px] font-mono text-[#2C2416] border-l border-r border-[#DDD5C5]">
                      {item.quantity ?? 1}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, (item.quantity ?? 1) + 1)}
                      className="px-3 py-1 text-[#8C7B6B] hover:text-[#2C2416] hover:bg-[#EDE5D8] transition-colors text-sm"
                      aria-label={`${t.increaseQty} ${item.name}`}
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="ml-auto text-[#8C7B6B] hover:text-[#2C2416] text-[13px] font-mono tracking-[0.08em] uppercase transition-colors"
                    aria-label={`${t.remove} ${item.name}`}
                  >
                    {t.remove}
                  </button>
                </div>

                {/* Subtotal for this item */}
                <p className="text-right text-[13px] text-[#8C7B6B] mt-3">
                  ¥{(item.price * (item.quantity ?? 1)).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Order Summary */}
        {items.length > 0 && (
          <div className="border-t border-[#DDD5C5] px-6 py-6 space-y-3 flex-shrink-0">
            {/* Subtotal */}
            <div className="flex justify-between items-center text-[14px]">
              <span className="text-[#8C7B6B]">{t.subtotal}</span>
              <span className="font-mono text-[#2C2416]">¥{subtotal.toLocaleString()}</span>
            </div>

            {/* Shipping */}
            <div className="flex justify-between items-center text-[14px]">
              <span className="text-[#8C7B6B]">{t.shipping}</span>
              <span className={`font-mono ${shipping === 0 ? 'text-green-600' : 'text-[#2C2416]'}`}>
                {shipping === 0 ? t.free : `¥${shipping.toLocaleString()}`}
              </span>
            </div>

            {/* Free Shipping Threshold Message */}
            {subtotal < 5000 && (
              <div className="pt-2 text-[12px] text-[#7AAFC4] text-center font-light">
                {t.freeShippingThreshold}
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-center text-[16px] font-light border-t border-[#DDD5C5] pt-3">
              <span className="text-[#2C2416]">{t.total}</span>
              <span className="font-mono text-[#7AAFC4]">¥{total.toLocaleString()}</span>
            </div>

            {/* Checkout Button */}
            <Link
              href={checkoutUrl}
              onClick={closeCart}
              className="block w-full mt-6 bg-[#7AAFC4] text-[#2C2416] font-mono text-[13px] tracking-[0.08em] uppercase px-6 py-3 text-center hover:bg-[#6A9DB3] transition-colors rounded-sm"
            >
              {t.checkout}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
