export const metadata = {
  title: "特定商取引法に基づく表記 | Felicity Cafe",
  description: "Felicity Cafeの特定商取引法に基づく表記",
};

export default function Disclosure() {
  return (
    <main className="min-h-screen bg-[#F4EFE4]">
      {/* Header spacer */}
      <div className="h-14" />

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8 py-20">
        <h1 className="text-[clamp(36px,5vw,52px)] font-light text-[#2C2416] mb-12">
          特定商取引法に基づく表記
        </h1>

        <div className="space-y-8 text-[15px] font-light text-[#2C2416] leading-relaxed">
          <section>
            <h2 className="text-[22px] font-light mb-4 text-[#2C2416]">販売業者</h2>
            <p>株式会社FELICITY</p>
          </section>

          <section>
            <h2 className="text-[22px] font-light mb-4 text-[#2C2416]">事業者の名称</h2>
            <p className="mb-4">Felicity Cafe（フェリシティカフェ）</p>
            <div className="space-y-2">
              <p>代表者：桐島象太郎</p>
              <p>住所：〒240-0115 神奈川県三浦郡葉山町上山口2432-3</p>
              <p>TEL：08087584368</p>
              <p>MAIL：info@felicity.cafe</p>
            </div>
          </section>

          <section>
            <h2 className="text-[22px] font-light mb-4 text-[#2C2416]">販売価格について</h2>
            <p>各商品ページをご参照ください。</p>
          </section>

          <section>
            <h2 className="text-[22px] font-light mb-4 text-[#2C2416]">商品以外の必要代金</h2>
            <div className="space-y-2">
              <p>【消費税】10%</p>
              <p>【送料】一律:---</p>
            </div>
          </section>

          <section>
            <h2 className="text-[22px] font-light mb-4 text-[#2C2416]">運送業者について</h2>
            <p>ヤマト運輸株式会社</p>
          </section>

          <section>
            <h2 className="text-[22px] font-light mb-4 text-[#2C2416]">注文方法</h2>
            <div className="space-y-2">
              <p>ご購入いただくには会員登録が必要です。</p>
              <p>会員登録、ログイン後、当サイト上のカートから購入画面へ移動して下さい。</p>
              <p>商品の販売数を限定する場合がございます。 各商品ページにて十分ご確認下さい。</p>
            </div>
          </section>

          <section>
            <h2 className="text-[22px] font-light mb-4 text-[#2C2416]">代金（対価）の支払方法と時期</h2>
            <div className="space-y-2">
              <p>支払方法：クレジットカードによる決済がご利用頂けます。</p>
              <p>支払時期：商品注文確定時でお支払いが確定致します。</p>
              <p>クレジットカード会社からの引き落とし時期に関しては、ご契約のクレジットカード会社にお問い合わせください。</p>
            </div>
          </section>

          <section>
            <h2 className="text-[22px] font-light mb-4 text-[#2C2416]">支払期限 引渡し時期</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-light mb-2">【在庫がある商品】</h3>
                <p>ご注文から7日以内に商品を発送いたします。</p>
              </div>
              <div>
                <h3 className="font-light mb-2">【品切れの場合】</h3>
                <p>ご希望の商品が万一品切れの場合は、その旨ご連絡し、注文をキャンセルさせていただきます。</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[22px] font-light mb-4 text-[#2C2416]">返品・交換について</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-light mb-2">【お客様ご都合の場合】</h3>
                <p className="mb-2">商品に不備がない限り返品、交換は出来ませんのでご了承下さい。</p>
                <p className="mb-2">※ パソコンや携帯端末での閲覧という特性上、商品の画像が実際の色目と多少異なる場合が有りますがご了承ください。</p>
                <p className="mb-2">（画像の色目については当方の不備として扱いません。色などについてもっと詳しく知りたい方はお買い上げ前にお問い合わせください。）</p>
                <p>
                  <a href="mailto:info@felicity.cafe" className="text-[#7AAFC4] hover:text-[#2C2416]">
                    info@felicity.cafe
                  </a>
                </p>
              </div>
              <div>
                <h3 className="font-light mb-2">【当店不備の場合】</h3>
                <p className="mb-2">万が一お届けした商品に欠陥、不具合がございましたら、商品の受領から3日以内に必ず下記までご連絡ください。</p>
                <p className="mb-4">
                  <a href="mailto:info@felicity.cafe" className="text-[#7AAFC4] hover:text-[#2C2416]">
                    info@felicity.cafe
                  </a>
                </p>
                <p className="mb-2">欠陥、不具合があった商品は「Felicity Cafe サポートチーム宛て」に受取人払いの宅配便でお送りください。 在庫がある場合に限り、同じ商品を再発送いたします。 在庫がない場合は配送料、商品代金を含めた購入全金額をご返金いたします。 返品を希望される場合は必ず、info@felicity.cafeよりご連絡をお願いいたします。 当社が指定する方法以外の返品はお受け付けできません。</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
