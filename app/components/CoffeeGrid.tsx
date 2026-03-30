'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useCart } from '@/app/hooks/useCart';
import { getCoffeeMessages, Locale } from '@/app/lib/translations';
import { RoastLevel } from '@/app/components/RoastLevel';

interface CoffeeBean {
  name: string;
  profile: string[];
  price: string;
  priceYen: number;
  key: string;
}

const COFFEE_BEANS: CoffeeBean[] = [
  {
    name: 'Brazil Santa Alina',
    profile: [
      'Heavy body, low acidity',
      'Hazelnut & dark chocolate',
    ],
    price: '¥1,600',
    priceYen: 1600,
    key: 'brazilSantaAlina',
  },
  {
    name: 'Guatemala Finca Gualvador (Anaerobic)',
    profile: [
      'Anaerobic Natural. Wine-like acidity,',
      'dark berries, syrupy cacao.',
    ],
    price: '¥3,000',
    priceYen: 3000,
    key: 'guatemalaFincaGualvador',
  },
  {
    name: 'Colombia Decaf',
    profile: [
      'Smooth caramel sweetness',
      'Medium body',
      'Caffeine-free',
    ],
    price: '¥2,200',
    priceYen: 2200,
    key: 'colombiaDecaf',
  },
  {
    name: 'Ethiopia Yirgacheffe',
    profile: [
      'High floral aromatics (Jasmine)',
      'Tea-like body',
      'Bright citrus',
    ],
    price: '¥2,400',
    priceYen: 2400,
    key: 'ethiopiaYirgacheffe',
  },
  {
    name: 'Panama Geisha',
    profile: [
      'Ultra-premium variety',
      'Intense bergamot & jasmine',
      'Delicate fruit layers',
    ],
    price: '¥8,500',
    priceYen: 8500,
    key: 'panamaGeisha',
  },
  {
    name: 'Yemen White Camel',
    profile: [
      'Exotic spice notes',
      'Deep earthy tones',
      'Dried fruit undertones',
    ],
    price: '¥3,000',
    priceYen: 3000,
    key: 'yemenWhiteCamel',
  },
  {
    name: 'Papua New Guinea',
    profile: [
      'Wild & syrupy body',
      'Savory edge',
      'Tropical fruit notes',
    ],
    price: '¥2,000',
    priceYen: 2000,
    key: 'papuaNewGuinea',
  },
  {
    name: 'Blue Mountain No. 1',
    profile: [
      'Perfect balance',
      'Mild character',
      'Zero bitterness',
    ],
    price: '¥7,000',
    priceYen: 7000,
    key: 'jamaicaBlueMountain',
  },
  {
    name: 'El Salvador Finca La Fany',
    profile: [
      'Sweet & creamy',
      'Notes of plum',
      'Honeyed chocolate',
    ],
    price: '¥2,000',
    priceYen: 2000,
    key: 'elSalvadorFincaLaFany',
  },
];

