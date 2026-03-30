# Payment Testing Guide - Felicity Checkout

## Live Site
**URL:** https://0aee6aea.felicity-staff.pages.dev

---

## Test Scenario: Complete Purchase

### Step 1: Add Item to Cart
1. Visit the live site
2. Scroll to Merch section or product pages
3. Click "Buy Now" on any coffee product
4. Enter quantity
5. Confirm item added to cart (cart icon updates)

### Step 2: Open Checkout
1. Click cart icon (top right)
2. Click "Proceed to Checkout"
3. Or navigate directly to: `/checkout`

### Step 3: Enter Test Card

**Test Card Details:**
```
Card Number:  4111 1111 1111 1111
Expiry Date:  Any future date (e.g., 12/26)
CVV:          Any 3 digits (e.g., 123)
Postal Code:  Any valid code (e.g., 10001)
Email:        test@example.com (or any email)
```

### Step 4: Complete Payment
1. Fill in email address
2. Card form should auto-populate with Square card widget
3. Click "Pay ¥[amount]" button
4. Wait for processing (shows "Processing..." state)

### Step 5: Verify Success
**Expected Result:**
- ✓ Page redirects to confirmation
- ✓ Shows: "Order Confirmed" heading
- ✓ Displays Order ID (format: `FLC-[timestamp]-[random]`)
- ✓ Message: "A confirmation email has been sent to your inbox"
- ✓ Button: "Return to Home"

---

## Test Scenario: Card Decline

To test error handling, use a card that will be declined:

**Declined Card Details:**
```
Card Number:  4000 0000 0000 0002
Expiry Date:  Any future date
CVV:          Any 3 digits
Email:        test@example.com
```

**Expected Result:**
- ✗ Form shows error message
- ✗ "Payment processing failed" or specific Square error
- ✗ User can retry or correct card details

---

## Test Scenario: Invalid Card

**Invalid Card (wrong format):**
```
Card Number:  1234 5678 9012 3456
Expiry Date:  Any future date
CVV:          Any 3 digits
Email:        test@example.com
```

**Expected Result:**
- ✗ Form shows "Invalid card details" error before submission
- ✗ "Pay" button remains disabled until valid card entered

---

## Form Validation Tests

### Missing Email
- Leave email blank
- Click "Pay ¥[amount]"
- **Expected:** Error: "Email is required"

### Missing Card
- Don't fill in card form
- Click "Pay ¥[amount]"
- **Expected:** Error: "Invalid card details" or "Payment form not loaded"

### Form Not Loaded
- If Square SDK fails to load
- **Expected:** Error: "Failed to load payment form"

---

## Checkout Page Elements

### Order Summary (Right Column - Desktop)
- ✓ Shows each item in cart
- ✓ Displays quantity
- ✓ Shows price per item

### Checkout Form (Left Column)
- ✓ Order summary recap
- ✓ Item list with prices
- ✓ Subtotal calculation
- ✓ Tax calculation (10% of subtotal)
- ✓ Total in blue accent color
- ✓ Card input field (Square managed)
- ✓ Email input field
- ✓ Error message area
- ✓ Pay button (disabled until card loaded)

### Test Instructions
- ✓ Visible below card input: "Test card: 4111 1111 1111 1111 (any future date, any 3-digit CVV)"

---

## What Happens Behind the Scenes

1. **Frontend (CheckoutForm.tsx)**
   - Loads Square Web Payments SDK
   - Creates card form in `#card-container`
   - On submit: calls `card.tokenize()`
   - Sends token to backend

2. **Backend (api/process-payment/route.ts)**
   - Receives token (sourceId)
   - Creates SquareClient with Bearer Token
   - Calls Square Payments API
   - Creates payment with amount in cents
   - Returns Order ID or error

3. **Frontend Response**
   - Success: Redirects to `/checkout?confirmed=true&orderId=[ID]`
   - Error: Shows error message in form

---

## Common Issues & Solutions

### Card Form Not Appearing
- **Cause:** Square SDK failed to load
- **Fix:** Check browser console for errors
- **Check:** Network tab should show `square.js` loaded from CDN

### "Payment form not loaded" Error
- **Cause:** SDK initialization took too long
- **Fix:** Refresh page and try again
- **Check:** Ensure `NEXT_PUBLIC_SQUARE_APP_ID` and `NEXT_PUBLIC_SQUARE_LOCATION_ID` are set

### Payment Fails but No Error Message
- **Cause:** Network error or backend crash
- **Fix:** Check browser console and server logs
- **Check:** Verify `SQUARE_ACCESS_TOKEN` is correct

### Order ID Not Generated
- **Cause:** Backend error in ID generation
- **Fix:** Retry payment
- **Check:** Check server logs for errors

---

## Payment Status Codes

**201 - Success**
```json
{
  "orderId": "FLC-1711622400000-ABC123XYZ",
  "squarePaymentId": "PAY_xxxxx",
  "message": "Payment processed successfully"
}
```

**400 - Card Declined or Invalid**
```json
{
  "message": "Payment processing failed. Please check your card details and try again."
}
```

**400 - Missing Fields**
```json
{
  "message": "Missing required fields"
}
```

**500 - Server Error**
```json
{
  "message": "Internal server error"
}
```

---

## Browser Developer Tools

### To Monitor Payment:
1. **Open DevTools** (F12 or Cmd+Option+I)
2. Go to **Network** tab
3. Look for POST request to `/api/process-payment`
4. Click it and view response

### Payload Example:
```json
{
  "sourceId": "cnon:...", // Square token
  "amount": 5000,          // Total amount
  "items": [...],          // Cart items
  "email": "test@example.com"
}
```

### Response Example (Success):
```json
{
  "orderId": "FLC-1711622400000-ABC123XYZ",
  "squarePaymentId": "PAY_xxxxx",
  "message": "Payment processed successfully"
}
```

---

## Confirmation Page Check

After successful payment, you should see:

**✓ Visual Elements**
- Large checkmark (✓) icon
- "Order Confirmed" heading
- "Thank you for your purchase!" message

**✓ Order Details Box**
- Label: "ORDER ID" (small caps)
- Order ID in monospace font
- Message about confirmation email

**✓ Action Button**
- "RETURN TO HOME" button
- Links back to homepage
- Cart should be empty

---

## Testing Timeline

**Recommended Test Order:**
1. ✓ Test successful payment (valid test card)
2. ✓ Test declined payment (4000 0000 0000 0002)
3. ✓ Test form validation (missing email, missing card)
4. ✓ Test error recovery (retry after error)
5. ✓ Verify cart clears after success
6. ✓ Verify order ID displays correctly

---

## Screenshots to Capture

1. **Checkout Form** - Full page view
2. **Card Input** - Square card widget visible
3. **Order Summary** - Items and totals
4. **Success Confirmation** - Order ID displayed
5. **Error State** - Error message visible

---

## Notes for QA

- Order IDs are unique per transaction (timestamp-based)
- Test cards work only in Square test environment
- Payments won't actually charge (test mode)
- All errors are logged to browser console
- Confirmation emails are not sent (no email service configured yet)

---

**Ready to Test!** 🚀
