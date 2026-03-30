# Shopping Cart — Quick Reference for Rowly

## TL;DR — What Was Built

✅ **Shopping cart** — Add items, adjust quantities, see totals
✅ **Cart drawer** — Slides out from right side (like a modal)
✅ **Checkout page** — Order form with Square payment integration
✅ **Order confirmation** — Shows order ID and thank you message
✅ **Cart icon** — In header with item counter badge

## Deploy This (3 Steps)

### 1. Get Square Credentials
1. Go to https://developer.squareup.com/apps
2. Sign in or create account
3. Click your app (or create one)
4. Copy these three values:
   - **Application ID** (starts with `sq0...`)
   - **Location ID** (long string)
   - **Access Token** (for production only)

### 2. Set Environment Variables
Create `.env.local` in project root:
```env
NEXT_PUBLIC_SQUARE_APP_ID=sq0atp-xxxxx
NEXT_PUBLIC_SQUARE_LOCATION_ID=xxxxx
```

For production (later):
```env
SQUARE_ACCESS_TOKEN=xxxxx
```

### 3. Deploy
```bash
npm run build
# Output ready for Cloudflare Pages
```

On Cloudflare Pages dashboard:
- Add the same env vars
- Trigger redeploy
- Done ✓

## Update Merch Items (2 Steps)

### 1. Edit the Items
Open: `/app/components/MerchSection.tsx`

Find this:
```typescript
const MERCH_ITEMS = [
  { id: "hoodie", name: "Hoodie", price: 12000 },
  { id: "coverall", name: "Coverall", price: 18000 },
  { id: "cap", name: "Cap", price: 6000 },
  { id: "tote", name: "Tote", price: 3500 },
];
```

Add/edit items:
```typescript
const MERCH_ITEMS = [
  { id: "hoodie", name: "Hoodie", price: 12000 },
  { id: "coverall", name: "Coverall", price: 18000 },
  { id: "cap", name: "Cap", price: 6000 },
  { id: "tote", name: "Tote", price: 3500 },
  { id: "jacket", name: "Bomber Jacket", price: 24000 }, // 👈 New item
];
```

### 2. Rebuild & Deploy
```bash
npm run build && npm run deploy
```

That's it. New items appear on the site.

## Files You Might Need

| File | What It Does | When to Edit |
|------|-------------|--------------|
| `MerchSection.tsx` | Shows merch items & "Add to Cart" buttons | Change items, prices, names |
| `CartContext.tsx` | Cart state & logic | Change how cart works (rare) |
| `CartDrawer.tsx` | The cart popup | Change colors, layout, wording |
| `CheckoutForm.tsx` | Payment form | Add fields (email, address, etc.) |
| `checkout/page.tsx` | Order confirmation | Change confirmation message |

## How It Works (30 Second Version)

1. **User clicks "Add to Cart"** → Item added to CartContext (global state)
2. **Cart icon updates** with item count badge
3. **User clicks cart icon** → CartDrawer slides out (right side)
4. **User adjusts quantities or removes items** → CartContext updates
5. **User clicks "Proceed to Checkout"** → Redirects to `/checkout`
6. **User enters email & card details** → Square Web Payments SDK handles it
7. **User clicks "Pay"** → Nonce sent to `/api/process-payment`
8. **Order confirmed** → Shows confirmation page with order ID

## Test It Locally

```bash
npm run dev
# Open http://localhost:3000
# Click "Add to Cart" on any item
# Click cart icon (top right)
# Click "Proceed to Checkout"
# Use test card: 4532 0151 3761 0002
# Expiry & CVV: Any future date + any 3 digits
```

## Pricing Notes

- **All prices in JPY (¥)**
- **Tax: 10%** (Japan consumption tax)
- **Total = Subtotal + (Subtotal × 0.1)**

To change tax rate, edit:
- `CartDrawer.tsx` line ~50: `const tax = Math.round(subtotal * 0.1);`
- `CheckoutForm.tsx` line ~150: `const tax = Math.round(subtotal * 0.1);`

Change `0.1` to your desired rate (e.g., `0.08` for 8%).

## Common Questions

### Q: How do I see past orders?
**A:** Currently not implemented. Would need a database (Firebase, Postgres, etc.) to store orders. Orders are only shown in Square Dashboard.

### Q: Can I add discount codes?
**A:** Not implemented. Would need to add a discount field to CheckoutForm and update total calculations.

### Q: What about shipping?
**A:** Not implemented. Could add shipping address input to checkout form and calculate shipping cost based on location.

### Q: Can customers create accounts?
**A:** Not implemented. Currently checkout is anonymous. Could add auth (NextAuth.js, Supabase) for order history.

### Q: Why does the Square form look generic?
**A:** Square's Web Payments SDK auto-styles the card form. It's intentional (works on all browsers). You can add custom CSS if needed.

### Q: Can I see payments in real-time?
**A:** Yes, in Square Dashboard → Payments. All transactions show up there automatically.

## Troubleshooting

### Cart not opening?
- Check browser console (F12) for errors
- Make sure you're using a modern browser
- Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

### Payment form not loading?
- Check that `.env.local` has `NEXT_PUBLIC_SQUARE_APP_ID`
- Check that app ID is correct (should start with `sq0atp-`)
- Try incognito/private browser window

### Build fails?
```bash
npm install  # Re-install packages
npm run build # Try again
```

### Prices show as `NaN`?
- Check that prices in `MerchSection.tsx` are numbers (not strings)
- Should be: `price: 12000` not `price: "12000"`

## What's NOT Included (Optional Add-Ons)

- ❌ Order database (orders only stored in Square)
- ❌ Email confirmations (could add SendGrid)
- ❌ Order tracking page (could add database)
- ❌ Shipping calculator (could integrate with shipping API)
- ❌ Inventory management (could add database)
- ❌ Admin dashboard (could build with Next.js admin page)
- ❌ Apple Pay / Google Pay (Square supports, not set up yet)

All of these can be added later without breaking the current system.

## Files Modified or Created

```
✨ NEW:
  app/api/process-payment/route.ts
  app/components/CartDrawer.tsx
  app/components/CheckoutForm.tsx
  app/components/Header.tsx
  app/components/MerchSection.tsx
  app/context/CartContext.tsx
  app/hooks/useCart.ts
  app/checkout/page.tsx
  app/providers.tsx
  .env.example
  SHOPPING_CART_SETUP.md
  CART_IMPLEMENTATION_SUMMARY.md
  CART_QUICK_REFERENCE.md

✏️ MODIFIED:
  app/layout.tsx (added providers & CartDrawer)
  app/page.tsx (uses new Header & MerchSection)
  package.json (added square dependency)
```

## Support

For detailed info, see:
- **SHOPPING_CART_SETUP.md** — Full setup guide + production notes
- **CART_IMPLEMENTATION_SUMMARY.md** — What was built + architecture

Questions? Check the docs first. If stuck, check browser console and server logs.

---

**Status:** Ready to deploy  
**Test cards:** 4532 0151 3761 0002 (any future expiry, any CVV)  
**Production:** Switch to prod Square credentials in `.env.local`
