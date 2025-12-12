# Stripe Connect Payment Flow - Mobile Application Implementation Plan

## Overview
This document outlines the plan to implement Stripe Connect payment method support in the mobile application, matching the functionality available in the web application.

## Current Web Application Flow

### 1. Payment Method Selection
- User selects "Stripe Connect" as payment method during checkout
- Payment method code: `stripeconnect`

### 2. Order Placement Flow
When user places order with Stripe Connect:
1. `StripeConnect::getRedirectUrl()` is called
2. Creates a Stripe Checkout Session
3. Returns Stripe Checkout Session URL (redirect URL)
4. User is redirected to Stripe's hosted checkout page
5. User completes payment on Stripe's page
6. Stripe redirects to success URL: `stripeconnect.success?session_id={CHECKOUT_SESSION_ID}`
7. Success handler:
   - Retrieves checkout session from Stripe
   - Creates order in database
   - Redirects to order success page

### 3. Key Components
- **StripeConnect.php**: Payment method class that creates checkout session
- **StripeConnectController.php**: Handles payment processing and success callback
- **Routes**: 
  - `stripeconnect.success` - Success callback
  - `stripeconnect.cancel` - Cancel callback

## Mobile Application Implementation Plan

### Phase 1: Backend API Updates

#### 1.1 Create REST API Success Endpoint
**File**: `Bagisto/packages/Webkul/RestApi/src/Http/Controllers/V1/Shop/Customer/StripeConnectController.php` (NEW)

**Purpose**: Handle Stripe Connect success callback for mobile app

**Endpoint**: `POST /api/v1/customer/stripeconnect/success`

**Functionality**:
- Accept `session_id` parameter
- Retrieve Stripe checkout session
- Create order from cart
- Return order data in JSON format (not redirect)
- Handle errors gracefully

**Response Format**:
```json
{
  "success": true,
  "data": {
    "order": {
      "id": 123,
      "increment_id": "000000123",
      ...
    }
  },
  "message": "Order created successfully"
}
```

#### 1.2 Update Checkout API Response
**File**: `Bagisto/packages/Webkul/RestApi/src/Http/Controllers/V1/Shop/Customer/CheckoutController.php`

**Current**: Already returns `redirect_url` when present (for OXXO)

**Enhancement**: 
- Ensure Stripe Connect redirect URLs are properly returned
- Include metadata about payment method type
- Add flag to indicate if WebView/browser handling is needed

### Phase 2: Mobile App - Payment Flow Handling

#### 2.1 Update CheckoutScreen - Handle Redirect URLs
**File**: `MyFirstApp/src/features/checkout/screens/CheckoutScreen.tsx`

**Changes**:
- Detect when `redirect_url` is returned for Stripe Connect
- Open Stripe Checkout URL in WebView or browser
- Monitor URL changes to detect success/cancel
- Handle deep linking back to app

**Flow**:
```
1. User clicks "Place Order"
2. API returns redirect_url (Stripe Checkout URL)
3. Open WebView/Browser with Stripe URL
4. User completes payment on Stripe page
5. Stripe redirects to success URL
6. Intercept success URL
7. Extract session_id
8. Call mobile success API endpoint
9. Get order data
10. Navigate to order success screen
```

#### 2.2 Create Stripe Connect WebView Component
**File**: `MyFirstApp/src/features/checkout/components/StripeConnectWebView.tsx` (NEW)

**Purpose**: Handle Stripe Checkout in WebView

**Features**:
- Display Stripe Checkout page
- Monitor URL navigation
- Detect success/cancel URLs
- Handle loading states
- Show error messages
- Close WebView and return to app

**URL Monitoring**:
- Success pattern: `stripeconnect.success?session_id=*`
- Cancel pattern: `stripeconnect.cancel`
- Extract session_id from success URL

#### 2.3 Create Stripe Connect API Service
**File**: `MyFirstApp/src/services/api/stripeconnect.api.ts` (NEW)

**Endpoints**:
- `processSuccess(sessionId)`: Call success endpoint with session_id
- Returns order data

### Phase 3: Mobile App - UI/UX Updates

#### 3.1 Update PaymentStep Component
**File**: `MyFirstApp/src/features/checkout/components/PaymentStep.tsx`

**Changes**:
- Add Stripe Connect icon
- Show appropriate description
- Handle selection state

#### 3.2 Update CheckoutScreen
**File**: `MyFirstApp/src/features/checkout/screens/CheckoutScreen.tsx`

**Changes**:
- Detect Stripe Connect payment method
- Show appropriate messaging
- Handle WebView modal/screen
- Manage navigation flow

### Phase 4: Deep Linking & URL Handling

#### 4.1 Configure Deep Links
**File**: `MyFirstApp/app.json` or app configuration

