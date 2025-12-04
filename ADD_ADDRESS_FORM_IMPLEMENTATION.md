# Add/Edit Address Form Implementation

## Overview

This document describes the implementation of the add and edit address form screen with all required fields, validation, and country/state dropdowns.

## Features Implemented

### 1. **Add Address Screen** (`AddAddressScreen.tsx`)
- Comprehensive form with all required fields
- Real-time validation
- Country dropdown with all countries
- Dynamic state dropdown based on selected country
- Set as default checkbox
- Save button with loading state
- Edit mode support (reuses same screen)

### 2. **Core API Service** (`core.api.ts`)
- Get all countries
- Get states by country code
- Used for populating dropdowns

### 3. **Form Fields**

#### Required Fields (marked with *)
1. **First Name** - Text input
2. **Last Name** - Text input
3. **Email** - Email input with validation
4. **Phone** - Phone number input
5. **Street Address** - Text input
6. **Country** - Dropdown (picker)
7. **State** - Dropdown or text input (based on country)
8. **City** - Text input
9. **Zip/Postal Code** - Text input

#### Optional Fields
1. **Company Name** - Text input
2. **VAT ID** - Text input
3. **Set as Default** - Checkbox

## Form Layout

```
┌─────────────────────────────────┐
│ Add New Address                 │ ← Header
├─────────────────────────────────┤
│                                 │
│ First Name *                    │
│ [_________________________]     │
│                                 │
│ Last Name *                     │
│ [_________________________]     │
│                                 │
│ Email *                         │
│ [_________________________]     │
│                                 │
│ Phone *                         │
│ [_________________________]     │
│                                 │
│ Company Name                    │
│ [_________________________]     │
│                                 │
│ Street Address *                │
│ [_________________________]     │
│                                 │
│ VAT ID                          │
│ [_________________________]     │
│                                 │
│ Country *                       │
│ [▼ Select Country__________]    │
│                                 │
│ State *                         │
│ [▼ Select State____________]    │
│   or                            │
│ [_________________________]     │ ← Text input if no states
│                                 │
│ City *                          │
│ [_________________________]     │
│                                 │
│ Zip/Postal Code *               │
│ [_________________________]     │
│                                 │
│ ☐ Set as default address        │
│                                 │
│ [  Save Address  ]              │ ← Full width button
│                                 │
└─────────────────────────────────┘
```

## Validation Rules

Based on Bagisto's `AddressRequest` validation:

| Field | Rules |
|-------|-------|
| first_name | Required |
| last_name | Required |
| email | Required, Valid email format |
| phone | Required, Valid phone number |
| company_name | Optional |
| address1 | Required, Array with at least 1 element |
| vat_id | Optional, VAT ID format |
| country | Required |
| state | Required |
| city | Required |
| postcode | Required |
| default_address | Optional, Boolean |

### Validation Messages

```typescript
{
    first_name: 'First name is required',
    last_name: 'Last name is required',
    email: 'Email is required' / 'Email is invalid',
    phone: 'Phone number is required',
    address1: 'Street address is required',
    country: 'Country is required',
    state: 'State is required',
    city: 'City is required',
    postcode: 'Postal code is required',
}
```

## API Integration

### Countries API

**Endpoint**: `GET /api/v1/countries`

**Parameters**:
- `pagination=0` - Get all countries without pagination

**Response**:
```json
{
    "data": [
        {
            "id": "1",
            "code": "US",
            "name": "United States"
        },
        {
            "id": "2",
            "code": "IN",
            "name": "India"
        }
    ]
}
```

### States API

**Endpoint**: `GET /api/v1/countries-states`

**Parameters**:
- `pagination=0` - Get all states
- `country_code=US` - Filter by country code

**Response**:
```json
{
    "data": [
        {
            "id": 1,
            "country_id": "1",
            "country_code": "US",
            "code": "CA",
            "default_name": "California"
        },
        {
            "id": 2,
            "country_id": "1",
            "country_code": "US",
            "code": "NY",
            "default_name": "New York"
        }
    ]
}
```

### Create Address API

**Endpoint**: `POST /api/v1/customer/addresses`

**Body**:
```json
{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "company_name": "Acme Inc",
    "address": ["123 Main St"],
    "vat_id": "VAT123",
    "country": "US",
    "state": "CA",
    "city": "Los Angeles",
    "postcode": "90001",
    "default_address": true
}
```

### Update Address API

**Endpoint**: `PUT /api/v1/customer/addresses/{id}`

**Body**: Same as create

## User Flow

### Add New Address

```
Addresses Screen
    ↓ Tap "Add New Address"
Add Address Screen
    ↓ Fill form
    ↓ Select country
    ↓ Select state (loads dynamically)
    ↓ Tap "Save Address"
    ↓ Validation
    ↓ API Call
    ↓ Success Toast
    ↓ Navigate back
Addresses Screen (refreshed)
```

### Edit Address

```
Addresses Screen
    ↓ Tap "Edit" on address card
Add Address Screen (Edit Mode)
    ↓ Load address data
    ↓ Pre-fill form
    ↓ Modify fields
    ↓ Tap "Update Address"
    ↓ Validation
    ↓ API Call
    ↓ Success Toast
    ↓ Navigate back
Addresses Screen (refreshed)
```

## Dynamic State Loading

The form intelligently handles states based on country selection:

