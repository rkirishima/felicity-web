'use client';

import { useState } from 'react';
import { useCart } from '@/app/hooks/useCart';

interface ProductActionsProps {
  productName: string;
  productWeight: string;
  priceYen: number;
}

export function ProductActions({ productName, productWeight, priceYen }: ProductActionsProps) {
  const addItem = useCart((state) => state.addItem);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    const itemId = `coffee-${productName.toLowerCase().replace(/\s+/g, '-')}`;
    addItem({
      id: itemId,
      name: `${productName} ${productWeight}`,
      price: priceYen,
      quantity: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <button
      onClick={handleAddToCart}
      className={`font-mono text-[11px] tracking-[0.08em] uppercase px-8 py-3 rounded-sm transition-all duration-300 ${
        added
          ? 'bg-[#7AAFC4] text-[#2C2416]'
          : 'bg-[#2C2416] text-white hover:bg-[#1a1410]'
      }`}
    >
      {added ? '✓ カートに追加しました' : 'カートに追加'}
    </button>
  );
}