**Deep Link Patterns**:
- `myapp://stripeconnect/success?session_id=*`
- `myapp://stripeconnect/cancel`

#### 4.2 URL Handler
**File**: `MyFirstApp/src/shared/utils/urlHandler.ts` (NEW)

**Purpose**: 
- Parse deep link URLs
- Extract parameters
- Route to appropriate handlers

### Phase 5: Error Handling & Edge Cases

#### 5.1 Error Scenarios
- Network errors during payment
- Stripe checkout page fails to load
- User cancels payment
- Session expires
- Order creation fails after payment

#### 5.2 User Feedback
- Loading indicators
- Error messages
- Retry mechanisms
- Cancel confirmation

## Implementation Steps

### Step 1: Backend API (Priority: High)
1. ✅ Create REST API success endpoint
2. ✅ Add route for success endpoint
3. ✅ Test with Postman/API client

### Step 2: Mobile App - Core Flow (Priority: High)
1. ✅ Create StripeConnectWebView component
2. ✅ Create StripeConnect API service
3. ✅ Update CheckoutScreen to handle redirect URLs
4. ✅ Implement URL monitoring in WebView

### Step 3: Mobile App - UI/UX (Priority: Medium)
1. ✅ Update PaymentStep component
2. ✅ Add loading states
3. ✅ Add error handling UI
4. ✅ Test user flow

### Step 4: Deep Linking (Priority: Medium)
1. ✅ Configure deep links
2. ✅ Implement URL handler
3. ✅ Test deep link flow

### Step 5: Testing & Refinement (Priority: High)
1. ✅ Test complete payment flow
2. ✅ Test error scenarios
3. ✅ Test cancel flow
4. ✅ Test on iOS and Android
5. ✅ Handle edge cases

## Technical Considerations

### WebView vs Browser
**Option 1: WebView (Recommended)**
- Better control over navigation
- Can intercept URLs
- Seamless user experience
- Requires `react-native-webview` package

**Option 2: Browser (Linking)**
- Simpler implementation
- Less control
- Requires deep linking setup
- User leaves app

### URL Monitoring Strategy
1. **WebView Navigation State**: Monitor `onNavigationStateChange`
2. **URL Pattern Matching**: Check if URL matches success/cancel patterns
3. **Extract Parameters**: Parse session_id from URL
4. **Call API**: Process success via REST API
5. **Navigate**: Return to app and show order success

### Success URL Format
- Web: `https://yourdomain.com/stripe/success?session_id=cs_xxx`
- Mobile Deep Link: `myapp://stripeconnect/success?session_id=cs_xxx`
- Or: Monitor WebView URL and intercept before redirect

## API Endpoints Summary

### Existing (Already Implemented)
- `POST /api/v1/customer/checkout/save-order` - Returns redirect_url for Stripe Connect

### New (To Be Created)
- `POST /api/v1/customer/stripeconnect/success` - Process success callback
  - Parameters: `session_id` (required)
  - Returns: Order data

## Files to Create/Modify

### Backend (PHP)
1. **NEW**: `Bagisto/packages/Webkul/RestApi/src/Http/Controllers/V1/Shop/Customer/StripeConnectController.php`
2. **MODIFY**: `Bagisto/packages/Webkul/RestApi/src/Routes/V1/Shop/customers-routes.php`

### Mobile App (TypeScript/React Native)
1. **NEW**: `MyFirstApp/src/services/api/stripeconnect.api.ts`
2. **NEW**: `MyFirstApp/src/features/checkout/components/StripeConnectWebView.tsx`
3. **MODIFY**: `MyFirstApp/src/features/checkout/screens/CheckoutScreen.tsx`
4. **MODIFY**: `MyFirstApp/src/features/checkout/components/PaymentStep.tsx`
5. **NEW**: `MyFirstApp/src/shared/utils/urlHandler.ts` (if using deep links)

## Testing Checklist

- [ ] Stripe Connect payment method appears in payment options
- [ ] Selecting Stripe Connect and placing order opens WebView
- [ ] Stripe Checkout page loads correctly
- [ ] User can complete payment on Stripe page
- [ ] Success URL is intercepted correctly
- [ ] Session ID is extracted from URL
- [ ] Success API endpoint is called
- [ ] Order is created successfully
- [ ] Order success screen displays correctly
- [ ] Cancel flow works correctly
- [ ] Error handling works for all scenarios
- [ ] Works on both iOS and Android

## Dependencies

### Mobile App
- `react-native-webview` (if using WebView approach)
- `expo-linking` (for deep linking, if needed)

## Notes

1. **Security**: Ensure session_id validation on backend
2. **Error Recovery**: Handle cases where payment succeeds but order creation fails
3. **User Experience**: Show clear loading states during payment processing
4. **Testing**: Test with Stripe test mode first
5. **Fallback**: Consider fallback to browser if WebView fails
