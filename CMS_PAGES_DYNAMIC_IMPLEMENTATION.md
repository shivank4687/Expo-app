# Dynamic CMS Pages Implementation

## ✅ What Was Implemented

The "Other" section in the sidebar now loads CMS pages dynamically from the backend database, with full locale support - just like categories!

---

## 🎯 Features

### 1. **Backend API Endpoint**
Created REST API endpoint to fetch CMS pages:
- **Endpoint**: `/api/v1/cms-pages`
- **Filters by**: Current channel and locale
- **Returns**: All active CMS pages with translations

### 2. **Mobile App Integration**
- **API Service**: `src/services/api/cms.api.ts`
- **Redux Slice**: `src/store/slices/cmsSlice.ts`
- **Auto-reload**: Pages reload when locale changes

### 3. **Dynamic Sidebar**
- Sidebar "Other" section now shows pages from database
- Pages automatically translate based on selected language
- Loading state while fetching pages

### 4. **Dynamic Page Display**
- Pages render HTML content from database
- Proper styling and formatting
- Responsive layout

---

## 📁 Files Created/Modified

### Backend (Bagisto)

#### Created:
1. **`packages/Webkul/RestApi/src/Http/Controllers/V1/Shop/Core/CMSPageController.php`**
   - Controller to fetch CMS pages
   - Filters by channel and locale

2. **`packages/Webkul/RestApi/src/Http/Resources/V1/Shop/Core/CMSPageResource.php`**
   - Resource to format CMS page data

#### Modified:
3. **`packages/Webkul/RestApi/src/Routes/V1/Shop/core-routes.php`**
   - Added routes:
     - `GET /api/v1/cms-pages` - List all pages
     - `GET /api/v1/cms-pages/{urlKey}` - Get specific page

### Mobile App

#### Created:
4. **`src/services/api/cms.api.ts`**
   - API service to fetch CMS pages
   - Methods: `getPages()`, `getPageByUrlKey()`

5. **`src/store/slices/cmsSlice.ts`**
   - Redux slice for CMS pages state
   - Auto-reload on locale change

#### Modified:
6. **`src/store/store.ts`**
   - Added `cmsReducer` to store
   - Added `cms` to persist whitelist

7. **`src/shared/components/CustomDrawerContent.tsx`**
   - Loads CMS pages from Redux
   - Displays pages dynamically
   - Shows loading state

8. **`src/features/static/screens/StaticPageScreen.tsx`**
   - Fetches page content from API
   - Renders HTML content with WebView
   - Proper error handling

---

## 🚀 How It Works

### 1. **Page Loading Flow**

```
App Starts
    ↓
Locale Selected
    ↓
Fetch CMS Pages (with locale header)
    ↓
Store in Redux
    ↓
Display in Sidebar
```

### 2. **Locale Change Flow**

```
User Changes Language
    ↓
Redux: setLocale()
    ↓
useEffect detects change
    ↓
Fetch CMS Pages (new locale)
    ↓
Sidebar updates with translated pages
```

### 3. **Page View Flow**

```
User Clicks Page in Sidebar
    ↓
Navigate to /static/{url_key}
    ↓
Fetch Page Content (with locale)
    ↓
Render HTML in WebView
```

---

## 📦 Installation Required

Install WebView package for rendering HTML content:

```bash
cd MyFirstApp
npx expo install react-native-webview
```

---

## 🎨 Backend Setup

### 1. **Create CMS Pages in Admin**

Go to Bagisto Admin → Content → Pages:

1. **Create Page**:
   - Page Title: "About Us" (English) / "Sobre Nosotros" (Spanish)
   - URL Key: `about-us`
   - HTML Content: Your content
   - Channels: Select your channel
   - Status: Active

2. **Add Translations**:
   - Click on locale tabs
   - Add translated content for each language

3. **Repeat** for other pages:
   - Return Policy (`return-policy`)
   - Terms & Conditions (`terms-conditions`)
   - Privacy Policy (`privacy-policy`)
   - Contact Us (`contact-us`)
   - etc.

### 2. **API Endpoint**

The endpoint is now available at:
```
GET /api/v1/cms-pages
```

Headers:
```
X-Locale: en  (or es, fr, etc.)
X-Currency: USD
```

Response:
```json
{
  "data": [
    {
      "id": 1,
      "url_key": "about-us",
      "page_title": "About Us",
      "html_content": "<h1>About Us</h1><p>Content...</p>",
      "meta_title": "About Us",
      "meta_description": "Learn about us",
      "meta_keywords": "about, company"
    }
  ]
}
```

---

## ✨ Benefits

### **Before** (Hardcoded):
- ❌ Pages hardcoded in app
- ❌ No translations
- ❌ Can't update without app release
- ❌ Same content for all languages

### **After** (Dynamic):
- ✅ Pages from database
- ✅ Full translation support
- ✅ Update content anytime (no app release needed)
- ✅ Different content per language
- ✅ Manage from admin panel
- ✅ Same system as web application

---

## 🔄 How to Update Content

### Option 1: Admin Panel
1. Login to Bagisto Admin
2. Go to Content → Pages
3. Edit page
4. Update content
5. Save
6. **Mobile app automatically shows new content!**

### Option 2: API
Use the Admin API to programmatically update pages.

---

## 🌍 Locale Support

Pages automatically load in the correct language:

**English User**:
```
Sidebar shows:
- About Us
- Return Policy
- Privacy Policy
```

**Spanish User**:
```
Sidebar shows:
- Sobre Nosotros
- Política de Devoluciones
- Política de Privacidad
```

Same pages, different translations!

---

## 🎯 Testing

### 1. **Test API Endpoint**

```bash
curl -X GET "http://your-domain/api/v1/cms-pages" \
  -H "X-Locale: en" \
  -H "X-Currency: USD"
```

### 2. **Test in App**

1. Open sidebar
2. Check "Other" section
3. Should see pages from database
4. Click a page
5. Should see content
6. Change language
7. Pages should update

---

## 📋 Next Steps

1. **Install WebView**:
   ```bash
   npx expo install react-native-webview
   ```

2. **Create Pages in Admin**:
   - Add your CMS pages
   - Add translations
   - Set URL keys

3. **Test**:
   - Open app
   - Check sidebar
   - View pages
   - Change language

---

## 🐛 Troubleshooting

### Pages Not Showing?
- Check if pages are created in admin
- Verify pages are assigned to correct channel
- Check if pages have translations for current locale
- Check API response in console logs

### Content Not Rendering?
- Install `react-native-webview`
- Check HTML content in database
- Verify page has `html_content` field

### Not Updating on Locale Change?
- Check Redux DevTools
- Verify `fetchCMSPages` is called
- Check network tab for API calls

---

## 🎉 Result

Your mobile app now has a fully dynamic CMS system, just like the web application! Content managers can update pages anytime without needing a new app release.

