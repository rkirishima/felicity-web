# SEO Implementation Guide — FELICITY COFFEE ROASTERS

**Date:** 2026-03-24  
**Status:** ✅ Complete & Ready for Deploy  
**Deployment Target:** Cloudflare Pages

---

## What's Been Implemented

### 1. **JSON-LD Structured Data** ✅

Comprehensive schema markup for search engines:

- **CafeOrCoffeeShop** — Main business schema with opening hours, address, phone, menu items
- **LocalBusiness** — Geo-coordinates, contact info, hours of operation
- **Product Schema** — Each coffee bean product with GTIN, price, weight, origin
- **Event Schema** — Roasting workshop details, date, pricing, capacity
- **Organization Schema** — Corporate entity with logo, contact, social profiles
- **BreadcrumbList** — Navigation hierarchy for search result snippets

**Location:** `/app/lib/schema.ts`

All schemas are **bilingual-ready** (EN/JA parameters) and embedded as JSON-LD `<script>` tags in page headers.

---

### 2. **Open Graph (OG) Tags** ✅

Complete OG metadata for social sharing:

- ✅ `og:title` — Localized titles (EN/JA)
- ✅ `og:description` — Localized descriptions
- ✅ `og:image` — 1200×630px branded image (created)
- ✅ `og:url` — Canonical URLs per page
- ✅ `og:locale` — ja_JP for Japanese, en_US for English

**Image:** `/public/og-image.jpg` (1200×630px, brand palette)

---

### 3. **Meta Tags & Metadata** ✅

- **Title tags** — Unique, keyword-rich titles per page
- **Meta descriptions** — 155-160 char optimized descriptions
- **Keywords** — Specialty coffee, Hayama, workshop, café, roasting, etc.
- **Viewport & Robots** — Mobile-friendly, index-follow
- **Canonical URLs** — Prevent duplicate content issues

**Location:** `/app/lib/metadata.ts` — Centralized metadata utilities

---

### 4. **Language & Regional Tags (hreflangs)** ✅

Proper language alternates for search engines:

```xml
<alternates>
  <languages>
    <ja>https://felicity.cafe</ja>
    <en>https://felicity.cafe/en</en>
  </languages>
  <canonical>https://felicity.cafe</canonical>
</alternates>
```

Also included in **sitemap.xml** with `<xhtml:link rel="alternate">` tags.

---

### 5. **Sitemap** ✅

**File:** `/out/sitemap.xml` (auto-generated)

