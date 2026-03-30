# Felicity Coffee Roasters — Web

Website for [felicity.cafe](https://felicity.cafe) — specialty coffee café in Hayama, Japan.

**Stack:** Next.js 16 · React 19 · Tailwind CSS 4 · TypeScript · Cloudflare Pages (static export)

---

## Project Structure

```
felicity-web/
├── app/
│   ├── globals.css              # Tailwind + brand palette CSS variables
│   ├── layout.tsx               # Root layout, fonts, SEO metadata
│   ├── page.tsx                 # Homepage — product grid
│   ├── lib/
│   │   └── products.ts          # ⚠ Single source of truth for all product data
│   └── products/
│       └── [slug]/
│           └── page.tsx         # Product detail page
├── public/
│   └── images/                  # Product photos (brazil.jpg, ethiopia.jpg, papua.jpg)
├── next.config.ts               # Static export config for Cloudflare Pages
└── ORCHESTRATOR_STATUS.md       # Build status and audit log
```

### Brand Palette

| Token | Hex |
|---|---|
| Off-white (bg) | `#FAFAF8` |
| Beige | `#F0EDE8` |
| Grey (dividers) | `#E8E6E1` |
| Near-black | `#111111` |
| Blue accent (price) | `#7AAFC4` |

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Build

```bash
npm run build
```

Output goes to `out/` (static HTML/CSS/JS). This is what Cloudflare Pages serves.

---

## Deploy to Cloudflare Pages

1. Push to GitHub.
2. In Cloudflare Pages, create a new project connected to this repo.
3. Set build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `out`
   - **Node.js version:** 20+
4. Deploy. No server-side runtime required — fully static.

### Why static export?

`next.config.ts` sets `output: 'export'`. This tells Next.js to pre-render every page to static HTML at build time. Cloudflare Pages serves these files directly from its CDN — no Node.js runtime needed.

`trailingSlash: true` ensures URLs like `/products/brazil-santa-alina/` map to `out/products/brazil-santa-alina/index.html`, which Cloudflare Pages expects.

---

## Adding Products

Edit `app/lib/products.ts` — it is the **single source of truth**. Both the homepage grid and product detail pages read from this file.

```ts
{
  id: 4,
  name: "Colombia El Paraiso",
  slug: "colombia-el-paraiso",          // used in URL: /products/colombia-el-paraiso/
  country: "Colombia",
  process: "Washed",
  roast: "Light",
  gtin: "4595433537xxx",
  weight: "200g",
  price: "¥2,400",
  roastProfile: "...",
  machine: "Probat P05iii",
  image: "/images/colombia.jpg",        // place file in public/images/
}
```
