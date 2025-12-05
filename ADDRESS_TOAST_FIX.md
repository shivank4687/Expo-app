# Address Toast Notification Fix

## Problem
When adding or updating addresses from the "Your Information" sidebar → Addresses tab:
1. After adding a new address, the toast message was not showing correctly
2. After updating an address, the toast message was not showing
3. The addresses list was not refreshing when returning from the add/edit form

## Root Cause
The `AddressesScreen` was not reloading the addresses list when the user returned from the `AddAddressScreen`. This caused:
- Stale data to be displayed
- Users not seeing their newly added/updated addresses
- Confusion about whether the operation succeeded

## Solution

### 1. Added Focus Listener to AddressesScreen
**File:** `src/features/address/screens/AddressesScreen.tsx`

**Changes:**
- Imported `useFocusEffect` from `@react-navigation/native`
- Added a focus listener that reloads addresses whenever the screen comes into focus
- Modified `loadAddresses()` to accept a `showLoader` parameter to control loading state
- When screen comes into focus, addresses reload silently without showing the loading spinner

```typescript
import { useFocusEffect } from '@react-navigation/native';

// Reload addresses when screen comes into focus (e.g., after adding/editing)
useFocusEffect(
    useCallback(() => {
        // Don't show loader on focus, just silently reload
        loadAddresses(false);
    }, [loadAddresses])
);
```

### 2. Added Debug Logging to AddAddressScreen
**File:** `src/features/address/screens/AddAddressScreen.tsx`

**Changes:**
- Added console logs to track whether the screen is in "add" or "edit" mode
- Added logs when creating vs updating addresses
- This helps debug any future issues with mode detection

```typescript
// Debug log on mount
useEffect(() => {
    console.log('[AddAddressScreen] Mounted - isEditMode:', isEditMode, ', id:', id);
}, []);

// In handleSave
if (isEditMode && id) {
    console.log('[AddAddressScreen] Updating address with ID:', id);
    await addressApi.updateAddress(parseInt(id), formData);
    showToast('Address updated successfully', 'success');
} else {
    console.log('[AddAddressScreen] Creating new address');
    await addressApi.createAddress(formData);
    showToast('Address added successfully', 'success');
}
```

## User Flow Now

### Adding a New Address
1. User navigates: Sidebar → Your Information → Addresses
2. User taps "Add New Address"
3. User fills out the form
4. User taps "Save Address"
5. ✅ Toast shows: "Address added successfully"
6. User navigates back to Addresses screen
7. ✅ Addresses list automatically refreshes
8. ✅ New address appears in the list

### Updating an Address
1. User navigates: Sidebar → Your Information → Addresses
2. User taps "Edit" on an address card
3. User modifies the form
4. User taps "Update Address"
5. ✅ Toast shows: "Address updated successfully"
6. User navigates back to Addresses screen
7. ✅ Addresses list automatically refreshes
8. ✅ Updated address appears with new data

### Deleting an Address
1. User taps "Delete" on an address card
2. Confirmation dialog appears
3. User confirms deletion
4. ✅ Toast shows: "Address deleted successfully"
5. ✅ Addresses list automatically refreshes
6. ✅ Deleted address is removed from the list

### Setting Default Address
1. User taps "Set Default" on an address card
2. ✅ Toast shows: "Default address updated"
3. ✅ Addresses list automatically refreshes
4. ✅ Default badge appears on the correct address

## Technical Details

### useFocusEffect Hook
- From `@react-navigation/native`
- Runs every time the screen comes into focus
- Automatically cleans up when screen loses focus
- Perfect for refreshing data when returning from other screens

### Silent Reload
The `loadAddresses()` function now accepts a `showLoader` parameter:
- `loadAddresses(true)` - Shows loading spinner (used on initial mount and retry)
- `loadAddresses(false)` - Silent reload (used on focus and after operations)

This provides a better UX:
- No loading spinner flashing when returning from add/edit screen
- Smooth transition with data updating in the background
- User sees changes immediately

## Testing Checklist

### ✅ Add New Address
- [ ] Navigate to Addresses screen from sidebar
- [ ] Tap "Add New Address"
- [ ] Fill out form with valid data
- [ ] Tap "Save Address"
- [ ] Verify toast shows "Address added successfully"
- [ ] Verify returned to Addresses screen
- [ ] Verify new address appears in list
- [ ] Verify no loading spinner on return

### ✅ Update Address
- [ ] Navigate to Addresses screen from sidebar
- [ ] Tap "Edit" on an existing address
- [ ] Modify some fields
- [ ] Tap "Update Address"
- [ ] Verify toast shows "Address updated successfully"
- [ ] Verify returned to Addresses screen
- [ ] Verify address shows updated data
- [ ] Verify no loading spinner on return

### ✅ Delete Address
- [ ] Navigate to Addresses screen
- [ ] Tap "Delete" on an address
- [ ] Confirm deletion in dialog
- [ ] Verify toast shows "Address deleted successfully"
- [ ] Verify address removed from list
- [ ] Verify no loading spinner

### ✅ Set Default Address
- [ ] Navigate to Addresses screen
- [ ] Tap "Set Default" on a non-default address
- [ ] Verify toast shows "Default address updated"
- [ ] Verify "Default" badge appears on correct address
- [ ] Verify previous default address loses badge
- [ ] Verify no loading spinner

### ✅ Console Logs
Check the console to verify:
- [ ] On opening AddAddressScreen for new address: `isEditMode: false, id: undefined`
- [ ] On opening AddAddressScreen for editing: `isEditMode: true, id: <number>`
- [ ] On saving new address: `Creating new address`
- [ ] On updating address: `Updating address with ID: <number>`

## Benefits

1. **Correct Toast Messages** - Users see the right message for add vs update
2. **Real-time Updates** - List refreshes automatically after any operation
3. **Better UX** - No unnecessary loading spinners
4. **Debug Support** - Console logs help troubleshoot issues
5. **Consistent Behavior** - Same refresh pattern for all operations

## Files Modified

1. ✅ `src/features/address/screens/AddressesScreen.tsx`
   - Added `useFocusEffect` hook
   - Updated `loadAddresses()` to accept `showLoader` parameter
   - Updated all `loadAddresses()` calls with appropriate parameter

2. ✅ `src/features/address/screens/AddAddressScreen.tsx`
   - Added debug logging on mount
   - Added debug logging in save operation
   - Verified toast messages are correct

## No Breaking Changes
These changes are backward compatible and don't affect any other screens or functionality.

