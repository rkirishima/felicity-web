# Merchandise Management — Quick Reference

**File to Edit:** `/app/components/MerchSection.tsx`  
**Section:** `MERCH_ITEMS` array (lines 20-150)

---

## 📋 Current Inventory (March 27, 2026)

```
T-Shirts (¥4,500):
  - Drive Date on Thing (White) — M, L, XL
  - Peace Biker (White) — M, L, XL, XXL
  - La Motarde (Grey) — M, L, XL, XXL

Caps (¥3,000):
  - Grey — Regular only
  - Black — Regular only

Hoodie (¥11,000):
  - Sizes: M, L, XL, XXL

Sweatshirt (¥8,000):
  - Sizes: M, L, XL, XXL

Tumbler (¥3,300):
  - One size: Regular
```

---

## ✏️ How to Update

### Update a Price

Find the product in `MERCH_ITEMS`:

```typescript
// BEFORE
basePrice: 4500,

// AFTER (e.g., change to ¥5,000)
basePrice: 5000,
```

**Important:** Change both the product `basePrice` AND all variant `basePrice` values.

### Add a New Product

Copy this template and add to `MERCH_ITEMS`:

```typescript
{
  id: "product-id", // lowercase, hyphens only
  name: "Product Display Name",
  basePrice: 5000, // in ¥
  sizes: ["M", "L", "XL"], // optional, only if has size variants
  colors: ["White", "Black"], // optional, only if has color variants
  variants: [
    { id: "product-id-m", productId: "product-id", name: "Product Display Name", basePrice: 5000, size: "M" },
    { id: "product-id-l", productId: "product-id", name: "Product Display Name", basePrice: 5000, size: "L" },
    { id: "product-id-xl", productId: "product-id", name: "Product Display Name", basePrice: 5000, size: "XL" },
  ],
}
```

### Remove a Product

Find the product block and delete it. Example (remove Peace Biker T-Shirt):

```typescript
// DELETE THIS ENTIRE BLOCK:
{
  id: "tshirt-peace-biker",
  name: "オリジナルTシャツ - Peace Biker",
  // ... rest of definition
}
```

### Change Product Name

Find and update the `name` field:

```typescript
// BEFORE
name: "Old Name",

// AFTER
name: "New Name",
```

**Note:** Also update in all variant definitions.

### Add a Size to Existing Product

1. Add size to `sizes` array:
   ```typescript
   sizes: ["M", "L", "XL", "XXXL"],
   ```

2. Add variant definition:
   ```typescript
   { id: "hoodie-xxxl", productId: "hoodie", name: "Pullover Hoodie", basePrice: 11000, size: "XXXL" },
   ```

### Change a Color Name

1. Update `colors` array
2. Update variant definitions

Example (Grey → Charcoal):

```typescript
// BEFORE
colors: ["Grey", "Black"],
variants: [
  { id: "cap-grey-regular", color: "Grey", ... },
  { id: "cap-black-regular", color: "Black", ... },
]

// AFTER
colors: ["Charcoal", "Black"],
variants: [
  { id: "cap-charcoal-regular", color: "Charcoal", ... },
  { id: "cap-black-regular", color: "Black", ... },
]
```

---

## 🏗️ Product Structure

### Simple Product (No Variants)

```typescript
{
  id: "tumbler",
  name: "Tumbler",
  basePrice: 3300,
  variants: [
    { id: "tumbler-regular", productId: "tumbler", name: "Tumbler", basePrice: 3300, size: "Regular" },
  ],
}
```

### Product with Sizes Only

```typescript
{
  id: "hoodie",
  name: "Pullover Hoodie",
  basePrice: 11000,
  sizes: ["M", "L", "XL", "XXL"],
  variants: [
    { id: "hoodie-m", productId: "hoodie", name: "Pullover Hoodie", basePrice: 11000, size: "M" },
    { id: "hoodie-l", productId: "hoodie", name: "Pullover Hoodie", basePrice: 11000, size: "L" },
    // ... etc
  ],
}
```

### Product with Color Only

```typescript
{
  id: "cap-grey",
  name: "Felicity スタッフキャップ　グレー",
  basePrice: 3000,
  color: "Grey",
  variants: [
    { id: "cap-grey-regular", productId: "cap-grey", name: "Felicity スタッフキャップ　グレー", basePrice: 3000, color: "Grey", size: "Regular" },
  ],
}
```

### Product with Sizes & Colors

```typescript
{
  id: "tshirt-drive-date",
  name: "Felicity オリジナルTシャツ - Drive Date on Thing",
  basePrice: 4500,
  color: "White",
  sizes: ["M", "L", "XL"],
  variants: [
    { id: "tshirt-drive-date-m", productId: "tshirt-drive-date", name: "...", basePrice: 4500, color: "White", size: "M" },
    { id: "tshirt-drive-date-l", productId: "tshirt-drive-date", name: "...", basePrice: 4500, color: "White", size: "L" },
    { id: "tshirt-drive-date-xl", productId: "tshirt-drive-date", name: "...", basePrice: 4500, color: "White", size: "XL" },
  ],
}
```

---

## ✅ Checklist After Changes

- [ ] All `id` values are unique and lowercase
- [ ] All `productId` values match the parent product `id`
- [ ] All variant `basePrice` values match the product `basePrice`
- [ ] `sizes` array (if present) matches variant definitions
- [ ] `colors` array (if present) matches variant definitions
- [ ] No missing comma between products
- [ ] No syntax errors (check `npm run build`)

---

## 🚀 After Editing

```bash
# 1. Save the file

# 2. Test locally
npm run dev
# Open http://localhost:3000
# Check merchandise section looks right

# 3. Build to check for errors
npm run build

# 4. If successful, deploy
git add app/components/MerchSection.tsx
git commit -m "Update: [describe what changed]"
git push
# Cloudflare Pages auto-deploys within 1 minute
```

---

## 🔍 Verify Changes

### Check TypeScript Compilation

```bash
npm run build
# Should see: "✓ Compiled successfully"
# Should see: "✓ Generating static pages..."
```

### Check Locally

```bash
npm run dev
# Visit http://localhost:3000
# Scroll to "Apparel & Goods" section
# Add items to cart
# Verify variants display correctly
```

---

## 🐛 Common Mistakes

| Mistake | Problem | Solution |
|---------|---------|----------|
| Typo in `id` | Build passes but product doesn't show | Double-check all `id` values are unique |
| Missing comma | Build fails | Add `,` after each product object |
| `productId` mismatch | Variants don't link correctly | Ensure `productId` matches parent `id` |
| Price mismatch | Cart shows wrong price | Update all variant `basePrice` values |
| Missing variant | Size/color selector broken | Add all variants to `variants` array |

---

## 📞 Questions?

Refer to `MERCH_GUIDE.md` for detailed documentation.

---

**Last Updated:** March 27, 2026  
**Status:** Ready to maintain
