# Address Management Implementation

## Overview

This document describes the implementation of the address management feature in the mobile application, including the sidebar menu item, address listing screen, and address card components.

## Features Implemented

### 1. **Address Menu in Sidebar**
- Added "Addresses" menu item under "Your Information" section
- Only visible when user is authenticated
- Uses location icon (`location-outline`)
- Navigates to `/addresses` route

### 2. **Addresses Screen**
- Full-width "Add New Address" button at the top
- List of address cards below the button
- Empty state with icon and message when no addresses exist
- Pull-to-refresh functionality
- Loading and error states

### 3. **Address Card Component**
- Displays complete address information
- Shows "Default" badge for default address
- Action buttons: Set Default, Edit, Delete
- Confirmation dialog before deletion
- Clean, card-based design

## File Structure

```
MyFirstApp/
├── src/
│   ├── features/
│   │   └── address/
│   │       ├── types/
│   │       │   └── address.types.ts          # Address type definitions
│   │       ├── components/
│   │       │   └── AddressCard.tsx           # Address card component
│   │       └── screens/
│   │           └── AddressesScreen.tsx       # Main addresses screen
│   ├── services/
│   │   └── api/
│   │       └── address.api.ts                # Address API service
│   └── shared/
│       └── components/
│           └── CustomDrawerContent.tsx       # Updated with address menu
├── app/
│   └── addresses.tsx                         # Address route
└── src/i18n/locales/
    └── en.json                               # Updated translations
```

## API Integration

### Endpoints Used

All endpoints are authenticated and require `sanctum` token:

1. **GET** `/api/v1/customer/addresses`
   - Fetch all addresses for logged-in customer
   - Params: `pagination=0` (to get all addresses)

2. **GET** `/api/v1/customer/addresses/{id}`
   - Fetch single address by ID

3. **POST** `/api/v1/customer/addresses`
   - Create new address
   - Body: AddressFormData

4. **PUT** `/api/v1/customer/addresses/{id}`
   - Update existing address
   - Body: AddressFormData

5. **DELETE** `/api/v1/customer/addresses/{id}`
   - Delete address

6. **PATCH** `/api/v1/customer/addresses/make-default/{id}`
   - Set address as default

### Address Data Structure

```typescript
interface Address {
    id: number;
    customer_id: number;
    company_name?: string;
    first_name: string;
    last_name: string;
    address1: string[];           // Array of address lines
    address2?: string;
    country: string;
    country_name?: string;
    state: string;
    city: string;
    postcode: string;
    phone: string;
    vat_id?: string;
    default_address?: boolean;
    additional?: Record<string, any>;
    created_at?: string;
    updated_at?: string;
}
```

## UI Components

### AddressesScreen

**Features:**
- Full-width "Add New Address" button (primary color)
- Scrollable list of address cards
- Empty state with icon and message
- Pull-to-refresh
- Loading spinner
- Error handling with retry

**Empty State:**
```
┌─────────────────────────────────┐
│                                 │
│         📍 (location icon)      │
│                                 │
│      No Addresses Added         │
│                                 │
│  You haven't added any delivery │
│  addresses yet.                 │
│  Add one to make checkout       │
│  faster!                        │
│                                 │
│  [+ Add Your First Address]     │
│                                 │
└─────────────────────────────────┘
```

