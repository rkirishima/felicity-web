import Image from 'next/image';

interface BulletinBoardProps {
  photos: string[];   // max 3
  alts: string[];
}

const TILTS = ['rotate-[-2deg]', 'rotate-[1.5deg]', 'rotate-[-1deg]'];
const PINS  = ['top-2 left-1/2 -translate-x-1/2', 'top-2 left-1/2 -translate-x-1/2', 'top-2 left-1/2 -translate-x-1/2'];

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
          {/* pin */}
          <div className={`absolute ${PINS[i]} z-10 w-4 h-4`}>
            <div className="w-4 h-4 rounded-full bg-[#C0392B] shadow-md border border-[#922B21]" />
          </div>
          {/* photo frame */}
          <div className="bg-white p-3 pb-8 shadow-lg">
            <div className="relative w-full overflow-hidden bg-[#DDD5C5]" style={{ paddingBottom: '75%' }}>
              <Image
                src={src}
                alt={alts[i] || ''}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
