"use client";

export default function MapEmbed() {
  const latitude = 35.2791;
  const longitude = 139.5812;

  return (
    <div className="h-64 bg-[#DDD5C5] overflow-hidden relative">
      {/* Embed via Google Maps iframe */}
      <iframe
        src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3257.0890840892826!2d${longitude}!3d${latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6018fe79cf21cd7d%3A0x1234567890!2sFelicity%20Coffee%20Roasters!5e0!3m2!1sen!2sjp!4v1234567890`}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
