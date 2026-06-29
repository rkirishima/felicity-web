import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  images: {
    // Vercel の画像最適化（/_next/image）が無料枠超過で 402 を返し、サイト全体の
    // 画像が表示されなくなったため最適化を無効化。元画像を public からそのまま配信する。
    // 最適化を再び使いたい場合は Vercel を有料プランにして以下を外す。
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
