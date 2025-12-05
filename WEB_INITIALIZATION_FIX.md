# Web Browser Initialization Fix

## 🐛 Problem

When opening the app in a web browser (http://localhost:8081/), the following API calls were NOT happening:
- ❌ Locale API call
- ❌ Currency API call  
- ❌ Channel API call
- ❌ Customizations (theme) API call

**Result:** Nothing loads, even after opening the drawer.

---

## 🔍 Root Causes

### Issue 1: Missing API Function
The `getCoreConfig()` function was **completely missing** from `core.api.ts`! This caused:
- Import errors in `coreSlice.ts`
- `fetchCoreConfig()` thunk to fail silently
- No API calls being made at all

### Issue 2: Initialization Timing

The issue was in the **initialization sequence**:

### Mobile App (Working ✅)
1. App loads → User sees home screen
2. User opens drawer → `CustomDrawerContent` mounts
3. `CustomDrawerContent` calls `fetchCoreConfig()` 
4. Locale/Currency/Channels are loaded
5. Home screen detects `selectedLocale` and loads customizations

### Web Browser (Broken ❌)
1. App loads → User sees home screen directly
2. **Drawer never opens** (users don't typically open drawer on web)
3. `fetchCoreConfig()` **never called**
4. `selectedLocale` remains `null`
5. Home screen checks `if (!selectedLocale?.code) return;` 
6. **Customizations never load** ❌

### The Code Flow

**HomeScreen.tsx** (line 28-29):
```typescript
const loadData = useCallback(async () => {
    if (!selectedLocale?.code) return; // ❌ Exits early if no locale
    
    try {
        const customizationsData = await themeApi.getCustomizations();
        // ...
    }
}, [selectedLocale?.code]);
```

**CustomDrawerContent.tsx** (old code - line 27):
```typescript
useEffect(() => {
    // Initialize core config (locale, currency) if not loaded
    dispatch(fetchCoreConfig()); // ❌ Only called when drawer opens
}, [dispatch]);
```

---

## ✅ Solution Implemented

### 1. **Added Missing getCoreConfig() Function**

Added the complete `getCoreConfig()` function to `core.api.ts`:

```typescript
export interface Locale {
    id: number;
    code: string;
    name: string;
    direction?: string;
}

export interface Currency {
    id: number;
    code: string;
    name: string;
    symbol?: string;
}

export interface Channel {
    id: number;
    code: string;
    name: string;
    description?: string;
    hostname?: string;
    default_locale?: Locale;
    base_currency?: Currency;
}

export interface CoreConfig {
    locales: Locale[];
    currencies: Currency[];
    channels: Channel[];
    defaultLocale: Locale | null;
    defaultCurrency: Currency | null;
    defaultChannel: Channel | null;
}

async getCoreConfig(): Promise<CoreConfig> {
    // Fetch all core data in parallel
    const [localesResponse, currenciesResponse, channelsResponse] = await Promise.all([
        restApiClient.get<{ data: Locale[] }>('/locales'),
        restApiClient.get<{ data: Currency[] }>('/currencies'),
        restApiClient.get<{ data: Channel[] }>('/channels'),
    ]);

    const locales = localesResponse.data || [];
    const currencies = currenciesResponse.data || [];
    const channels = channelsResponse.data || [];

    // Get the default channel and use its default locale/currency
    const defaultChannel = channels[0];
    const defaultLocale = defaultChannel?.default_locale 
        ? locales.find(l => l.id === defaultChannel.default_locale?.id) || locales[0]
        : locales[0];
    const defaultCurrency = defaultChannel?.base_currency
        ? currencies.find(c => c.id === defaultChannel.base_currency?.id) || currencies[0]
        : currencies[0];

    return {
        locales,
        currencies,
        channels,
        defaultLocale,
        defaultCurrency,
        defaultChannel,
    };
}
```

### 2. **Initialize Core Config on App Start**

Updated `app/_layout.tsx` to call `fetchCoreConfig()` during app initialization:

**Before:**
```typescript
function AppContent() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(checkAuthThunk()); // Only auth check
  }, [dispatch]);
  // ...
}
```

**After:**
```typescript
function AppContent() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initialize core config (locale, currency, channels) on app start
    dispatch(fetchCoreConfig()); // ✅ Load config immediately
    // Check authentication status
    dispatch(checkAuthThunk());
  }, [dispatch]);
  // ...
}
```

### 3. **Optimize Drawer to Avoid Duplicate Calls**

Updated `CustomDrawerContent.tsx` to only fetch if config hasn't been loaded:

**Before:**
```typescript
useEffect(() => {
    // Initialize core config (locale, currency) if not loaded
    dispatch(fetchCoreConfig()); // ❌ Always called, even if already loaded
}, [dispatch]);
```

**After:**
```typescript
useEffect(() => {
    // Initialize core config only if not already loaded
    // This handles edge cases where app might not have loaded config yet
    if (!selectedLocale && !selectedCurrency) {
        dispatch(fetchCoreConfig()); // ✅ Only call if needed
    }
}, [dispatch, selectedLocale, selectedCurrency]);
```

---

## 🎯 What This Fixes

### Now on Web (and Mobile):
1. ✅ App loads → `fetchCoreConfig()` called immediately
2. ✅ Locale, Currency, Channels APIs are fetched
3. ✅ `selectedLocale` is set from channel defaults or saved preferences
4. ✅ Home screen detects locale and loads customizations
5. ✅ All API calls happen on initial load

### Additional Benefits:
- ✅ **Faster initial load** - Config loads immediately, not delayed until drawer opens
- ✅ **Works without drawer** - Web users don't need to open drawer first
- ✅ **No duplicate calls** - Drawer checks before re-fetching
- ✅ **Consistent behavior** - Web and mobile work the same way

---

## 📝 Files Changed

1. **`src/services/api/core.api.ts`** ⭐ **CRITICAL FIX**
   - Added `Locale`, `Currency`, `Channel`, `CoreConfig` interfaces
   - Added `getCoreConfig()` function that fetches locales, currencies, and channels
   - Uses channel's default locale/currency from backend
   - Fetches all data in parallel with `Promise.all()`

2. **`app/_layout.tsx`**
   - Added `import { fetchCoreConfig } from "@/store/slices/coreSlice";`
   - Added `dispatch(fetchCoreConfig());` in `useEffect` hook

3. **`src/shared/components/CustomDrawerContent.tsx`**
   - Updated `useEffect` to check `if (!selectedLocale && !selectedCurrency)` before calling
   - Added `selectedLocale` and `selectedCurrency` to dependency array
   - Prevents duplicate API calls when drawer opens

---

## 🧪 Testing

### Web Browser (http://localhost:8081/)
1. Open browser DevTools → Network tab
2. Load the app
3. ✅ Should see these API calls immediately:
   - `GET /api/v1/locales`
   - `GET /api/v1/currencies`
   - `GET /api/v1/channels`
   - `GET /api/theme-customizations`

### Mobile App
1. Launch app
2. ✅ Should see same API calls on launch
3. ✅ Home screen should load customizations
4. ✅ Opening drawer should NOT trigger duplicate API calls

---

## 🔑 Key Takeaway

**Always initialize core configuration at the root level**, not in child components that may or may not be rendered (like drawers). This ensures consistent behavior across all platforms (web, iOS, Android).

