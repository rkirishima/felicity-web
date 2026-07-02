'use client';

import { useEffect } from 'react';

// Any render crash self-heals: retry after 5s instead of a dead screen
export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error('KDS crash:', error);
    const timer = setTimeout(() => reset(), 5_000);
    return () => clearTimeout(timer);
  }, [error, reset]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <div className="text-center">
        <div className="text-6xl mb-4">&#9888;</div>
        <p className="text-xl mb-2">エラーが発生しました</p>
        <p className="text-gray-400 mb-4">5秒後に自動復帰します…</p>
        <button
          onClick={() => reset()}
          className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-bold"
        >
          今すぐ再読み込み
        </button>
      </div>
    </div>
  );
}