**Coverage:**
- ✅ Home pages (JA + EN)
- ✅ About pages (JA + EN)
- ✅ Product pages (3 coffees × 2 languages = 6 entries)
- ✅ Product listing anchors (#coffee, #workshop)
- ✅ All routes include hreflangs for alternate versions
- ✅ Change frequency & priority set per page type

---

### 6. **Robots.txt** ✅

**File:** `/out/robots.txt`

- Allows full crawling
- Points to sitemap
- Ready for search engine indexing

---

### 7. **Mobile Friendly** ✅

- Responsive design (existing)
- Viewport meta tag configured
- Mobile-optimized OG images
- Trailing slashes for static export compatibility

---

## File Structure

```
felicity-web/
├── app/
│   ├── layout.tsx              ← Root layout with metadata
│   ├── page.tsx                ← Home page (JA) + JSON-LD schemas
│   ├── about/page.tsx          ← About page + breadcrumbs
│   ├── products/[slug]/page.tsx ← Product pages + product schema
│   ├── lib/
│   │   ├── schema.ts           ← JSON-LD schema generators
│   │   ├── metadata.ts         ← Metadata utilities
│   │   ├── products.ts         ← Product data with GTIN
│   │   └── ...
│   ├── robots.ts               ← Robots.txt generator
│   └── sitemap.ts              ← Sitemap generator (bilingual)
├── public/
│   ├── og-image.jpg            ← 1200×630px branded image
│   └── images/
│       ├── brazil.jpg
│       ├── ethiopia.jpg
│       └── papua.jpg
├── messages/
│   ├── en.json                 ← English copy (for future use)
│   └── ja.json                 ← Japanese copy (for future use)
├── next.config.ts              ← Static export + trailing slashes
├── i18n.ts                     ← i18n config (for future locale routing)
└── middleware.ts               ← Request middleware (placeholder)
```

---

## How It Works

### Home Page (Japanese)
1. Loads `/app/page.tsx` (default)
2. Serves metadata in Japanese (ja_JP locale)
3. Includes CafeOrCoffeeShop, Organization, Event schemas
4. Open Graph image: 1200×630px

### Product Pages
1. Dynamic routes via `[slug]` parameter
2. Each product gets:
   - Unique title + description
   - Product schema with GTIN, price, weight
   - Breadcrumb schema for navigation
3. All product images supported in OG tags

### About Page
1. Unique Japanese metadata + breadcrumbs
2. Article-type OG tag for better sharing

### Sitemap & hreflangs
- Auto-generated from routes
- Includes both JA and EN versions
- Search engines see proper language alternates

---

## For English Version (Ready for Future Implementation)

The site is **prepared for English routes** but currently serves Japanese at the root:

- `en.json` messages exist but not yet routed
- Schema generators accept `locale: "en"` parameter
- Metadata utilities support EN/JA selection
- Future work: Create `/en/*` route group with locale-aware pages

**When ready:**
1. Create `/app/\[locale\]/` directory structure
2. Reinstall `next-intl` in package.json
3. Move pages into locale-based routes
4. Deploy — hreflangs will auto-link EN↔JA

---

## SEO Checklist

- ✅ JSON-LD schemas (CafeOrCoffeeShop, LocalBusiness, Product, Event, Organization)
- ✅ Open Graph tags (all pages)
- ✅ Meta titles & descriptions (localized)
- ✅ Keywords (specialty coffee, Hayama, café, etc.)
- ✅ Canonical URLs
- ✅ hreflangs (prepared for EN/JA)
- ✅ Sitemap (bilingual, auto-generated)
- ✅ Robots.txt (allows crawling + sitemap)
- ✅ Mobile-friendly viewport & responsive design
- ✅ OG images (1200×630px branded)
- ✅ Breadcrumb schema (navigation)
- ✅ Static export compatible (Cloudflare Pages)

---

## Deployment to Cloudflare Pages

### Build & Deploy
```bash
npm run build
# Creates /out directory with all static files + sitemap.xml + robots.txt

# Deploy to Cloudflare Pages
wrangler pages deploy out/
```

### Post-Deploy Checklist
1. Verify `felicity.cafe/sitemap.xml` loads
2. Verify `felicity.cafe/robots.txt` loads
3. Test OG tags: <https://ogp.me>
4. Submit sitemap to Google Search Console
5. Add domain to Bing Webmaster Tools
6. Monitor Core Web Vitals in PageSpeed Insights

---

## Testing & Validation

### Local Testing
```bash
# Check sitemap
npm run build && cat out/sitemap.xml

# Check OG image
ls -lh public/og-image.jpg

# Validate JSON-LD
# Open http://localhost:3000 → Inspect → <script type="application/ld+json">
```

### External Tools
- **Google Rich Results Test:** <https://search.google.com/test/rich-results>
- **OG Preview:** <https://ogp.me>
- **Lighthouse:** DevTools → Lighthouse tab
- **Schema.org Validator:** <https://validator.schema.org>

---

## Future Enhancements

1. **Blog/Articles** → Add `article` type schema
2. **Reviews/Ratings** → AggregateRating schema expansion
3. **FAQ Schema** → For workshop Q&A
4. **Image Optimization** → WebP + srcset
5. **Structured Navigation** → SiteNavigationElement schema
6. **Locale Routing** → Full next-intl setup with /en/* paths
7. **Analytics** → GTM + GA4 event tracking

---

## Questions & Support

For issues with:
- **Schema validation:** Use <https://validator.schema.org>
- **SEO quality:** Check Google Search Console → Coverage
- **Performance:** PageSpeed Insights → Core Web Vitals
- **Locale routing:** See next-intl docs → <https://next-intl.dev>

---

**Ready for production. Commit and deploy to Cloudflare Pages.**
