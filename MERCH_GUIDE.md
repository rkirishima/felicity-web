# Felicity Café Merchandise System — Complete Guide

**Date Updated:** March 27, 2026  
**Status:** ✅ Complete & Ready for Deployment  
**Build Status:** ✅ Successful (0 errors)

---

## Overview

The Felicity Café merchandise system has been updated with **CORRECT INVENTORY** from Square. The system now features:

- ✅ 5 product types with accurate pricing in ¥
- ✅ Variant support (sizes and colors)
- ✅ Professional cart UI with variant display
- ✅ Mobile-responsive design
- ✅ Production-ready

---

## Current Merchandise Inventory

### 1. T-Shirts (¥4,500 each)

| Name | Color | Sizes | Status |
|------|-------|-------|--------|
| Felicity オリジナルTシャツ - Drive Date on Thing | White | M, L, XL | ✅ In Stock |
| オリジナルTシャツ - Peace Biker | White | M, L, XL, XXL | ✅ In Stock |
| オリジナルTシャツ La Motarde | Grey | M, L, XL, XXL | ✅ In Stock |

### 2. Staff Caps (¥3,000 each)

| Name | Color | Size | Status |
|------|-------|------|--------|
| Felicity スタッフキャップ　グレー | Grey | Regular | ✅ In Stock |
| Felicity スタッフキャップ　ブラック | Black | Regular | ✅ In Stock |

### 3. Pullover Hoodie (¥11,000)

| Name | Sizes | Status |
|------|-------|--------|
| Pullover Hoodie | M, L, XL, XXL | ✅ In Stock |

### 4. College Sweatshirt (¥8,000)

| Name | Sizes | Status |
|------|-------|--------|
| College Sweatshirt | M, L, XL, XXL | ✅ In Stock |

### 5. Tumbler (¥3,300)

| Name | Size | Status |
|------|------|--------|
| Tumbler | Regular | ✅ In Stock |

---

## How the System Works

### 1. Product Data Structure

All merchandise is defined in `/app/components/MerchSection.tsx` in the `MERCH_ITEMS` array:

```typescript
const MERCH_ITEMS: MerchProduct[] = [
  {
    id: "tshirt-drive-date",
    name: "Felicity オリジナルTシャツ - Drive Date on Thing",
    basePrice: 4500,
    color: "White",
    sizes: ["M", "L", "XL"],
    variants: [
      { id: "tshirt-drive-date-m", productId: "tshirt-drive-date", basePrice: 4500, color: "White", size: "M" },
      { id: "tshirt-drive-date-l", productId: "tshirt-drive-date", basePrice: 4500, color: "White", size: "L" },
      { id: "tshirt-drive-date-xl", productId: "tshirt-drive-date", basePrice: 4500, color: "White", size: "XL" },
    ],
  },
  // ... more products
];
```

### 2. User Interaction Flow

```
Customer views merch section
    ↓
Selects size/color (if available)
    ↓
Clicks "Add to Cart"
    ↓
Item with variant info added to cart
    ↓
Cart opens automatically
    ↓
Variants displayed (e.g., "Size: M • Color: White")
    ↓
Customer proceeds to checkout
```

### 3. Cart Item with Variants

When a customer adds a product with variants, the cart stores:

```typescript
{
  id: "tshirt-drive-date-m",
  name: "Felicity オリジナルTシャツ - Drive Date on Thing",
  price: 4500,
  quantity: 1,
  variants: [
    { name: "Size", value: "M" }
    { name: "Color", value: "White" }
  ]
}
```

The CartDrawer displays this as: **Size: M • Color: White**

---

## Updating Merchandise

### Add a New Product

1. Open `/app/components/MerchSection.tsx`
2. Add to `MERCH_ITEMS` array:

```typescript
{
  id: "new-product-id",
  name: "Product Name",
  basePrice: 5000, // in ¥
  sizes: ["M", "L", "XL"], // if applicable
  color: "Color Name", // if single color
  colors: ["White", "Black"], // if multiple colors
  variants: [
    { id: "new-product-id-m", productId: "new-product-id", name: "Product Name", basePrice: 5000, size: "M" },
    { id: "new-product-id-l", productId: "new-product-id", name: "Product Name", basePrice: 5000, size: "L" },
    { id: "new-product-id-xl", productId: "new-product-id", name: "Product Name", basePrice: 5000, size: "XL" },
  ],
}
```

3. Save and redeploy

### Update Product Price

1. Change `basePrice` in both product definition and all variants
2. Example (¥4,500 → ¥5,000):

```typescript
{
  id: "tshirt-drive-date",
  basePrice: 5000, // ← Change here
  variants: [
    { id: "tshirt-drive-date-m", basePrice: 5000 }, // ← And here
    // ... etc
  ]
}
```

### Change Available Sizes

1. Update `sizes` array in product definition
2. Update `variants` array to include/remove variants

Example (remove XXL):

