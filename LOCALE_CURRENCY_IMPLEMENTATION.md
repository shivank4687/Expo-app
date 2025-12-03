# Locale, Currency & Theme Implementation

## Overview
This document explains the implementation of locale (language) and currency selection features in the mobile app, fully integrated with Bagisto REST API.

## Features Implemented

### ✅ 1. Core Settings Management
- **Redux Slice**: `coreSlice.ts` manages locale, currency, and channel state
- **Persistence**: Selected preferences are saved to AsyncStorage and persist across app restarts
- **API Integration**: Fetches available locales and currencies from Bagisto REST API

### ✅ 2. API Client Enhancement
- **Automatic Headers**: Every API request now includes:
  - `X-Locale`: Current selected locale code (e.g., 'en', 'es', 'fr')
  - `X-Currency`: Current selected currency code (e.g., 'USD', 'EUR', 'INR')
- **Dynamic Updates**: Headers update automatically when user changes preferences

### ✅ 3. Language Selection
- **Screen**: `LanguageSelectionScreen.tsx`
- **Features**:
  - Fetches available languages from Bagisto API (`/api/v1/locales`)
  - Displays current selection with checkmark
  - Saves selection to Redux store and AsyncStorage
  - Shows confirmation alert after changing language

### ✅ 4. Currency Selection
- **Screen**: `CurrencySelectionScreen.tsx`
- **Features**:
  - Fetches available currencies from Bagisto API (`/api/v1/currencies`)
  - Displays currency name, code, and symbol
  - Highlights current selection
  - Saves selection to Redux store and AsyncStorage
  - Shows confirmation after changing currency

### ✅ 5. Drawer Sidebar Integration
- **Current Selection Display**: Shows selected language and currency in the Preferences section
- **Easy Access**: Users can quickly see and change their preferences from the sidebar
- **Auto-initialization**: Core config loads automatically when drawer opens

## File Structure

```
src/
├── services/api/
│   ├── core.api.ts              # Core API service (locales, currencies, channels)
│   └── client.ts                # Enhanced API client with locale/currency headers
├── store/
│   ├── slices/
│   │   └── coreSlice.ts         # Redux slice for core settings
│   └── store.ts                 # Updated to include core reducer
├── features/settings/screens/
│   ├── LanguageSelectionScreen.tsx
│   └── CurrencySelectionScreen.tsx
└── shared/components/
    ├── CustomDrawerContent.tsx   # Updated with current selections
    └── DrawerSection.tsx         # Enhanced to support rightText prop
```

## How It Works

### 1. App Initialization
When the app starts or drawer opens:
```typescript
dispatch(fetchCoreConfig());
```
This loads:
- All available locales from `/api/v1/locales`
- All available currencies from `/api/v1/currencies`
- All available channels from `/api/v1/channels`
- Retrieves saved preferences from AsyncStorage

### 2. API Request Flow
Every API request automatically includes locale and currency:
```
GET /api/v1/products
Headers:
  X-Locale: en
  X-Currency: USD
  Authorization: Bearer <token>
```

### 3. Changing Language
1. User navigates to Language Selection screen
2. Selects a language
3. Redux action `setLocale(locale)` is dispatched
4. Locale is saved to AsyncStorage
5. All subsequent API requests use new locale
6. Confirmation alert shown to user

### 4. Changing Currency
1. User navigates to Currency Selection screen
2. Selects a currency
3. Redux action `setCurrency(currency)` is dispatched
4. Currency is saved to AsyncStorage
5. All subsequent API requests use new currency
6. Product prices automatically reflect new currency

## Redux State Structure

```typescript
{
  core: {
    locales: Locale[],
    currencies: Currency[],
    channels: Channel[],
    selectedLocale: Locale | null,
    selectedCurrency: Currency | null,
    selectedChannel: Channel | null,
    isLoading: boolean,
    error: string | null
  }
}
```

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/locales` | GET | Fetch available locales |
| `/api/v1/currencies` | GET | Fetch available currencies |
| `/api/v1/channels` | GET | Fetch available channels |

## How Bagisto Handles Locale & Currency

### Locale Middleware
Bagisto's REST API includes middleware that:
- Reads `X-Locale` header from requests
- Sets the application locale for that request
- Returns translated content (product names, descriptions, etc.)
- Supports RTL languages (Arabic, Hebrew, etc.)

### Currency Middleware
Bagisto's REST API includes middleware that:
- Reads `X-Currency` header from requests
- Converts all prices to the requested currency
- Uses exchange rates configured in Bagisto admin
- Returns formatted prices with correct symbols

## Usage Examples

### Accessing Current Locale in Components
```typescript
import { useAppSelector } from '@/store/hooks';

