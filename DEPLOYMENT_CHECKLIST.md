# Shopping Cart Deployment Checklist

## Pre-Deployment ✅

- [ ] Read `CART_QUICK_REFERENCE.md` (2 min read)
- [ ] Read `SHOPPING_CART_SETUP.md` (detailed guide)
- [ ] Project builds successfully: `npm run build` ✅
- [ ] No TypeScript errors ✅
- [ ] All 23 pages prerendered ✅

## Get Square Credentials (5 minutes)

1. [ ] Go to https://developer.squareup.com/apps
2. [ ] Sign in or create account
3. [ ] Select your application (or create new)
4. [ ] Copy these values:
   - [ ] **Application ID** (starts with `sq0atp-...`) → Paste in step 3
   - [ ] **Location ID** (long alphanumeric) → Paste in step 3
   - [ ] **Access Token** (save for production) → Save for later

## Local Setup (5 minutes)

1. [ ] Create `.env.local` file in project root:
   ```bash
   cat > .env.local << EOF
   NEXT_PUBLIC_SQUARE_APP_ID=your_app_id_here
   NEXT_PUBLIC_SQUARE_LOCATION_ID=your_location_id_here
   EOF
   ```

2. [ ] Test locally:
   ```bash
   npm run dev
   # Open http://localhost:3000
   # Try adding items to cart
   # Try checkout with test card: 4532 0151 3761 0002
   ```

3. [ ] Verify cart works:
   - [ ] Click "Add to Cart" on any merch item
   - [ ] Cart icon updates with counter
   - [ ] Cart drawer opens
   - [ ] Can adjust quantities
   - [ ] Can remove items
   - [ ] Checkout page shows order summary

## Deploy to Cloudflare Pages (10 minutes)

### 1. Add Environment Variables to Cloudflare Pages

1. [ ] Go to Cloudflare Pages → Your Project → Settings → Environment Variables
2. [ ] Click "Add Environment Variables"
3. [ ] Add for **Production**:
   - [ ] `NEXT_PUBLIC_SQUARE_APP_ID` = your app ID
   - [ ] `NEXT_PUBLIC_SQUARE_LOCATION_ID` = your location ID
4. [ ] **IMPORTANT:** Do NOT add `SQUARE_ACCESS_TOKEN` yet (only needed for real payments)
5. [ ] Click "Save"

### 2. Verify Build Settings

1. [ ] Go to Settings → Build, Deployments, and Hosting
2. [ ] Verify:
   - [ ] Build command: `npm run build` (should be already set)
   - [ ] Output directory: `out` (static export)
   - [ ] Root directory: `.` (current)

### 3. Deploy

1. [ ] Option A: **Automatic** (recommended)
   - [ ] Push to git: `git add . && git commit -m "Add shopping cart"` && `git push`
   - [ ] Cloudflare auto-triggers build
   - [ ] Wait for build to complete (~2 minutes)
   - [ ] Check deployment status in dashboard

2. [ ] Option B: **Manual**
   - [ ] In Cloudflare Pages → Deployments → Trigger Deployment
   - [ ] Select branch → Deploy
   - [ ] Wait for build to complete

### 4. Test Deployed Site

