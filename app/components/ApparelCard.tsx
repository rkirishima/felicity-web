'use client';

import { useCart } from "@/app/hooks/useCart";
import { useState } from "react";
import Image from "next/image";

interface ApparelVariant {
  id: string;
  productId: string;
  name: string;
  basePrice: number;
  color?: string;
  size?: string;
}

interface ApparelItem {
  id: string;
  name: string;
  nameJa?: string;
  basePrice: number;
  description: string;
  descriptionJa?: string;
  color?: string;
  colors?: string[];
  sizes?: string[];
  images: string[]; // Array of image paths
  variants: ApparelVariant[];
}

interface ApparelCardProps {
  item: ApparelItem;
  language: 'en' | 'ja';
}

export function ApparelCard({ item, language }: ApparelCardProps) {
  const addItem = useCart((state) => state.addItem);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState(item.variants[0].id);
  const [addedId, setAddedId] = useState<string | null>(null);

  const selectedVariant = item.variants.find(v => v.id === selectedVariantId);
  const mainImage = item.images[mainImageIndex] || item.images[0];

  const handleThumbnailClick = (index: number) => {
    setMainImageIndex(index);
  };

  const handleAddToCart = () => {
    if (!selectedVariant) return;

    const variantList = [];
    if (selectedVariant.color) variantList.push({ name: 'Color', value: selectedVariant.color });
    if (selectedVariant.size && selectedVariant.size !== 'Regular') {
      variantList.push({ name: 'Size', value: selectedVariant.size });
    }

    addItem({
      id: selectedVariantId,
      name: item.name,
      price: selectedVariant?.basePrice || item.basePrice,
      quantity: 1,
    });

    setAddedId(selectedVariantId);
    setTimeout(() => setAddedId(null), 1500);
  };

  const handleVariantSelect = (variantId: string) => {
    setSelectedVariantId(variantId);
  };

  const isEnglish = language === 'en';
  const displayName = isEnglish ? item.name : (item.nameJa || item.name);
  const displayDescription = isEnglish ? item.description : (item.descriptionJa || item.description);

  return (
    <div className="bg-[#EDE5D8] rounded-lg overflow-hidden border border-[#DDD5C5]">
      {/* Gallery Section */}
      <div className="space-y-3 p-4 bg-[#DDD5C5]">
        {/* Main Image */}
        <div className="relative aspect-square bg-[#C5BBAA] rounded overflow-hidden flex items-center justify-center">
          {mainImage ? (
            <img
              src={mainImage}
              alt={displayName}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
          ) : (
            <span className="font-mono text-[11px] tracking-[0.14em] text-[#8C7B6B] uppercase text-center px-4">
              {displayName}
            </span>
          )}
        </div>

        {/* Thumbnail Carousel */}
        {item.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {item.images.map((image, index) => (
              <button
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden transition-all duration-200 ${
                  mainImageIndex === index
                    ? 'ring-2 ring-[#7AAFC4] opacity-100'
                    : 'opacity-60 hover:opacity-80'
                }`}
              >
                <img
                  src={image}
                  alt={`${displayName} view ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6 flex flex-col gap-4">
        {/* Name & Price */}
        <div>
          <h3 className="text-[16px] font-light text-[#2C2416] mb-2">
            {displayName}
          </h3>
          <p className="font-mono text-[12px] tracking-[0.06em] text-[#7AAFC4]">
            ¥{item.basePrice.toLocaleString()}
          </p>
        </div>

        {/* Description */}
        <p className="text-[13px] leading-relaxed text-[#5C5248]">
          {displayDescription}
        </p>

        {/* Variant Selectors */}
        {(item.colors || item.sizes) && (
          <div className="space-y-3">
            {/* Color Selector */}
            {item.colors && item.colors.length > 1 && (
              <div>
                <label className="block text-[11px] font-mono tracking-[0.08em] text-[#8C7B6B] uppercase mb-2">
                  {isEnglish ? 'Color' : '色'}
                </label>
                <select
                  value={selectedVariantId}
                  onChange={(e) => handleVariantSelect(e.target.value)}
                  className="w-full border border-[#DDD5C5] rounded px-3 py-2 text-[13px] text-[#2C2416] bg-white focus:outline-none focus:border-[#7AAFC4]"
                >
                  {item.variants.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.color}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Size Selector */}
            {item.sizes && item.sizes.length > 1 && (
              <div>
                <label className="block text-[11px] font-mono tracking-[0.08em] text-[#8C7B6B] uppercase mb-2">
                  {isEnglish ? 'Size' : 'サイズ'}
                </label>
                <select
                  value={selectedVariantId}
                  onChange={(e) => handleVariantSelect(e.target.value)}
                  className="w-full border border-[#DDD5C5] rounded px-3 py-2 text-[13px] text-[#2C2416] bg-white focus:outline-none focus:border-[#7AAFC4]"
                >
                  {item.variants.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.size}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className={`w-full font-mono text-[10px] tracking-[0.08em] uppercase px-4 py-2.5 rounded-sm transition-all duration-300 ${
            addedId === selectedVariantId
              ? 'bg-[#7AAFC4] text-[#2C2416]'
              : 'bg-[#DDD5C5] text-[#8C7B6B] hover:bg-[#7AAFC4] hover:text-[#2C2416]'
          }`}
        >
          {addedId === selectedVariantId ? '✓ ' + (isEnglish ? 'Added' : '追加完了') : (isEnglish ? 'Add to Cart' : 'カートに追加')}
        </button>
      </div>
    </div>
  );
}
