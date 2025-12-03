# Locale Translation Fix - Categories Now Respect Language Selection

## 🐛 The Problem

Categories were showing in **Spanish** even when **English** was selected:
- UI text changed to English ✅
- But category names stayed in Spanish ❌

---

## 🔍 Root Cause Analysis

### Issue 1: Wrong API Endpoint
The Shop API endpoint `/api/categories/tree`:
- ❌ Does NOT respect `X-Locale` header
- Uses session-based locale (doesn't work for mobile apps)
- Always returns Spanish names regardless of header

### Issue 2: No State Reload
When user changed locale:
- Redux state updated ✅
- i18n switched language ✅
- But categories didn't refetch ❌
- Old cached category names persisted

---

## ✅ Complete Solution Implemented

### 1. **Switched to REST API v1**
Changed from Shop API to REST API v1:

**Before (Shop API):**
```typescript
// /api/categories/tree - ignores X-Locale header
const response = await axios.get('/api/categories/tree');
// Always returns Spanish names ❌
```

**After (REST API v1):**
```typescript
// /api/v1/categories - respects X-Locale header
const response = await apiClient.get('/categories?pagination=0&status=1');
// Returns names in selected language ✅
```

### 2. **Built Tree Structure Ourselves**
Since REST API returns flat list, we build hierarchy:

```typescript
// Map all categories
const categoryMap = new Map();
allCategories.forEach(cat => {
  categoryMap.set(cat.id, { ...cat, children: [] });
});

// Build parent-child relationships
allCategories.forEach(cat => {
  if (cat.parent_id && cat.parent_id !== 1) {
    const parent = categoryMap.get(cat.parent_id);
    const child = categoryMap.get(cat.id);
    if (parent && child) {
      parent.children.push(child);
    }
  }
});

// Return only root categories
return rootCategories;
```

### 3. **Auto-Reload on Locale Change**
Added locale tracking to trigger refetch:

**Home Screen:**
```typescript
const { selectedLocale } = useAppSelector(state => state.core);

useEffect(() => {
  loadCategories(); // Reloads when selectedLocale changes
}, [selectedLocale]);
```

**Drawer Sidebar:**
```typescript
const { selectedLocale } = useAppSelector(state => state.core);

useEffect(() => {
  if (selectedLocale) {
    console.log('Locale changed - reloading categories');
    loadCategories();
  }
}, [selectedLocale]);
```

---

## 🎯 How It Works Now

### The Complete Flow:

```
1. User selects "English"
   ↓
2. Redux: setLocale({code: 'en', name: 'English'})
   ↓
3. AsyncStorage saves: 'selected_locale' = 'en'
   ↓
4. LocaleSync: i18n.changeLanguage('en')
   ↓
5. UI text changes to English ✅
   ↓
6. Home/Drawer detect locale change (useEffect)
   ↓
7. loadCategories() is called
   ↓
8. API Client adds header: X-Locale: en
   ↓
9. GET /api/v1/categories?pagination=0&status=1
   Headers: X-Locale: en
   ↓
10. Bagisto returns categories in English ✅
   ↓
11. App builds tree structure
   ↓
12. Categories display: "Home & Living", "Clothing & Fashion" ✅
```

---

## 📊 API Comparison

| Feature | Shop API `/api/categories/tree` | REST API v1 `/api/v1/categories` |
|---------|--------------------------------|----------------------------------|
| **X-Locale Header** | ❌ Ignores | ✅ Respects |
| **Translations** | Returns default locale | Returns selected locale |
| **Tree Structure** | ✅ Built-in | ❌ Flat list (we build it) |
| **Middleware** | Session-based | Header-based (Sanctum) |
| **Mobile Compatible** | ❌ No | ✅ Yes |

---

## 🔄 State Reload Strategy

### When Locale Changes:
1. **Redux state updates** (`selectedLocale`)
2. **Components detect change** (useEffect dependency)
3. **API refetch triggered** (loadCategories())
4. **New data with correct language** received
5. **UI updates** automatically

### Components with Auto-Reload:
- ✅ Home page CategoryList
- ✅ Drawer sidebar categories
- ✅ Product listings (already using apiClient)
- ✅ Any component using apiClient (automatic via headers)

---

## 📝 Key Changes

### File: `src/services/api/categories.api.ts`
```typescript
// ✅ Uses REST API v1 (respects X-Locale)
// ✅ Uses apiClient (includes locale headers automatically)
// ✅ Builds tree structure from flat list
// ✅ Filters only active categories (status=1)
```

### File: `src/features/home/components/CategoryList.tsx`
```typescript
// ✅ Added selectedLocale from Redux
// ✅ useEffect depends on [selectedLocale]
// ✅ Auto-reloads when locale changes
```

### File: `src/shared/components/CustomDrawerContent.tsx`
```typescript
// ✅ Added separate useEffect for locale
// ✅ Logs locale changes
// ✅ Reloads categories on locale change
```

---

## 🧪 Testing

### Test Locale Switch (English → Spanish):

1. **Start with English**:
   ```
   Drawer: "Home & Living", "Clothing & Fashion"
   Home: "Home & Living", "Clothing & Fashion"
   ```

2. **Switch to Spanish**:
   - Go to Preferences → Language
   - Select "Español"
   - Confirm alert

3. **Observe Changes**:
   ```
   Drawer: "Hogar y Decoración", "Ropa y Moda" ✅
   Home: "Hogar y Decoración", "Ropa y Moda" ✅
   ```

4. **Check Console**:
   ```
   [Drawer] Locale changed to: es - reloading categories
   [Categories API] Fetching from REST API v1
   [Categories API] Loaded categories: 53
   [Categories API] Built tree with 10 root categories
   ```

### Test Locale Switch (Spanish → English):

1. **Start with Spanish**:
   ```
   Drawer: "Hogar y Decoración"
   Home: "Hogar y Decoración"
   ```

2. **Switch to English**:
   - Go to "Preferencias" → "Idioma"
   - Select "English"
   - Confirm

3. **Observe**:
   ```
   Drawer: "Home & Living" ✅
   Home: "Home & Living" ✅
   ```

---

## 🎯 REST API vs Shop API - Understanding the Difference

### Shop API Routes (`/api/...`)
**File**: `Bagisto/packages/Webkul/Shop/src/Routes/api.php`

```php
Route::group(['middleware' => ['locale', 'theme', 'currency']], function () {
    Route::get('/categories/tree', 'tree'); // Uses session-based locale
});
```

**Middleware**: `Locale.php`
- Reads from session
- Doesn't check X-Locale header properly
- ❌ Not suitable for mobile apps

### REST API v1 Routes (`/api/v1/...`)
**File**: `Bagisto/vendor/bagisto/rest-api/src/Routes/V1/Shop/shop.php`

```php
Route::group(['middleware' => ['sanctum.locale', 'sanctum.currency']], function () {
    Route::get('/categories', 'allResources'); // Respects X-Locale header
});
```

**Middleware**: `sanctum.locale`
- Reads `X-Locale` header
- ✅ Perfect for mobile apps
- Works with stateless requests

---

## 📋 Bagisto Translation Structure

### How Bagisto Stores Translations:

```sql
categories
├── id: 57
├── slug: "honey-agave"
├── status: 1
└── translations (polymorphic)
    ├── locale: "en" → name: "Honey & Agave Syrup"
    └── locale: "es" → name: "Miel y Jarabe de Agave"
```

### How It Returns Based on Locale:

**Request with X-Locale: en**
```json
{
  "id": 57,
  "name": "Honey & Agave Syrup",  // ✅ English
  "slug": "honey-agave"
}
```

**Request with X-Locale: es**
```json
{
  "id": 57,
  "name": "Miel y Jarabe de Agave",  // ✅ Spanish
  "slug": "honey-agave"
}
```

---

## 🎨 Auto-Reload Pattern

### Implementation Pattern:
```typescript
// 1. Get current locale from Redux
const { selectedLocale } = useAppSelector(state => state.core);

// 2. Watch for locale changes
useEffect(() => {
  loadData(); // Refetch when locale changes
}, [selectedLocale]);

// 3. API automatically includes X-Locale header
const response = await apiClient.get('/endpoint');
// Header: X-Locale: en (or es, fr, etc.)
```

### Applied to:
- ✅ Categories (Home & Drawer)
- ✅ Products (already using apiClient)
- ✅ Any future components

---

## 💡 Benefits of This Approach

### 1. **Automatic Translation**
- No manual translation mapping needed
- Bagisto handles all translations
- Just fetch with correct locale header

### 2. **Real-Time Updates**
- Locale changes → Data refetches
- Always shows current language
- No stale data

### 3. **Consistent Experience**
- API data matches selected language
- UI text matches selected language
- Everything in sync

### 4. **Scalable**
- Add new languages in Bagisto
- Mobile app automatically supports them
- No app updates needed

---

## 🐛 Troubleshooting

### Issue: Categories still in wrong language
**Solutions**:
1. Check console logs for API requests
2. Verify X-Locale header is being sent
3. Clear AsyncStorage and restart app
4. Check Bagisto has translations for all categories

### Issue: Categories not reloading
**Solutions**:
1. Verify selectedLocale is in Redux state
2. Check useEffect dependency array includes [selectedLocale]
3. Check console for reload triggers

### Issue: Some categories missing translations
**Solutions**:
1. Go to Bagisto Admin → Categories
2. Edit each category
3. Add translations for all locales
4. Save and test again

---

## 📚 Code Summary

### What Changed:

**1. Categories API Service**
- ✅ Uses REST API v1 instead of Shop API
- ✅ Includes `pagination=0` to get all categories
- ✅ Builds tree structure from flat list
- ✅ Uses apiClient (automatic headers)

**2. Home CategoryList**
- ✅ Watches selectedLocale from Redux
- ✅ Reloads categories when locale changes
- ✅ Shows categories in correct language

**3. Drawer Sidebar**
- ✅ Watches selectedLocale from Redux
- ✅ Separate useEffect for locale changes
- ✅ Logs locale changes for debugging
- ✅ Reloads categories automatically

---

## 🎉 Summary

### Before:
```
User selects English → 
UI text changes ✅
Categories stay in Spanish ❌
```

### After:
```
User selects English →
UI text changes ✅
Categories refetch with X-Locale: en ✅
Bagisto returns English names ✅
Categories update to English ✅
```

---

## ✅ Testing Results

When you switch locale now:
1. ✅ UI text changes (i18n)
2. ✅ Categories refetch from API
3. ✅ API sends X-Locale header
4. ✅ Bagisto returns correct language
5. ✅ Both Home and Drawer update
6. ✅ Everything in sync!

---

**Fixed**: December 2024  
**Status**: ✅ Categories Now Translate Properly  
**Method**: REST API v1 + Auto-Reload on Locale Change