### Scenario 1: Country with States
```
1. User selects "United States"
2. Loading indicator appears
3. States API called with country_code="US"
4. State dropdown populated
5. User selects state from dropdown
```

### Scenario 2: Country without States
```
1. User selects country without states
2. States API called (returns empty)
3. State field shows as text input
4. User manually enters state name
```

## Component Features

### Real-time Validation
- Errors cleared when user starts typing
- Errors shown on blur or submit
- Visual feedback with red borders

### Loading States
- Initial loading (edit mode)
- Saving indicator on button
- Loading states indicator
- Disabled inputs while loading

### Keyboard Handling
- Appropriate keyboard types:
  - `email-address` for email
  - `phone-pad` for phone
  - `default` for text fields
- `keyboardShouldPersistTaps="handled"` for better UX
- Auto-capitalize off for email

### Platform Differences
- iOS: Picker height = 150px
- Android: Picker height = 50px
- Input padding adjusted per platform

## Styling

### Colors
- **Primary**: `theme.colors.primary[500]` - Buttons, checkboxes
- **Error**: `theme.colors.error.main` - Validation errors
- **Border**: `theme.colors.gray[300]` - Input borders
- **Text**: `theme.colors.text.primary` - Labels, inputs
- **Placeholder**: `theme.colors.text.secondary` - Placeholders

### Spacing
- Form group margin: `theme.spacing.lg`
- Input padding: `theme.spacing.md`
- Label margin: `theme.spacing.xs`
- Container padding: `theme.spacing.md`

## Error Handling

### Validation Errors
```typescript
// Shown inline below each field
<Text style={styles.errorText}>{errors.field_name}</Text>
```

### API Errors
```typescript
// Shown as toast notification
showToast('Failed to save address', 'error');
```

### Network Errors
```typescript
// Caught and displayed to user
catch (error: any) {
    showToast(error.message || 'Failed to save address', 'error');
}
```

## Toast Notifications

| Action | Type | Message |
|--------|------|---------|
| Create Success | success | "Address added successfully" |
| Update Success | success | "Address updated successfully" |
| Create/Update Error | error | "Failed to save address" |
| Load Countries Error | error | "Failed to load countries" |
| Load Address Error | error | "Failed to load address" |
| Validation Error | error | "Please fix the errors in the form" |

## Dependencies

### Required Package
```bash
npm install @react-native-picker/picker
```

### Imports
```typescript
import { Picker } from '@react-native-picker/picker';
```

## Files Created/Modified

### Created
1. ✅ `src/services/api/core.api.ts` - Countries/states API
2. ✅ `src/features/address/screens/AddAddressScreen.tsx` - Form screen
3. ✅ `app/add-address.tsx` - Route file

### Modified
1. ✅ `src/features/address/screens/AddressesScreen.tsx` - Navigation to form
2. ✅ `src/features/address/types/address.types.ts` - Already had types

## Testing Checklist

### Form Validation
- ✅ Required fields show error when empty
- ✅ Email validation works
- ✅ Errors clear when typing
- ✅ Form doesn't submit with errors
- ✅ Success toast shows on save

### Country/State Dropdowns
- ✅ Countries load on mount
- ✅ States load when country selected
- ✅ States dropdown shows for countries with states
- ✅ Text input shows for countries without states
- ✅ State field clears when country changes
- ✅ Loading indicator shows while loading states

### Navigation
- ✅ "Add New Address" navigates to form
- ✅ "Edit" navigates to form with ID
- ✅ Form loads address data in edit mode
- ✅ Back button returns to addresses list
- ✅ Save navigates back to addresses list

### Add Address
- ✅ All fields empty initially
- ✅ Can fill all fields
- ✅ Checkbox toggles
- ✅ Save creates new address
- ✅ Success toast shows
- ✅ Returns to addresses list
- ✅ New address appears in list

### Edit Address
- ✅ Form pre-fills with address data
- ✅ Country and state pre-selected
- ✅ Can modify fields
- ✅ Save updates address
- ✅ Success toast shows
- ✅ Returns to addresses list
- ✅ Updated address reflects changes

### Edge Cases
- ✅ Network error handling
- ✅ Empty countries list
- ✅ Empty states list
- ✅ Invalid address ID (edit mode)
- ✅ Rapid country switching
- ✅ Form submission while loading

## Known Limitations

1. **Picker Package**: Requires `@react-native-picker/picker` to be installed
2. **Email Field**: Not returned by address GET API, so empty in edit mode
3. **Multiple Address Lines**: Currently only supports one address line
4. **VAT Validation**: No client-side VAT format validation
5. **Phone Validation**: Basic validation, no country-specific format

## Future Enhancements

1. **Address Autocomplete**: Google Places API integration
2. **Map View**: Show address on map
3. **Multiple Address Lines**: Support for address line 2, 3, etc.
4. **Phone Formatting**: Country-specific phone number formatting
5. **Postal Code Validation**: Country-specific postal code validation
6. **Save Draft**: Auto-save form data locally
7. **Address Templates**: Quick fill from templates
8. **Geolocation**: Auto-detect current location

## Summary

✅ **Complete address form implementation** with:
- All required fields from web application
- Real-time validation matching backend rules
- Country dropdown with all countries
- Dynamic state dropdown
- Set as default checkbox
- Edit mode support
- Loading states
- Error handling
- Toast notifications
- Clean, user-friendly UI

The form is production-ready and matches the web application's functionality!

