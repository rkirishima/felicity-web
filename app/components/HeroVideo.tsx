export default function HeroVideo() {
  return (
    <div className="absolute inset-0 w-full h-full z-0">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover"
      >
        <source src="/videos/interior.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
