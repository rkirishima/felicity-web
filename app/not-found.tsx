import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ページが見つかりません | FELICITY COFFEE ROASTERS",
  description: "お探しのページが見つかりません。トップページまたはカテゴリに戻ってください。",
  robots: {
    index: false,
  },
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#F4EFE4] flex items-center justify-center">
      <div className="text-center px-6">
        <h1 className="text-6xl md:text-8xl font-bold text-[#2C1810] mb-4">404</h1>
        <p className="text-2xl md:text-3xl font-light text-[#5C4A42] mb-8">
          ページが見つかりません
        </p>
        <p className="text-lg text-[#8B7355] mb-12 max-w-md mx-auto">
          申し訳ありません。お探しのページは移動したか、削除されている可能性があります。
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-8 py-3 bg-[#2C1810] text-white rounded-lg hover:bg-[#1a0f08] transition"
          >
            トップページへ戻る
          </Link>
          <Link
            href="/#coffee"
            className="px-8 py-3 border-2 border-[#2C1810] text-[#2C1810] rounded-lg hover:bg-[#2C1810] hover:text-white transition"
          >
            コーヒー一覧を見る
          </Link>
        </div>

        <div className="mt-16 pt-8 border-t border-[#DDD5C5]">
          <p className="text-sm text-[#8B7355] mb-4">その他のページ：</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/about" className="text-[#2C1810] hover:underline">
              について
            </Link>
            <span className="text-[#DDD5C5]">•</span>
            <Link href="/#workshop" className="text-[#2C1810] hover:underline">
              ワークショップ
            </Link>
            <span className="text-[#DDD5C5]">•</span>
            <Link href="#" className="text-[#2C1810] hover:underline">
              お問い合わせ
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
