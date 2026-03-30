'use client';

import { ApparelCard } from './ApparelCard';

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
  images: string[];
  variants: ApparelVariant[];
}

interface MerchSectionProps {
  language?: 'en' | 'ja';
  apparel?: {
    tshirts?: ApparelItem[];
    caps?: ApparelItem[];
    hoodie?: ApparelItem;
    sweatshirt?: ApparelItem;
    beanie?: ApparelItem;
    tumbler?: ApparelItem;
  };
}

export function MerchSection({ language = 'en', apparel }: MerchSectionProps) {
  // Flatten apparel items from nested structure
  const allItems: ApparelItem[] = [];
  
  if (apparel) {
    if (apparel.tshirts) allItems.push(...apparel.tshirts);
    if (apparel.caps) allItems.push(...apparel.caps);
    if (apparel.hoodie) allItems.push(apparel.hoodie);
    if (apparel.sweatshirt) allItems.push(apparel.sweatshirt);
    if (apparel.beanie) allItems.push(apparel.beanie);
    if (apparel.tumbler) allItems.push(apparel.tumbler);
  }

  return (
    <section id="merch" className="bg-[#F4EFE4] pt-20 pb-24">
      <div className="max-w-6xl mx-auto px-8">
        <p className="font-mono text-[10px] tracking-[0.3em] text-[#7AAFC4] uppercase mb-12">
          {language === 'en' ? 'Apparel' : 'アパレル'}
        </p>

        <h2 className="text-[clamp(36px,5vw,52px)] font-light text-[#2C2416] leading-tight mb-16">
          {language === 'en' ? 'Apparel & Goods' : 'アパレル・グッズ'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {allItems.map((item) => (
            <ApparelCard
              key={item.id}
              item={item}
              language={language}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
