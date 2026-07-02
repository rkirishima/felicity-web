'use client';

import { useEffect } from 'react';

// Last-resort boundary (covers layout crashes) — full reload after 5s
export default function GlobalError({ error }: { error: Error }) {
  useEffect(() => {
    console.error('KDS fatal crash:', error);
    const timer = setTimeout(() => window.location.reload(), 5_000);
    return () => clearTimeout(timer);
  }, [error]);

  return (
    <html lang="ja">
      <body
        style={{
          background: '#111827',
          color: '#fff',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '3rem', margin: 0 }}>&#9888;</p>
          <p>エラーが発生しました — 5秒後に再起動します…</p>
        </div>
      </body>
    </html>
  );
}
