const videos = [
  { id: 1, landscape: "/videos/interior.mp4", portrait: "/videos/interior-mobile.mp4" },
  { id: 2, landscape: "/videos/motorcycle.mp4", portrait: "/videos/motorcycle-mobile.mp4" },
  { id: 3, landscape: "/videos/roasting.mp4", portrait: "/videos/roasting-mobile.mp4" },
];

export default function HeroCarousel() {
  return (
    <div className="absolute inset-0 w-full h-full z-50 overflow-hidden">
      {videos.map((video, idx) => (
        <div
          key={video.id}
          className="absolute inset-0 w-full h-full"
          style={{
            animation: `carousel 15s infinite linear`,
            animationDelay: `${idx * 5}s`,
          }}
        >
          {/* Desktop */}
          <video
            autoPlay
            muted
            loop
            playsInline
            className="hidden md:block w-full h-full object-cover"
          >
            <source src={video.landscape} type="video/mp4" />
          </video>

          {/* Mobile */}
          <video
            autoPlay
            muted
            loop
            playsInline
            className="md:hidden w-full h-full object-cover"
          >
            <source src={video.portrait} type="video/mp4" />
          </video>
        </div>
      ))}

      <style>{`
        @keyframes carousel {
          0% { opacity: 1; }
          33.33% { opacity: 1; }
          33.34% { opacity: 0; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
