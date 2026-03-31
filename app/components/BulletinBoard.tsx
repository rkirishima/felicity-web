import Image from 'next/image';

interface BulletinBoardProps {
  photos: string[];
  alts: string[];
}

const TILTS = ['rotate-[-2deg]', 'rotate-[1.5deg]', 'rotate-[-1deg]'];

export function BulletinBoard({ photos, alts }: BulletinBoardProps) {
  const capped = photos.slice(0, 3);
  const colClass =
    capped.length === 1 ? 'flex justify-center' :
    capped.length === 2 ? 'grid grid-cols-2 gap-6' :
                          'grid grid-cols-3 gap-4';

  return (
    <div className={colClass}>
      {capped.map((src, i) => (
        <div
          key={src}
          className={`relative ${TILTS[i % TILTS.length]} transition-transform hover:rotate-0 hover:scale-105 duration-300`}
          style={{ maxWidth: capped.length === 1 ? 420 : undefined }}
        >
          {/* masking tape */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-12 h-5 bg-[#DDD5C5]/80 opacity-80" 
               style={{ transform: `translateX(-50%) rotate(${i % 2 === 0 ? '-1deg' : '2deg'})` }} />
          {/* photo frame */}
          <div className="bg-white p-3 pb-8 shadow-md">
            <div className="relative w-full overflow-hidden bg-[#DDD5C5]" style={{ paddingBottom: '100%' }}>
              <Image src={src} alt={alts[i] || ''} fill className="object-cover" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
