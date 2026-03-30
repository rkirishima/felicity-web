# Square Integration - Quick Reference Card

## Live Site
🌐 **https://0aee6aea.felicity-staff.pages.dev**

---

## Test Payment

**Card:** 4111 1111 1111 1111  
**Expiry:** Any future date (e.g., 12/26)  
**CVV:** Any 3 digits (e.g., 123)  
**Email:** test@example.com (or any email)

---

## Quick Test Steps

1. Visit live site above
2. Click "Buy Now" on any coffee product
3. Click "Proceed to Checkout"
4. Fill in card details (above)
5. Click "Pay ¥[amount]"
6. See confirmation with Order ID

---

## Files to Know

| File | Purpose |
|------|---------|
| `app/components/CheckoutForm.tsx` | Payment form with Square SDK |
| `app/api/process-payment/route.ts` | Backend payment processor |
| `app/checkout/page.tsx` | Checkout page & confirmation |
| `.env.local` | Square credentials |

---

## What Works

✅ Card tokenization (PCI-compliant)  
✅ Payment processing via Square  
✅ Order ID generation  
✅ Error handling  
✅ Form validation  
✅ Confirmation page  
✅ Cart clearing  
✅ JPY currency support  

---

## Key Details

- **App ID:** sq0idp-7eraFqCSbK9HxHYhqyZrWg
- **Location ID:** L490B21JFZZNG
- **Environment:** Square Production
- **Currency:** JPY (Japanese Yen)
- **Tax:** 10% (automatic)
- **Order ID Format:** FLC-[timestamp]-[random]

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No card form | Refresh page, check console for Square SDK errors |
| Payment fails | Verify card is test card (4111...), check email format |
| No confirmation | Check browser network tab, look for API errors |
| Error persists | Hard refresh (Cmd+Shift+R), check .env.local |

---

## Documentation

📘 **SQUARE_INTEGRATION_COMPLETE.md** - Full integration guide  
📗 **PAYMENT_TESTING_GUIDE.md** - Detailed test scenarios  
📕 **INTEGRATION_SUMMARY.md** - Technical architecture  
📙 **DEPLOYMENT_REPORT.md** - Deployment details  

---

## Build & Deploy

```bash
# Build (if needed)
npm run build

# Deploy (if needed)
npx wrangler pages deploy out/
```

---

## Next Steps

1. ✓ Test with test card
2. ✓ Verify confirmation page
3. ✓ Test error scenarios
4. ✓ Go live with real payments (update Square environment)

---

**Status:** ✅ LIVE & READY  
**Date:** 2026-03-28  
**URL:** https://0aee6aea.felicity-staff.pages.dev