```typescript
sizes: ["M", "L", "XL"], // ← Remove "XXL"
variants: [
  { id: "...-m", ... },
  { id: "...-l", ... },
  { id: "...-xl", ... },
  // ← Remove XXL variant
]
```

### Change Available Colors

1. Update `colors` array
2. Add new variants with new color

Example (add Red):

```typescript
colors: ["White", "Black", "Red"],
variants: [
  { id: "cap-white-regular", color: "White", ... },
  { id: "cap-black-regular", color: "Black", ... },
  { id: "cap-red-regular", color: "Red", ... }, // ← New
]
```

---

## UI Components Involved

### 1. MerchSection.tsx (Main merchandise display)
- Displays product grid (1 col mobile, 2 col tablet, 3 col desktop)
- Shows variant selectors (size/color dropdowns)
- "Add to Cart" button with confirmation

### 2. CartContext.tsx (Global state)
- Manages cart items with variant support
- CartItem interface includes `variants?: CartItemVariant[]`

### 3. CartDrawer.tsx (Slide-out cart)
- Displays items with variant info
- Shows quantity controls
- Calculates order summary

### 4. Header.tsx (Fixed header)
- Cart icon with item counter
- Opens/closes CartDrawer

---

## Technical Details

### Variant ID Format

Variants use a structured ID for uniqueness:

```
{product-id}-{size-or-color}

Examples:
- tshirt-drive-date-m
- cap-grey-regular
- hoodie-xxl
- tumbler-regular
```

### Price Calculation

- **Subtotal:** Sum of (item.price × item.quantity)
- **Tax:** Subtotal × 0.1 (10% consumption tax)
- **Total:** Subtotal + Tax

Example:
```
Item 1: ¥4,500 × 1 = ¥4,500
Item 2: ¥11,000 × 1 = ¥11,000
Subtotal: ¥15,500
Tax (10%): ¥1,550
Total: ¥17,050
```

### Cart Persistence

Cart data is stored in React Context (in-memory). It persists while the browser tab is open but clears on page refresh. To add persistent storage:

1. Install `js-cookie` or `localStorage`
2. Update CartContext.tsx to sync with localStorage on change
3. Restore from localStorage on mount

---

## Mobile Responsiveness

### Breakpoints

- **Mobile:** < 768px (1 column grid)
- **Tablet:** 768px - 1024px (2 column grid)
- **Desktop:** > 1024px (3 column grid)

### Touch-friendly UI

- Variant selectors use native `<select>` (better on mobile)
- Buttons have adequate padding (44px minimum height)
- Cart drawer takes full screen width on mobile

---

## Deployment Checklist

- [x] Build succeeds: `npm run build` ✅
- [x] TypeScript: 0 errors ✅
- [x] Merchandise data accurate ✅
- [x] Variant system working ✅
- [x] Mobile responsive ✅
- [x] No console errors ✅

### To Deploy:

```bash
cd /Users/doug/Projects/felicity-web
npm run build
# Verify no errors
git add .
git commit -m "Update: CORRECT merchandise inventory with variant support"
git push
# Cloudflare Pages auto-deploys
```

---

## Common Tasks

### Check Order Status (in Square Dashboard)
1. Go to https://squareup.com/dashboard/
2. Navigate to **Orders**
3. Filter by date or customer

### Add New Size to Existing Product
1. Edit MerchSection.tsx
2. Add size to `sizes` array
3. Add new variant to `variants` array with unique ID

### Temporarily Disable a Product
1. Delete from `MERCH_ITEMS` array
2. Redeploy

### Check Cart in Development
```bash
npm run dev
# Open http://localhost:3000
# Click "Add to Cart"
# Cart should open automatically
```

---

## Files Modified

| File | Changes | Status |
|------|---------|--------|
| `app/context/CartContext.tsx` | Added variant support | ✅ Updated |
| `app/components/CartDrawer.tsx` | Display variant info | ✅ Updated |
| `app/components/MerchSection.tsx` | Complete rewrite with correct products | ✅ Replaced |

---

## Support & Troubleshooting

### "Add to Cart" not working
- Check browser console for errors
- Verify MerchSection.tsx syntax
- Clear browser cache and reload

### Cart not opening automatically
- Check CartContext.tsx `openCart()` is called
- Verify CartDrawer is imported in layout.tsx

### Variants not displaying
- Check CartItem has `variants` property populated
- Verify CartDrawer renders variant display

### Price incorrect
- Check all variant `basePrice` values
- Verify tax calculation (10%)

---

## Summary

✅ **Complete merchandise system with:**
- 5 product types (T-Shirts, Caps, Hoodie, Sweatshirt, Tumbler)
- Accurate pricing in JPY (¥)
- Variant support (sizes and colors)
- Professional UI/UX
- Mobile responsive
- Production ready

**Next Step:** Deploy to Cloudflare Pages (see Deployment Checklist)

---

**Report:** Merchandise system is ready for production.  
**Build Status:** ✅ Successful  
**Ready to Deploy:** Yes  

Contact: rowly@felicity.cafe
