'use client';

import { useState } from 'react';
import { useCart } from '@/app/hooks/useCart';
import { GRIND_OPTIONS, GrindOption, DEFAULT_GRIND } from '@/app/lib/grind';

interface ProductActionsProps {
  productName: string;
  productWeight: string;
  priceYen: number;
  locale?: 'ja' | 'en';
}

export function ProductActions({ productName, productWeight, priceYen, locale = 'ja' }: ProductActionsProps) {
  const addItem = useCart((state) => state.addItem);
  const [added, setAdded] = useState(false);
  const [grind, setGrind] = useState<GrindOption>(DEFAULT_GRIND);
  const labelKey = locale === 'en' ? 'en' : 'ja';

  const handleAddToCart = () => {
    const baseId = `coffee-${productName.toLowerCase().replace(/\s+/g, '-')}`;
    addItem({
      id: `${baseId}-${grind}`,
      name: `${productName} ${productWeight}`,
      price: priceYen,
      quantity: 1,
      grind,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      {/* Grind selector */}
      <div>
        <label
          htmlFor="product-grind"
          className="block font-mono text-[9px] tracking-[0.2em] uppercase text-[#8C7B6B] mb-2"
        >
          {locale === 'en' ? 'Grind' : '挽き方'}
        </label>
        <select
          id="product-grind"
          value={grind}
          onChange={(e) => setGrind(e.target.value as GrindOption)}
          className="bg-[#F4EFE4] border border-[#DDD5C5] rounded-sm px-4 py-3 text-[13px] text-[#2C2416] font-light focus:outline-none focus:border-[#7AAFC4] transition-colors"
        >
          {GRIND_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt[labelKey]}
              {opt.value === 'whole' ? '' : `（${labelKey === 'en' ? opt.subEn : opt.subJa}）`}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleAddToCart}
        className={`font-mono text-[11px] tracking-[0.08em] uppercase px-8 py-3 rounded-sm transition-all duration-300 ${
          added
            ? 'bg-[#7AAFC4] text-[#2C2416]'
            : 'bg-[#2C2416] text-white hover:bg-[#1a1410]'
        }`}
      >
        {added
          ? locale === 'en' ? '✓ Added to cart' : '✓ カートに追加しました'
          : locale === 'en' ? 'Add to cart' : 'カートに追加'}
      </button>
    </div>
  );
}
