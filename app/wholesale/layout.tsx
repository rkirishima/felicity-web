// 業販エリアの外枠。noindex はここでは掛けない — /wholesale の公開ページだけは
// 検索に載せたいため。ログインと注文画面は各ページ側で noindex にしている。
export default function WholesaleLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#F4EFE4]">{children}</div>;
}
