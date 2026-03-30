# Felicity Café Shopping Cart & Checkout Setup

## Overview

The shopping cart system is built with:
- **React Context** for cart state management
- **Next.js 16** app directory for routing
- **Tailwind CSS 4** for styling
- **Square Web Payments SDK** for secure payment processing
- **PCI Compliant:** Card data is handled entirely by Square, never stored on our servers

## Architecture

### Components

1. **CartContext.tsx** — Global state management for the cart
   - Manages items, quantities, and cart visibility
   - Provides hooks for adding/removing items
   - Handles cart totals and item counts

2. **CartDrawer.tsx** — Slide-out cart UI (right side)
   - Displays items with quantity controls
   - Shows order summary (subtotal, tax, total)
   - "Proceed to Checkout" button

3. **CheckoutForm.tsx** — Square Web Payments SDK integration
   - Embedded card form (no iframes needed)
   - Order summary sidebar
   - Email input for order confirmation
   - Handles payment nonce generation

4. **MerchSection.tsx** — Merchandise display with Add to Cart buttons
   - 4 items grid (Hoodie, Coverall, Cap, Tote)
   - Add to Cart buttons with visual feedback
   - Prices in JPY

5. **Header.tsx** — Updated header with cart icon
   - Shopping cart icon with item counter badge
   - Opens cart drawer when clicked

### Files Structure

```
/app
  /api
    /process-payment
      route.ts           # Payment API endpoint
  /components
    CartDrawer.tsx       # Cart UI component
    CheckoutForm.tsx     # Square payment form
    Header.tsx           # Header with cart icon
    MerchSection.tsx     # Merchandise section
  /context
    CartContext.tsx      # Cart state context
  /hooks
    useCart.ts           # Custom hook for cart access
  /checkout
    page.tsx             # Checkout & confirmation page
  providers.tsx          # Context providers wrapper
  layout.tsx             # Root layout (updated with providers)
  page.tsx               # Home page (updated to use Header)
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

The `square` package is already in package.json.

### 2. Configure Square

#### Get Square Credentials

1. Go to [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Sign in or create a Square account
3. Select your application (or create a new one)
4. In the Credentials section:
   - Copy your **Application ID** (live or sandbox)
   - Copy your **Location ID**
   - Copy your **Access Token** (for server-side payments)

#### Add Environment Variables

1. Create a `.env.local` file in the root of the project:

```bash
cp .env.example .env.local
```

2. Fill in your Square credentials:

```env
NEXT_PUBLIC_SQUARE_APP_ID=sq0atp-your-app-id-here
NEXT_PUBLIC_SQUARE_LOCATION_ID=your-location-id-here
SQUARE_ACCESS_TOKEN=your_access_token_here
```

**Note:** 
- `NEXT_PUBLIC_*` variables are exposed to the browser (used by Web Payments SDK)
- Other variables are server-only and safe for secrets
- Never commit `.env.local` to git (already in .gitignore)

### 3. Update Merchandise Items (For Rowly)

Merchandise items are defined in `app/components/MerchSection.tsx`:

```typescript
const MERCH_ITEMS = [
  { id: "hoodie", name: "Hoodie", price: 12000 },
  { id: "coverall", name: "Coverall", price: 18000 },
  { id: "cap", name: "Cap", price: 6000 },
  { id: "tote", name: "Tote", price: 3500 },
];
```

To add, remove, or change items:
1. Edit the `MERCH_ITEMS` array
2. Update the `id` (used internally), `name` (displayed), and `price` (in JPY)
3. Save and redeploy

Example: Adding a new item

```typescript
const MERCH_ITEMS = [
  { id: "hoodie", name: "Hoodie", price: 12000 },
  { id: "coverall", name: "Coverall", price: 18000 },
  { id: "cap", name: "Cap", price: 6000 },
  { id: "tote", name: "Tote", price: 3500 },
  { id: "jacket", name: "Bomber Jacket", price: 24000 }, // New item
];
```

## Usage Guide

### For Customers

1. **Browse Merch:** Scroll to the "Apparel & Goods" section
2. **Add to Cart:** Click "Add to Cart" on any item
   - Cart drawer opens automatically
   - Item counter updates in header
3. **Adjust Quantities:** Use +/− buttons in cart
4. **Proceed to Checkout:** Click the button in the cart drawer
5. **Fill Order Form:**
   - Enter email address
   - Enter card details in the embedded form
   - Click "Pay" to complete purchase
6. **Confirmation:** Order confirmation page shows order ID
   - Email confirmation sent immediately

### For Developers

#### Adding to Cart (In Components)

```typescript
import { useCart } from "@/app/hooks/useCart";

export function MyComponent() {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem({
      id: "item-id",
      name: "Item Name",
      price: 5000, // in JPY
    });
  };

  return <button onClick={handleAddToCart}>Add to Cart</button>;
}
```

#### Accessing Cart Data

```typescript
import { useCart } from "@/app/hooks/useCart";