// Modal component
function DescriptionModal({ 
  bean, 
  description, 
  onClose,
  isOpen 
}: { 
  bean: CoffeeBean; 
  description: string;
  onClose: () => void;
  isOpen: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[#EDE5D8] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg animate-in scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 md:p-8">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-[24px] font-light text-[#2C2416] leading-tight pr-4">
              {bean.name}
            </h2>
            <button
              onClick={onClose}
              className="text-[#8C7B6B] hover:text-[#2C2416] transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-[17px] font-light text-[#2C2416] leading-relaxed">
              {description}
            </p>
            <div className="pt-4 border-t border-[#DDD5C5]">
              <p className="font-mono text-[12px] tracking-[0.06em] text-[#2C2416]">
                200g{'\u00A0'}{'\u2014'}{'\u00A0'}
                <span className="text-[#7AAFC4] font-semibold">{bean.price}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CoffeeGridProps {
  locale?: Locale;
}

export function CoffeeGrid({ locale = 'ja' }: CoffeeGridProps) {
  const addItem = useCart((state) => state.addItem);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [selectedBean, setSelectedBean] = useState<CoffeeBean | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const coffeeMessages = getCoffeeMessages(locale);

  const handleAddToCart = (bean: CoffeeBean) => {
    const itemId = `coffee-${bean.name.toLowerCase().replace(/\s+/g, '-')}`;
    
    addItem({
      id: itemId,
      name: `${bean.name} 200g`,
      price: bean.priceYen,
      quantity: 1,
    });

    setAddedId(itemId);
    setTimeout(() => setAddedId(null), 1500);
  };

  const handleReadMore = (bean: CoffeeBean) => {
    setSelectedBean(bean);
    setModalOpen(true);
  };

  const getFullDescription = (bean: CoffeeBean) => {
    const beanData = coffeeMessages[bean.key as keyof typeof coffeeMessages] as any;
    return beanData?.description || '';
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#DDD5C5]">
        {COFFEE_BEANS.map((bean) => {
          const itemId = `coffee-${bean.name.toLowerCase().replace(/\s+/g, '-')}`;
          const isAdded = addedId === itemId;
          const fullDescription = getFullDescription(bean);
          
          return (
            <div
              key={bean.name}
              className="group block h-auto overflow-hidden bg-[#EDE5D8] flex flex-col p-6 transition-all duration-300 ease-out hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
            >
              {/* Image placeholder */}
              <div className="w-full h-48 bg-[#DDD5C5] flex items-center justify-center mb-4 relative overflow-hidden rounded-sm">
                <Image
                  src={`/beans-${((COFFEE_BEANS.indexOf(bean) % 8) + 1)}.jpg`}
                  alt={bean.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>

              {/* Info */}
              <div className="flex flex-col justify-between flex-grow">
                <div className="mb-4">
                  <h3 className="text-[18px] font-light text-[#2C2416] leading-snug tracking-tight mb-2">
                    {bean.name}
                  </h3>
                  {/* Roast Level */}
                  <div className="mb-3">
                    {(() => {
                      const beanData = coffeeMessages[bean.key as keyof typeof coffeeMessages] as any;
                      const roastLevel = beanData?.roastLevel;
                      if (roastLevel) {
                        return (
                          <RoastLevel
                            dots={roastLevel.dots}
                            label={roastLevel.label}
                            size="sm"
                            showLabel={true}
                          />
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className="mb-2">
                    {(() => {
                      const beanData = coffeeMessages[bean.key as keyof typeof coffeeMessages] as any;
                      const shortDesc = beanData?.shortDesc || '';
                      return (
                        <p className="font-light text-[14px] text-[#8C7B6B] leading-relaxed">
                          {shortDesc}
                        </p>
                      );
                    })()}
                  </div>
                  {fullDescription && (
                    <button
                      onClick={() => handleReadMore(bean)}
                      className="text-[14px] text-[#7AAFC4] font-light hover:text-[#2C2416] transition-colors mt-2"
                    >
                      Read more →
                    </button>
                  )}
                </div>

                {/* Price */}
                <div className="pt-3 border-t border-[#DDD5C5] mb-4">
                  <p className="font-mono text-[12px] tracking-[0.06em] text-[#2C2416]">
                    200g{'\u00A0'}{'\u2014'}{'\u00A0'}
                    <span className="text-[#7AAFC4] font-semibold">{bean.price}</span>
                  </p>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => handleAddToCart(bean)}
                  className={`w-full font-mono text-[10px] tracking-[0.08em] uppercase px-4 py-2 rounded-sm transition-all duration-300 ${
                    isAdded
                      ? 'bg-[#7AAFC4] text-[#2C2416]'
                      : 'bg-[#DDD5C5] text-[#8C7B6B] hover:bg-[#7AAFC4] hover:text-[#2C2416]'
                  }`}
                >
                  {isAdded ? '✓ Added' : 'Add to Cart'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedBean && (
        <DescriptionModal
          bean={selectedBean}
          description={getFullDescription(selectedBean)}
          onClose={() => {
            setModalOpen(false);
            setSelectedBean(null);
          }}
          isOpen={modalOpen}
        />
      )}
    </>
  );
}