**With Addresses:**
```
┌─────────────────────────────────┐
│  [+ Add New Address]            │ ← Full width button
│                                 │
│  ┌─────────────────────────┐   │
│  │ John Doe     [Default]  │   │ ← Address card
│  │ 123 Main Street         │   │
│  │ Apt 4B                  │   │
│  │ New York, NY 10001      │   │
│  │ United States           │   │
│  │ 📞 +1 234-567-8900      │   │
│  │ ─────────────────────── │   │
│  │ [✓ Set Default] [✎ Edit]│   │
│  │ [🗑 Delete]             │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Jane Smith              │   │ ← Another address
│  │ ...                     │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

### AddressCard

**Features:**
- Header with name and default badge
- Complete address display
- Phone number with icon
- Action buttons row
- Confirmation before delete

**Badge Colors:**
- Default badge: Primary color (#007AFF)
- Delete action: Error/red color

**Actions:**
1. **Set Default** (only shown if not default)
   - Checkmark icon
   - Primary color
   - Calls `makeDefaultAddress` API

2. **Edit**
   - Pencil icon
   - Gray color
   - Opens edit form (TODO)

3. **Delete**
   - Trash icon
   - Red color
   - Shows confirmation dialog
   - Calls `deleteAddress` API

## Sidebar Integration

### Location in Drawer

```
Your Information (expanded)
├── Dashboard
├── Orders
├── Addresses          ← NEW
└── Reviews
```

### Menu Item Properties
- **Label**: "Addresses" (from i18n)
- **Icon**: `location-outline`
- **Route**: `/addresses`
- **Visibility**: Only when authenticated

## User Flow

### 1. Access Addresses
```
Open Sidebar → Your Information → Addresses → Addresses Screen
```

### 2. View Addresses
```
Addresses Screen
├── If addresses exist: Show list
└── If no addresses: Show empty state
```

### 3. Add Address
```
Tap "Add New Address" → [TODO: Address Form]
```

### 4. Edit Address
```
Tap "Edit" on card → [TODO: Address Form with data]
```

### 5. Delete Address
```
Tap "Delete" → Confirmation Dialog → Delete → Refresh List
```

### 6. Set Default
```
Tap "Set Default" → API Call → Update UI → Show Toast
```

## Styling

### Colors
- **Primary Button**: `theme.colors.primary[500]` (#007AFF)
- **Default Badge**: `theme.colors.primary[500]`
- **Card Border**: `theme.colors.gray[200]`
- **Text Primary**: `theme.colors.text.primary`
- **Text Secondary**: `theme.colors.text.secondary`
- **Delete Action**: `theme.colors.error.main`
- **Empty State Icon**: `theme.colors.gray[400]`

### Spacing
- Card margin: `theme.spacing.md`
- Button padding: `theme.spacing.md`
- Content padding: `theme.spacing.md`
- Empty state padding: `theme.spacing.xl * 3`

### Typography
- Card title: `theme.typography.fontSize.lg`, semiBold
- Address text: `theme.typography.fontSize.sm`, secondary color
- Button text: `theme.typography.fontSize.md`, semiBold
- Empty state title: `theme.typography.fontSize.xl`, bold

## Toast Notifications

The screen uses toast notifications for feedback:

- ✅ **Success**: "Address deleted successfully"
- ✅ **Success**: "Default address updated"
- ❌ **Error**: "Failed to delete address"
- ❌ **Error**: "Failed to set default address"
- ℹ️ **Info**: "Add address form coming soon"
- ℹ️ **Info**: "Edit address form coming soon"

## Future Enhancements

### TODO Items

1. **Add Address Form**
   - Create `AddAddressScreen.tsx`
   - Form with all address fields
   - Country and state dropdowns
   - Validation
   - Save to API

2. **Edit Address Form**
   - Reuse add form with pre-filled data
   - Update API call
   - Navigate back on success

3. **Address Validation**
   - Validate postal codes by country
   - Validate phone numbers
   - Required field validation

4. **Search/Filter**
   - Search addresses by name or location
   - Filter by default/non-default

5. **Address Selection**
   - Use in checkout flow
   - Radio button selection
   - Quick select for default

6. **Map Integration**
   - Show address on map
   - Pin location picker
   - Auto-complete address

## Testing Checklist

### Manual Testing

- ✅ Sidebar shows "Addresses" menu item when logged in
- ✅ Sidebar hides "Addresses" when logged out
- ✅ Tapping "Addresses" navigates to addresses screen
- ✅ Empty state shows when no addresses
- ✅ "Add New Address" button is full width
- ✅ Address cards display correctly
- ✅ Default badge shows on default address
- ✅ "Set Default" button hidden on default address
- ✅ Delete confirmation dialog appears
- ✅ Delete removes address from list
- ✅ Set default updates UI
- ✅ Pull-to-refresh works
- ✅ Loading spinner shows while fetching
- ✅ Error message shows on API failure
- ✅ Toast notifications appear correctly

### API Testing

Test with different scenarios:
1. **No addresses**: Empty state
2. **One address**: Single card, no "Set Default"
3. **Multiple addresses**: All cards, one default
4. **Delete last address**: Shows empty state
5. **Network error**: Shows error message
6. **Unauthorized**: Redirects to login

## Translations

Added to `en.json`:
```json
{
  "drawer": {
    "addresses": "Addresses"
  }
}
```

Existing translations used:
- `common.cancel`
- `common.delete`
- `common.edit`
- `common.retry`
- `common.loading`

## Dependencies

### Existing
- `@expo/vector-icons` - Icons
- `expo-router` - Navigation
- `react-i18next` - Translations
- Custom components: Card, LoadingSpinner, ErrorMessage, Toast

### No New Dependencies Required
All features implemented using existing dependencies.

## Summary

✅ **Implemented:**
- Address types and interfaces
- Address API service with all CRUD operations
- AddressCard component with actions
- AddressesScreen with list and empty state
- Sidebar menu integration
- Toast notifications
- Pull-to-refresh
- Loading and error states

⏳ **Pending:**
- Add/Edit address form
- Form validation
- Address selection for checkout
- Map integration

The address management feature is now functional and ready for use. Users can view, delete, and set default addresses. The add/edit functionality requires a form screen to be implemented next.

