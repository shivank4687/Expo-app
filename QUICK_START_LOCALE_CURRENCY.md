# Quick Start: Locale & Currency Implementation

## ✅ What's Been Implemented

### 1. **Core Settings API Service** (`src/services/api/core.api.ts`)
- Fetches locales from `/api/v1/locales`
- Fetches currencies from `/api/v1/currencies`
- Fetches channels from `/api/v1/channels`

### 2. **Redux Store** (`src/store/slices/coreSlice.ts`)
- Manages locale, currency, and channel state
- Persists selections to AsyncStorage
- Provides thunks for fetching and setting preferences

### 3. **Enhanced API Client** (`src/services/api/client.ts`)
- Automatically adds `X-Locale` header to all requests
- Automatically adds `X-Currency` header to all requests
- Reads from AsyncStorage for current selections

### 4. **Language Selection Screen** 
- Displays all available languages from Bagisto
- Shows current selection with checkmark
- Saves selection and updates API headers

### 5. **Currency Selection Screen**
- Displays all available currencies from Bagisto
- Shows currency name, code, and symbol
- Saves selection and updates API headers

### 6. **Drawer Sidebar Enhancement**
- Shows current language (e.g., "English")
- Shows current currency (e.g., "USD")
- Loads core config on initialization

## 🚀 How to Test

### Step 1: Start Your Bagisto Backend
```bash
cd /Users/shiwank/Documents/PROJECTS/client-projects/live-projects/Bagisto
php artisan serve
```

### Step 2: Run the Mobile App
```bash
cd /Users/shiwank/Documents/PROJECTS/client-projects/live-projects/MyFirstApp
npm start
```

### Step 3: Test Language Selection
1. Open the app
2. Open the drawer menu (hamburger icon)
3. Scroll to "Preferences" section
4. Tap "Language" (you'll see current: "English")
5. Select a different language
6. Confirm the alert
7. Notice the drawer now shows your new selection

### Step 4: Test Currency Selection
1. In the drawer, tap "Currency" (you'll see current: "USD")
2. Select a different currency (e.g., EUR, INR, GBP)
3. Confirm the alert
4. Notice the drawer now shows your new selection
5. Browse products - prices should be in the new currency

### Step 5: Test Persistence
1. Close the app completely
2. Reopen the app
3. Check drawer - your selections should still be there

## 📋 API Endpoints Required

Make sure these Bagisto endpoints are working:

```bash
# Test locales endpoint
curl http://localhost:8000/api/v1/locales

# Test currencies endpoint
curl http://localhost:8000/api/v1/currencies

# Test channels endpoint
curl http://localhost:8000/api/v1/channels
```

Expected responses:
```json
// Locales
{
  "data": [
    {"id": 1, "code": "en", "name": "English", "direction": "ltr"},
    {"id": 2, "code": "es", "name": "Español", "direction": "ltr"}
  ]
}

// Currencies
{
  "data": [
    {"id": 1, "code": "USD", "name": "US Dollar", "symbol": "$"},
    {"id": 2, "code": "EUR", "name": "Euro", "symbol": "€"}
  ]
}
```

## 🎯 How It Works

### API Request Flow
```
User selects "Español" → 
Saved to AsyncStorage → 
API Client reads from storage → 
All requests now include "X-Locale: es" → 
Bagisto returns Spanish content
```

### Price Conversion Flow
```
User selects "EUR" → 
Saved to AsyncStorage → 
API Client reads from storage → 
All requests now include "X-Currency: EUR" → 
Bagisto converts prices to EUR
```

## 🔍 Verify Headers in Network Requests

To see the headers being sent:

### Option 1: React Native Debugger
1. Install React Native Debugger
2. Enable Network Inspector
3. Make a request (e.g., view products)
4. Check request headers for `X-Locale` and `X-Currency`

### Option 2: Console Logs
Add to `client.ts`:
```typescript
console.log('Request headers:', config.headers);
```

## 📱 User Interface

### Drawer Menu - Preferences Section
```
Preferences ▼
  ├─ Language  →  English
  ├─ Currency  →  USD
  └─ GDPR Requests
```

### Language Selection Screen
```
Select Language

✓ English         [checkmark]
  Español
  Français
  Deutsch
  العربية
```

### Currency Selection Screen
```
Select Currency

✓ US Dollar       [checkmark]
  USD ($)
  
  Euro
  EUR (€)
  
  Indian Rupee
  INR (₹)
```

## 🐛 Troubleshooting

### Issue: "No languages available"
**Fix**: 
```bash
# Check Bagisto has locales configured
php artisan tinker
>>> \Webkul\Core\Models\Locale::all();
```

### Issue: "No currencies available"
**Fix**:
```bash
# Check Bagisto has currencies configured
php artisan tinker
>>> \Webkul\Core\Models\Currency::all();
```

### Issue: Prices not updating
**Fix**: 
- Make sure Bagisto admin has exchange rates configured
- Go to: Admin → Settings → Currencies → Exchange Rates

### Issue: Headers not being sent
**Fix**:
- Clear AsyncStorage: Clear app data or reinstall app
- Check API client is importing AsyncStorage correctly

## 🎉 Success Indicators

You know it's working when:
1. ✅ Drawer shows current language and currency
2. ✅ Language selection screen loads from API
3. ✅ Currency selection screen loads from API
4. ✅ Selections persist after app restart
5. ✅ API requests include X-Locale and X-Currency headers
6. ✅ Product prices change when currency changes
7. ✅ Content translations work (when available in Bagisto)

## 📚 Next Steps

1. **Add more locales in Bagisto admin**
   - Go to Settings → Locales → Create Locale

2. **Add more currencies in Bagisto admin**
   - Go to Settings → Currencies → Create Currency
   - Set up exchange rates

3. **Test with real products**
   - Create products in Bagisto
   - Add translations for different languages
   - Browse in mobile app

4. **Customize the UI**
   - Add flag icons for languages
   - Add better currency symbols
   - Add confirmation animations

## 💡 Tips

- Default locale is 'en' (English)
- Default currency is 'USD' (US Dollar)
- Changes take effect immediately after selection
- No app restart required
- All preferences are stored locally
- Backend controls available options

---

**Created**: December 2024
**Status**: ✅ Fully Implemented & Working