export function CartInfo() {
  const { items, getTotalPrice, getTotalItems, openCart, closeCart } = useCart();

  return (
    <div>
      <p>Items: {getTotalItems()}</p>
      <p>Total: ¥{getTotalPrice().toLocaleString()}</p>
      <button onClick={openCart}>Open Cart</button>
    </div>
  );
}
```

## Payment Processing

### Current Implementation (Development)

The API route `/api/process-payment` currently returns a mock order ID for testing purposes.

### Production Implementation

To integrate with actual Square payments, update `/app/api/process-payment/route.ts`:

1. Install Square Node.js SDK:

```bash
npm install square
```

2. Implement actual payment processing:

```typescript
import { Client, Environment } from 'square';

const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production, // or Sandbox for testing
});

const { paymentsApi } = client;

const response = await paymentsApi.createPayment({
  sourceId: nonce,
  amountMoney: {
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'JPY',
  },
  idempotencyKey: crypto.randomUUID(),
});
```

3. Store order details in a database (Firebase, Supabase, etc.)
4. Send confirmation emails (SendGrid, Mailgun, etc.)
5. Handle Square webhooks for payment status updates

## Tax Calculation

**Current:** Fixed 10% consumption tax (Japan's standard rate)

The tax is calculated in:
- `CartDrawer.tsx`: `const tax = Math.round(subtotal * 0.1);`
- `CheckoutForm.tsx`: `const tax = Math.round(subtotal * 0.1);`

To change the tax rate, update both files. For example, if the rate changes to 8%:

```typescript
const tax = Math.round(subtotal * 0.08);
```

## Security Notes

✅ **PCI Compliance:**
- We never handle credit card data directly
- Square Web Payments SDK handles all card input
- Card data never reaches our servers
- Payment tokens (nonces) are one-time use only

✅ **API Security:**
- Square Application ID is public (only used by frontend)
- Access Token is server-only (never exposed to browser)
- Idempotency keys prevent duplicate charges
- HTTPS required in production

## Testing

### Test Card Numbers (Sandbox)

Use these with Square Sandbox environment:

- **Success:** 4532 0151 3761 0002
- **Failed:** 5105 1051 0510 5100
- **Declined:** 4000 0200 0000 0000

**Expiry & CVV:** Any future date and any 3-digit CVV

### Testing Workflow

1. Ensure `.env.local` has Sandbox credentials (not Production)
2. Add items to cart
3. Proceed to checkout
4. Use test card numbers above
5. Check order confirmation

## Deployment

### Cloudflare Pages (Current Setup)

1. **Environment Variables:**
   - Add `NEXT_PUBLIC_SQUARE_APP_ID` in Cloudflare Pages settings
   - Add `NEXT_PUBLIC_SQUARE_LOCATION_ID` in Cloudflare Pages settings
   - Add `SQUARE_ACCESS_TOKEN` in Cloudflare Pages settings (for production)

2. **Build Command:**
   ```
   npm run build
   ```

3. **Deploy:**
   ```bash
   npm run build
   # Output to /out for static export or /dist for serverless
   ```

4. **Verify:**
   - Test cart functionality in production
   - Test payments with Square Sandbox
   - Monitor for errors in Cloudflare logs

## Troubleshooting

### Cart Not Opening
- Check browser console for errors
- Verify `CartProvider` wraps the entire app in `layout.tsx`
- Ensure `useCart` is called only in client components ('use client')

### Square Form Not Loading
- Check browser console for SDK load errors
- Verify `NEXT_PUBLIC_SQUARE_APP_ID` and `NEXT_PUBLIC_SQUARE_LOCATION_ID` are set
- Confirm domain is whitelisted in Square Dashboard (Settings → Domains)

### Payment Failing
- Check browser console and server logs
- Verify test card number is correct (if in Sandbox)
- Ensure `/api/process-payment` endpoint is accessible
- Check Square Dashboard for declined transaction details

### Total Price Incorrect
- Verify tax calculation (should be 10% for Japan)
- Check for currency conversion issues (should be JPY)
- Ensure prices in `MerchSection.tsx` match intended values

## Performance Optimization

- Cart state is isolated in Context (minimal re-renders)
- CartDrawer uses React.memo-like patterns to prevent unnecessary updates
- Square SDK is lazy-loaded only when checkout page loads
- CSS Grid uses gap-px for efficient layout

## Future Enhancements

Potential features to add:

1. **Order Management**
   - Admin dashboard to view/manage orders
   - Order status tracking
   - CSV export for order data

2. **Customer Accounts**
   - Login/signup for order history
   - Saved addresses
   - Wishlist functionality

3. **Inventory Management**
   - Real-time stock tracking
   - Out-of-stock handling
   - Pre-orders for sold-out items

4. **Analytics**
   - Sales dashboard
   - Customer analytics
   - Popular items tracking

5. **Payment Methods**
   - Apple Pay / Google Pay
   - PayPay (Japanese payment method)
   - Bank transfer option

6. **Shipping Integration**
   - Real-time shipping cost calculation
   - Multiple shipping options
   - Tracking number generation

## Support

For issues or questions:

1. Check this documentation
2. Review Square's [Web Payments SDK docs](https://developer.squareup.com/docs/web-payments/overview)
3. Check browser console for error messages
4. Review server logs in Cloudflare Pages

---

**Last Updated:** March 27, 2026
**Version:** 1.0
**Status:** Development (Mock Payment Processing)
