"use client";

import { useState, useEffect, useRef } from "react";

const videoData = [
  {
    id: 1,
    title: "Interior & Coffee Prep",
    landscape: "/videos/interior.mp4",
    portrait: "/videos/interior-mobile.mp4",
  },
  {
    id: 2,
    title: "Motorcycle (Triton)",
    landscape: "/videos/motorcycle.mp4",
    portrait: "/videos/motorcycle-mobile.mp4",
  },
  {
    id: 3,
    title: "Coastal Hayama & Food Truck",
    landscape: "/videos/coast.mp4",
    portrait: "/videos/coast-mobile.mp4",
  },
  {
    id: 4,
    title: "Roasting Situation",
    landscape: "/videos/roasting.mp4",
    portrait: "/videos/roasting-mobile.mp4",
  },
];

export default function VideoCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const touchStartXRef = useRef(0);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % videoData.length);
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsPlaying(false);
    setTimeout(() => setIsPlaying(true), 1000);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + videoData.length) % videoData.length);
    setIsPlaying(false);
    setTimeout(() => setIsPlaying(true), 1000);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % videoData.length);
    setIsPlaying(false);
    setTimeout(() => setIsPlaying(true), 1000);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#DDD5C5] overflow-hidden">
      {/* Video container */}
      <div
        className="relative w-full h-full"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {videoData.map((video, idx) => {
          const videoSrc = isMobile ? video.portrait : video.landscape;
          return (
            <div
              key={video.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                idx === currentIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              >
                <source src={videoSrc} type="video/mp4" />
              </video>

            {/* Fallback: grey background with text if video doesn't load */}
            <div className="absolute inset-0 bg-[#DDD5C5] flex items-center justify-center">
              <div className="text-center">
                <p className="text-[#8C7B6B] font-mono text-xs tracking-[0.2em] uppercase">
                  {video.title}
                </p>
              </div>
            </div>
            </div>
          );
        })}
      </div>

      {/* Overlay content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-center">
          <h1 className="text-[clamp(48px,8vw,80px)] font-light text-[#2C2416] tracking-[0.12em] leading-none drop-shadow-lg">
            SPECIALTY COFFEE
          </h1>
          <p className="font-mono text-xs tracking-[0.28em] text-[#7AAFC4] mt-6 uppercase drop-shadow-md">
            Hayama, Japan&nbsp;&nbsp;—&nbsp;&nbsp;Est. 2024
          </p>
        </div>

        {/* Scroll arrow */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <a
            href="#coffee"
            aria-label="Scroll down"
            className="text-[#8C7B6B]/60 hover:text-[#8C7B6B] transition-colors pointer-events-auto"
          >
            <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
              <line x1="8" y1="0" x2="8" y2="18" stroke="currentColor" strokeWidth="1" />
              <polyline points="3,13 8,19 13,13" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
          </a>
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={goToPrevious}
        aria-label="Previous video"
        className="absolute left-8 top-1/2 -translate-y-1/2 z-10 text-[#8C7B6B] hover:text-[#2C2416] transition-colors pointer-events-auto"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <polyline points="15 18 9 12 15 6" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>

      <button
        onClick={goToNext}
        aria-label="Next video"
        className="absolute right-8 top-1/2 -translate-y-1/2 z-10 text-[#8C7B6B] hover:text-[#2C2416] transition-colors pointer-events-auto"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <polyline points="9 18 15 12 9 6" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>

      {/* Dots indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-3">
        {videoData.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`w-2 h-2 rounded-full transition-all pointer-events-auto ${
              idx === currentIndex ? "bg-[#2C2416] w-6" : "bg-[#8C7B6B]/50 hover:bg-[#8C7B6B]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