const MyComponent = () => {
  const { selectedLocale } = useAppSelector((state) => state.core);
  
  return <Text>Current Language: {selectedLocale?.name}</Text>;
};
```

### Accessing Current Currency in Components
```typescript
import { useAppSelector } from '@/store/hooks';

const ProductCard = ({ product }) => {
  const { selectedCurrency } = useAppSelector((state) => state.core);
  
  return (
    <Text>Price: {selectedCurrency?.symbol}{product.price}</Text>
  );
};
```

### Manually Changing Locale
```typescript
import { useAppDispatch } from '@/store/hooks';
import { setLocale } from '@/store/slices/coreSlice';

const changeToSpanish = async () => {
  await dispatch(setLocale({
    id: 2,
    code: 'es',
    name: 'Español',
    direction: 'ltr'
  })).unwrap();
};
```

## Testing

### 1. Test Language Selection
1. Open the app
2. Open drawer menu
3. Go to Preferences → Language
4. Select a different language
5. Confirm the change
6. Verify that:
   - Selection is saved
   - Drawer shows new language
   - API requests include correct X-Locale header

### 2. Test Currency Selection
1. Open the app
2. Open drawer menu
3. Go to Preferences → Currency
4. Select a different currency
5. Confirm the change
6. Verify that:
   - Selection is saved
   - Drawer shows new currency
   - Product prices update to new currency

### 3. Test Persistence
1. Change language and currency
2. Close the app completely
3. Reopen the app
4. Verify that selections are still active

## Future Enhancements

### Potential Improvements
1. **RTL Support**: Add full RTL layout support for Arabic/Hebrew
2. **Multi-language Content**: Implement i18n for app's UI text
3. **Exchange Rates**: Display real-time exchange rates
4. **Theme Switching**: Add dark/light theme support
5. **Region Settings**: Add date/time format preferences
6. **Flag Icons**: Show country flags next to languages

### Theme Implementation (Future)
```typescript
// Future theme support
export const setTheme = createAsyncThunk(
  'core/setTheme',
  async (theme: 'light' | 'dark', { rejectWithValue }) => {
    await AsyncStorage.setItem('app_theme', theme);
    return theme;
  }
);
```

## Troubleshooting

### Issue: Languages not loading
**Solution**: Check Bagisto API is running and `/api/v1/locales` endpoint is accessible

### Issue: Currency not updating prices
**Solution**: Ensure Bagisto admin has configured exchange rates properly

### Issue: Selection not persisting
**Solution**: Check AsyncStorage permissions and clear app data/cache

### Issue: API errors
**Solution**: Verify API client headers are being sent correctly using network inspector

## API Response Examples

### Locales Response
```json
{
  "data": [
    {
      "id": 1,
      "code": "en",
      "name": "English",
      "direction": "ltr"
    },
    {
      "id": 2,
      "code": "es",
      "name": "Español",
      "direction": "ltr"
    }
  ]
}
```

### Currencies Response
```json
{
  "data": [
    {
      "id": 1,
      "code": "USD",
      "name": "US Dollar",
      "symbol": "$"
    },
    {
      "id": 2,
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    }
  ]
}
```

## Summary

✅ **Complete Integration**: Mobile app now fully integrated with Bagisto's locale and currency system
✅ **Automatic Headers**: All API requests include locale and currency preferences
✅ **User-Friendly**: Easy selection with visual feedback
✅ **Persistent**: Preferences saved across app restarts
✅ **Scalable**: Easy to extend with additional preferences (theme, region, etc.)

The implementation follows best practices:
- Redux for state management
- AsyncStorage for persistence
- Type-safe with TypeScript
- Clean separation of concerns
- Reusable components