1. [ ] Open your Felicity URL (e.g., https://felicity.cafe/)
2. [ ] Test cart functionality:
   - [ ] Add items to cart
   - [ ] Cart counter updates
   - [ ] Cart drawer works
   - [ ] Checkout page loads
3. [ ] Test with test card:
   - [ ] Card: `4532 0151 3761 0002`
   - [ ] Expiry: Any future date
   - [ ] CVV: Any 3 digits
   - [ ] Should see order confirmation page

## Post-Deployment

### 1. Monitor for Issues (First 24 Hours)

- [ ] Check Cloudflare Analytics for errors
- [ ] Check browser console for errors (F12)
- [ ] Test on mobile devices
- [ ] Test cart and checkout on multiple browsers

### 2. Setup Notifications (Optional)

- [ ] In Cloudflare, setup email notifications for build failures
- [ ] Add monitoring/error tracking (Sentry, LogRocket, etc.)

### 3. Production Square Setup (When Ready)

When you're ready to accept real payments:

1. [ ] Get Production Square Credentials
   - [ ] Go to Square Dashboard
   - [ ] Switch to Production environment
   - [ ] Copy Production **Access Token**

2. [ ] Add to Cloudflare Pages (Production only):
   - [ ] Settings → Environment Variables
   - [ ] Add `SQUARE_ACCESS_TOKEN` = your production token

3. [ ] Update `/app/api/process-payment/route.ts`
   - [ ] Uncomment the actual Square SDK code
   - [ ] Remove mock payment code
   - [ ] Test thoroughly

## Updating Merchandise

### Simple Update (Same Number of Items)

1. [ ] Edit `/app/components/MerchSection.tsx`
2. [ ] Update the `MERCH_ITEMS` array:
   ```typescript
   const MERCH_ITEMS = [
     { id: "item-id", name: "Item Name", price: 12000 }, // Price in JPY
     // ... other items
   ];
   ```
3. [ ] Save and push to git
4. [ ] Cloudflare auto-deploys (~2 minutes)

### Add/Remove Items

Same as above. Cloudflare will rebuild automatically.

### Test After Update

- [ ] Add newly added items to cart
- [ ] Verify prices calculate correctly
- [ ] Check order summary shows new item

## Troubleshooting Deployment

### Build Fails in Cloudflare

```bash
# Debug locally first
npm install
npm run build

# If that works, issue is environment-related:
# - Check Cloudflare env vars match .env.local
# - Check "Build, deployments, and hosting" settings
```

### Cart Not Working on Production

1. [ ] Check Cloudflare env vars are set correctly
2. [ ] Check browser console (F12) for errors
3. [ ] Verify `NEXT_PUBLIC_SQUARE_APP_ID` is not empty
4. [ ] Try hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

### Checkout Form Not Loading

1. [ ] Verify Square SDK can load (check network tab in F12)
2. [ ] Check that your domain is whitelisted in Square Dashboard:
   - [ ] Go to Square Dashboard → Settings → Domains
   - [ ] Add your Cloudflare Pages domain (e.g., `felicity.cafe`)

### Payment Test Card Declined

- [ ] Make sure you're using Square **Sandbox** credentials for testing
- [ ] Try different test card: `5105 1051 0510 5100`
- [ ] Check Square Dashboard → Payments for details

## Rollback Plan

If something breaks:

1. [ ] In Cloudflare Pages → Deployments
2. [ ] Find the last working deployment
3. [ ] Click → Rollback to This Deployment
4. [ ] Site reverts immediately to previous version

## Monitoring Checklist

Daily (First Week):
- [ ] Check Cloudflare Analytics dashboard
- [ ] Verify no build failures
- [ ] Spot-check cart functionality works

Weekly (Ongoing):
- [ ] Review order data in Square Dashboard
- [ ] Monitor for errors in Cloudflare logs
- [ ] Test new merchandise items if added

## Documentation for Rowly

Keep these files handy:
- **CART_QUICK_REFERENCE.md** — Fast how-to guide
- **SHOPPING_CART_SETUP.md** — Detailed technical guide
- **CART_IMPLEMENTATION_SUMMARY.md** — What was built
- **.env.example** — Environment variable template

## Timeline

| Task | Time | Status |
|------|------|--------|
| Get Square creds | 5 min | ⏳ TODO |
| Local setup | 5 min | ⏳ TODO |
| Cloudflare deploy | 10 min | ⏳ TODO |
| Test deployment | 10 min | ⏳ TODO |
| **Total** | **30 min** | ⏳ TODO |

## Support

Issues? Check in this order:
1. **CART_QUICK_REFERENCE.md** — Common questions
2. **SHOPPING_CART_SETUP.md** — Detailed troubleshooting
3. Browser console (F12) — JavaScript errors
4. Cloudflare Dashboard → Deployments → Logs
5. Square Dashboard → Payments (for payment issues)

## Go Live Confidence Check

Before declaring "live":

- [ ] Cart adds items correctly
- [ ] Checkout page loads
- [ ] Test payment succeeds (with test card)
- [ ] Order confirmation page shows
- [ ] Mobile view works
- [ ] Logo/navigation work
- [ ] Other pages still work (coffee, experiences, etc.)

✅ **Ready to deploy!**

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Production Status:** ⬜ Sandbox Testing → ⬜ Live (Test) → ⬜ Live (Production)

