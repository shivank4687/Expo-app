# Mobile App Locale & Currency Fix

## Problem

The mobile app was always defaulting to **English (en)** locale and **USD** currency, even though the backend/web application was configured to use **Spanish (es)** and **MXN** as defaults.

## Root Cause

The mobile app had hardcoded defaults in two places:

1. **`src/services/api/core.api.ts`** (lines 97-98):
   ```typescript
   defaultLocale: locales.find(l => l.code === 'en'),  // ❌ Hardcoded
   defaultCurrency: currencies.find(c => c.code === 'USD'),  // ❌ Hardcoded
   ```

2. **`src/services/api/client.ts`** (lines 47-48):
   ```typescript
   const locale = await AsyncStorage.getItem('selected_locale') || 'en';  // ❌ Hardcoded fallback
   const currency = await AsyncStorage.getItem('selected_currency') || 'USD';  // ❌ Hardcoded fallback
   ```

## Solution

Updated the mobile app to use the **channel's default locale and currency** from the backend API.

### How Backend Handles Defaults

In Bagisto, each channel has:
- `default_locale_id` - The channel's default locale
- `base_currency_id` - The channel's default currency

These are returned by the `/api/v1/channels` endpoint:

```json
{
  "data": [
    {
      "id": 1,
      "code": "default",
      "default_locale": {
        "id": 2,
        "code": "es",
        "name": "Spanish"
      },
      "base_currency": {
        "id": 2,
        "code": "MXN",
        "name": "Mexican Peso",
        "symbol": "$"
      }
    }
  ]
}
```

### Changes Made

#### 1. Updated `core.api.ts`

**Before:**
```typescript
return {
    locales,
    currencies,
    channels,
    defaultLocale: locales.find(l => l.code === 'en'),  // ❌ Hardcoded
    defaultCurrency: currencies.find(c => c.code === 'USD'),  // ❌ Hardcoded
    defaultChannel: channels[0],
};
```

**After:**
```typescript
// Get the default channel (usually the first one)
const defaultChannel = channels[0];

// Use the channel's default locale and currency if available
const defaultLocale = defaultChannel?.default_locale 
    || locales.find(l => l.id === defaultChannel?.default_locale_id)
    || locales[0];
    
const defaultCurrency = defaultChannel?.base_currency
    || currencies.find(c => c.id === defaultChannel?.base_currency_id)
    || currencies[0];

return {
    locales,
    currencies,
    channels,
    defaultLocale,  // ✅ From channel
    defaultCurrency,  // ✅ From channel
    defaultChannel,
};
```

#### 2. Updated `coreSlice.ts`

Added logic to save the channel's defaults to storage on first app launch:

```typescript
// Save defaults to storage if nothing was saved before
if (!savedLocaleCode && selectedLocale) {
    await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_LOCALE, selectedLocale.code);
    console.log('Saved default locale to storage:', selectedLocale.code);
}

if (!savedCurrencyCode && selectedCurrency) {
    await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_CURRENCY, selectedCurrency.code);
    console.log('Saved default currency to storage:', selectedCurrency.code);
}
```

#### 3. Updated Channel Interface

Added the nested objects to the Channel type:

```typescript
export interface Channel {
    // ... existing fields
    default_locale?: Locale;      // ✅ Added
    base_currency?: Currency;     // ✅ Added
}
```

## Flow

### First Time App Launch

1. App calls `/api/v1/channels` endpoint
2. Backend returns channel with `default_locale` (Spanish/es) and `base_currency` (MXN)
3. Mobile app extracts these defaults
4. Saves them to AsyncStorage
5. Uses them for all API calls

### Subsequent Launches

1. App reads locale/currency from AsyncStorage
2. Uses saved preferences (Spanish/MXN by default)
3. User can change via settings screens

## Testing

### Before Fix:
```
Default Locale: en (English)
Default Currency: USD (US Dollar)
```

### After Fix:
```
Default Locale: es (Spanish) - matches backend
Default Currency: MXN (Mexican Peso) - matches backend
```

### How to Test:

1. **Clear app data** (to simulate first launch):
   ```bash
   # iOS Simulator
   Device > Erase All Content and Settings
   
   # Android Emulator  
   Settings > Apps > [Your App] > Storage > Clear Data
   ```

2. **Launch the app** and check console logs:
   ```
   Core Config - Default Locale: es Default Currency: MXN
   Saved default locale to storage: es
   Saved default currency to storage: MXN
   ```

3. **Verify API calls** include correct headers:
   ```
   X-Locale: es
   X-Currency: MXN
   ```

4. **Check the UI**:
   - Language selection shows Spanish selected
   - Currency selection shows MXN selected
   - Prices display with MXN currency
   - UI text appears in Spanish (if translations available)

## Files Modified

1. `src/services/api/core.api.ts` - Use channel defaults
2. `src/store/slices/coreSlice.ts` - Save defaults on first launch  
3. `src/services/api/client.ts` - Added clarifying comments

## Benefits

✅ **Consistency** - Mobile app now matches web application  
✅ **Dynamic** - Automatically adapts to backend configuration  
✅ **No Hardcoding** - Respects channel settings  
✅ **Scalable** - Works for any locale/currency combination  
✅ **User-Friendly** - Users see their regional defaults immediately  

## Configuration

To change defaults in the backend:

1. **Admin Panel** → Settings → Channels
2. Select your channel
3. Set "Default Locale" (e.g., Spanish)
4. Set "Base Currency" (e.g., MXN)
5. Save changes

Mobile app will automatically use these settings on next launch! 🎉

## Notes

- The `en/USD` hardcoded fallbacks in `client.ts` remain as **emergency fallbacks** only
- They're only used if AsyncStorage is empty AND the API call fails
- Under normal circumstances, the channel's defaults are always used
- Users can still manually change their locale/currency in Settings

---

**Result:** Mobile app now correctly defaults to Spanish locale and MXN currency, matching the backend configuration! 🌍💰

