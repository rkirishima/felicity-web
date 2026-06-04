# Felicity — Search Visibility & Google Maps Growth Playbook

**Goal:** more organic impressions for felicity.cafe + higher Google Maps (local) ranking.
**Last updated:** 2026-06-04

Local ranking (Maps) and organic ranking (web search) are two different games. This
covers both. Items are ordered by impact-per-effort.

---

## ✅ Already done in code (2026-06-04) — just needs a deploy

These shipped to the repo and were verified with a production build:

1. **Fixed the business JSON-LD** (`app/components/StructuredData.tsx`) — it was the only
   schema Google actually rendered, and it had **wrong hours, a fake phone
   (`+81-90-XXXX-XXXX`), wrong postal code (240-0112), wrong email, and geo ~12 km off.**
   Conflicting NAP/hours between your site and your profile actively suppresses local ranking.
   Now a clean `CafeOrCoffeeShop`/`LocalBusiness` graph with correct address, geo, hours.
2. **Updated hours everywhere** to the June schedule (Mon–Fri 11–17, Sat/Sun & holidays 9–17)
   across: contact page (JA + EN), JSON-LD, schema lib, and the AI chatbot's system prompt.
3. **News is now a real blog.** Each article gets its own indexable URL
   (`/news/<slug>` + `/en/news/<slug>`) with unique title/description, `NewsArticle` +
   `BreadcrumbList` structured data, OG tags, hreflang, and sitemap entries. Previously every
   article lived on one page and could only rank as a single URL.

**→ Deploy:** `git push` (Vercel auto-deploys). Then validate at
<https://search.google.com/test/rich-results> with `https://felicity.cafe` and one article URL.

### ⚠️ Values to confirm
- **Geo coordinates.** ✅ Confirmed `35.26735426386272, 139.61026716170105` (2026-06-04).
- **Phone.** ✅ Set to `080-8758-4368` (E.164 `+81-80-8758-4368`) site-wide (2026-06-04).
  **→ Make sure GBP shows this exact same number** for NAP consistency.
- **Postal code.** Standardized to **240-0115** (matches your live contact page + chatbot).
  The old schema said 240-0112. Confirm which is correct on the physical mail.

---

## 1. Google Search Console — do this first (measures impressions)

You cannot grow impressions you can't see. GSC is the source of truth (Google Analytics shows
visits, not search impressions).

- [ ] Add & verify the `felicity.cafe` property at <https://search.google.com/search-console>
      (DNS verification is easiest — add the TXT record at your domain registrar).
- [ ] Submit the sitemap: `https://felicity.cafe/sitemap.xml`.
- [ ] Use **Performance → Queries** to see what you already rank for, and **Pages** to see which
      URLs get impressions. This tells you which content to double down on.
- [ ] Check **Indexing → Pages** to confirm the new `/news/*` URLs get indexed.
- You already have `NEXT_PUBLIC_GA_ID` wired, so GA4 is presumably live for traffic; pair it with GSC for the full picture.

---

## 2. Google Business Profile (the #1 lever for Maps ranking)

Ranking = Relevance × Distance × Prominence. You control Relevance and Prominence.

### Categories (biggest relevance signal)
- **Primary:** `コーヒー店` (Coffee shop) — highest "near me" search volume.
- **Secondary (add all that fit):** `カフェ`, `コーヒー豆販売店`, `エスプレッソバー`, `喫茶店`.
  (A roastery category exists too — add it; lower volume but low competition.)

### Hours — update to the June schedule
- Mon–Fri: 11:00–17:00
- Sat, Sun: 09:00–17:00
- **Set "Holiday hours" → 09:00–17:00** for each upcoming Japanese national holiday
  (祝日). GBP needs these set individually; otherwise it shows "hours may differ".

