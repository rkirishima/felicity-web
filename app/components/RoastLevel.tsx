'use client';

interface RoastLevelProps {
  dots: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function RoastLevel({ 
  dots, 
  label, 
  size = 'md',
  showLabel = true 
}: RoastLevelProps) {
  const dotSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const dotSize = dotSizes[size];
  const textSize = textSizes[size];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {/* Three dots: filled or empty */}
        {[1, 2, 3].map((dotNum) => (
          <div
            key={dotNum}
            className={`${dotSize} rounded-full ${
              dotNum <= dots
                ? 'bg-[#2C2416]'
                : 'border border-[#DDD5C5] bg-white'
            } transition-colors`}
          />
        ))}
      </div>
      {showLabel && (
        <p className={`${textSize} font-light text-[#8C7B6B]`}>
          {label}
        </p>
      )}
    </div>
  );
}
