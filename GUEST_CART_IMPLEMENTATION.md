# Guest Cart Implementation

## Overview
Implemented guest cart functionality that allows users to add items to cart without logging in, with a checkout authentication modal prompting login/signup when proceeding to checkout.

## Features Implemented

### 1. **Guest Cart Storage**
- ✅ Local storage-based cart for non-authenticated users
- ✅ Persists cart data using AsyncStorage
- ✅ Automatic cart calculations (subtotal, quantity, etc.)
- ✅ Full CRUD operations (add, update, remove items)

### 2. **Unified Cart State Management**
- ✅ Single cart slice handles both authenticated and guest users
- ✅ Automatic detection of authentication status
- ✅ API calls for authenticated users
- ✅ Local storage for guest users
- ✅ Seamless switching between modes

### 3. **Checkout Authentication Modal**
- ✅ Bottom sheet modal with smooth slide animation
- ✅ Three action buttons:
  - **Login** - Navigates to login screen
  - **Sign Up** - Navigates to signup screen
  - ~~Guest Checkout~~ - Optional (commented out)
- ✅ Lock icon and clear messaging
- ✅ Overlay with tap-to-close functionality

### 4. **Cart Clearing on Logout**
- ✅ Automatically clears guest cart when user logs out
- ✅ Prevents cart data persistence after logout
- ✅ Clean slate for next session

### 5. **UI Enhancements**
- ✅ Coupon section hidden for guest users (only for authenticated)
- ✅ Full-width action buttons in cart items
- ✅ Professional modal design

## File Structure

```
MyFirstApp/
├── src/
│   ├── services/
│   │   └── storage/
│   │       └── guestCartStorage.ts         # Guest cart local storage manager
│   ├── features/
│   │   └── cart/
│   │       ├── components/
│   │       │   ├── CheckoutAuthModal.tsx   # Login/Signup modal
│   │       │   ├── CartItemCard.tsx        # Updated with full-width buttons
│   │       │   └── EmptyCart.tsx
│   │       └── screens/
│   │           └── CartScreen.tsx          # Updated with auth modal
│   └── store/
│       └── slices/
│           └── cartSlice.ts                # Updated with guest cart logic
└── GUEST_CART_IMPLEMENTATION.md            # This file
```

## How It Works

### For Guest Users (Not Logged In)

1. **Adding to Cart**
   - User clicks "Add to Cart" on any product
   - Product data is stored in AsyncStorage
   - Cart badge updates immediately
   - No API calls made

2. **Viewing Cart**
   - Cart loads from local storage
   - Shows all items with prices
   - Quantity controls work locally
   - **No coupon section** (hidden for guests)

3. **Proceeding to Checkout**
   - Clicks "Proceed to Checkout" button
   - **CheckoutAuthModal** appears from bottom
   - Options: Login or Sign Up
   - After authentication, can complete checkout

4. **Cart Persistence**
   - Cart persists across app restarts
   - Survives app crashes
   - Cleared only on logout

### For Authenticated Users

1. **Adding to Cart**
   - API call to `/api/v1/customer/cart/add/{productId}`
   - Server-side cart management
   - Synced across devices

2. **Viewing Cart**
   - Fetches from server
   - Shows coupons section
   - All cart operations via API

3. **Proceeding to Checkout**
   - Direct navigation to checkout
   - No authentication modal

## Key Components

### guestCartStorage.ts

Manages local cart storage with methods:
- `getGuestCart()` - Retrieve cart from storage
- `saveGuestCart()` - Save cart to storage
- `addItem()` - Add product to cart
- `updateItem()` - Update quantity
- `removeItem()` - Remove item
- `clearGuestCart()` - Clear all items
- `recalculateTotals()` - Calculate cart totals

### CheckoutAuthModal.tsx

Bottom sheet modal with:
- Lock icon for security indication
- Clear title and description
- Two primary action buttons (Login/Signup)
- Smooth slide-up animation
- Overlay dismissal

### Updated cartSlice.ts

Enhanced thunks that check authentication:
- `fetchCartThunk` - Loads from API or storage
- `addToCartThunk` - Adds via API or storage
- `updateCartItemThunk` - Updates via API or storage
- `removeFromCartThunk` - Removes via API or storage

## User Flow

```
┌─────────────────────────────────────┐
│  User (Not Logged In)               │
└─────────────┬───────────────────────┘
              │
              ▼
      ┌───────────────┐
      │ Browse Products│
      └───────┬────────┘
              │
              ▼
      ┌───────────────┐
      │ Add to Cart   │◄─── Stored Locally
      └───────┬────────┘
              │
              ▼
      ┌───────────────┐
      │  View Cart    │◄─── Loaded from Storage
      └───────┬────────┘
              │
              ▼
      ┌───────────────────┐
      │ Proceed to Checkout│
      └───────┬────────────┘
              │
              ▼
      ┌─────────────────────┐
      │ Auth Modal Appears  │
      │  ┌──────────────┐   │
      │  │   Login      │   │
      │  ├──────────────┤   │
      │  │   Sign Up    │   │
      │  └──────────────┘   │
      └─────────┬────────────┘
                │
       ┌────────┴────────┐
       │                 │
       ▼                 ▼
  ┌────────┐      ┌──────────┐
  │ Login  │      │ Sign Up  │
  └────┬───┘      └─────┬────┘
       │                │
       └────────┬───────┘
                │
                ▼
        ┌───────────────┐
        │ Authenticated │
        └───────┬────────┘
                │
                ▼
        ┌───────────────┐
        │   Checkout    │
        └───────────────┘
```

## Benefits

1. **Better UX** - Users can shop without forced registration
2. **Higher Conversion** - Reduces friction in shopping process
3. **Data Persistence** - Cart survives app restarts
4. **Seamless Transition** - Easy upgrade from guest to authenticated
5. **Consistent Experience** - Same cart UI for all users

## Technical Details

### Storage Key
- Guest cart stored at: `@guest_cart`

### Cart Structure
```typescript
{
  id: number,           // Temporary ID for guest
  is_guest: true,       // Flag for guest cart
  items: CartItem[],    // Array of cart items
  items_count: number,  // Number of unique items
  items_qty: number,    // Total quantity
  sub_total: number,    // Sum of all items
  grand_total: number,  // Final amount
  // ... other fields
}
```

### Authentication Check
```typescript
const isAuthenticated = state.auth.isAuthenticated;
if (isAuthenticated) {
  // Use API
} else {
  // Use local storage
}
```

## Future Enhancements

1. **Cart Migration** - Transfer guest cart to server on login
2. **Guest Checkout** - Allow checkout without account
3. **Cart Expiry** - Auto-clear old guest carts
4. **Cart Sync** - Merge guest and server carts on login
5. **Offline Support** - Queue cart operations when offline

## Testing Checklist

- [ ] Add item to cart as guest
- [ ] View cart without login
- [ ] Update quantities as guest
- [ ] Remove items as guest
- [ ] Click "Proceed to Checkout" as guest
- [ ] Verify modal appears
- [ ] Test Login button navigation
- [ ] Test Sign Up button navigation
- [ ] Verify cart persists after app restart
- [ ] Login and verify cart switches to API
- [ ] Logout and verify guest cart is cleared
- [ ] Verify coupon section hidden for guests

## Notes

- Guest carts are device-specific (not synced across devices)
- No tax or discount calculations for guest carts
- Coupon feature disabled for guest users
- Cart cleared on logout for security
- Product data must be passed to `addToCartThunk` for guest cart