### Complete every field
- [ ] Business description (≤750 chars). Draft below — paste & tweak.
- [ ] Products: add your coffee lineup with photo + price (mirrors your site products).
- [ ] Services / attributes: dine-in, takeout, parking (you have 2 + 8 free spaces),
      cashless (Credit/IC/PayPay), Wi-Fi, etc.
- [ ] Opening date, service area (葉山町, 逗子市).

**Description draft (JA):**
> 神奈川県葉山町の自家焙煎スペシャルティコーヒー専門店「FELICITY COFFEE ROASTERS」。
> エチオピア、パナマゲイシャ、グアテマラなど世界各地のシングルオリジン豆を、産地ごとの個性を
> 丁寧に引き出して焙煎しています。店頭ではハンドドリップやエスプレッソを、オンラインでは焙煎したての
> コーヒー豆を全国へ発送。焙煎ワークショップも開催。葉山・逗子エリアでスペシャルティコーヒーを
> お探しの方はぜひお立ち寄りください。駐車場あり・キャッシュレス対応。

### Reviews (the single strongest prominence signal)
- Volume + recency + your replies all matter.
- [ ] Get your **review short link**: GBP dashboard → "Ask for reviews" → copy the
      `g.page/r/...` link (or build `https://search.google.com/local/writereview?placeid=PLACE_ID`).
- [ ] Print it as a QR on receipts. Your Pi print server already prints receipts — I can add the
      QR to the label template once you give me the review link (it needs your Place ID, which
      requires dashboard access). Just say the word.
- [ ] Reply to **every** review within a day or two, working in natural keywords
      ("葉山の自家焙煎コーヒー", origin names). Google reads replies.

### Google Posts + Photos (freshness = active profile = ranking)
- Post weekly (new beans, workshop dates, holiday hours, food-truck locations).
- Upload fresh photos weekly (interior, drinks, beans, roasting, staff).

---

## 3. Content engine — the #1 lever for *organic* impressions

You now have a working blog. Each new article = a new URL that can rank for a new query.
Add articles in `app/lib/news.ts` (fill all bilingual fields incl. `published` ISO date);
the detail page, sitemap entry, and schema are generated automatically.

**High-intent topics to write (each targets real searches):**
- Local intent: 「葉山 カフェ」「葉山 コーヒー豆」「逗子 カフェ おすすめ」「葉山 テイクアウト コーヒー」
- Informational (evergreen, high volume): 「コーヒー豆 保存方法」「ハンドドリップ 淹れ方」
  「スペシャルティコーヒーとは」「浅煎り 深煎り 違い」
- Origin stories: one article per origin you sell (Ethiopia Yirgacheffe, Panama Geisha,
  Guatemala…) — these double as product-page support content.
- Experience/event: roasting workshop recaps, food-truck schedule & locations.

**Also strengthen what exists:**
- Product pages: add tasting notes, brew recommendations, origin background (thin pages rank poorly).
- Internal links: link articles → related products and vice-versa.
- The EN site is live (`/en`) — it can capture English "Hayama coffee" / tourist searches; keep EN content in sync.

---

## 4. Off-site (citations & authority)

- **NAP consistency everywhere** — name/address/(phone)/hours byte-identical on GBP, the site,
  Instagram, 食べログ, Retty, Google Maps. Inconsistency suppresses local ranking.
- Get listed on: 食べログ, Retty, Hayama/Zushi tourism sites, local coffee directories.
- Earn backlinks: local press, coffee blogs, suppliers (アタカ通商), wholesale partners (旭興産),
  event/market organizers where the food truck appears.
- Keep Instagram (@felicity_hayama) linked both ways with the site and GBP.

---

## Quick weekly routine (≈30 min)
1. 1 Google Post.
2. Reply to any new reviews; ask 2–3 happy customers for one.
3. Upload 2–3 fresh photos to GBP.
4. Every 1–2 weeks: publish one article from the topic list.
5. Monthly: check GSC Queries/Pages, write more about what's gaining impressions.
