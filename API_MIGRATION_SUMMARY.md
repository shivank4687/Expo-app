# API Client Migration Summary

## What Changed?

The application has been refactored to support **two separate API clients** for different Bagisto backend endpoints:

1. **REST API Client** (`restApiClient`) - For `/api/v1` endpoints
2. **Shop API Client** (`shopApiClient`) - For `/api` endpoints

## Files Modified

### 1. Configuration (`src/config/env.ts`)
**Changes:**
- Added `baseUrl` - Base URL without API prefix
- Added `restApiUrl` - Full REST API v1 URL (`/api/v1`)
- Added `shopApiUrl` - Full Shop API URL (`/api`)

**Before:**
```typescript
apiUrl: "http://10.0.2.2:8000/api/v1"
```

**After:**
```typescript
baseUrl: "http://10.0.2.2:8000",
restApiUrl: "http://10.0.2.2:8000/api/v1",
shopApiUrl: "http://10.0.2.2:8000/api",
```

### 2. API Client (`src/services/api/client.ts`)
**Changes:**
- Added `ApiType` type: `'rest' | 'shop'`
- Modified `ApiClient` constructor to accept API type
- Updated interceptors to handle locale differently based on API type:
  - REST API: Uses `X-Locale` header
  - Shop API: Uses `?locale=` query parameter
- Exported two client instances:
  - `restApiClient` - For REST API v1
  - `shopApiClient` - For Shop API

**Locale Handling:**
```typescript
if (this.apiType === 'rest') {
  // REST API uses X-Locale header
  config.headers['X-Locale'] = locale;
} else if (this.apiType === 'shop') {
  // Shop API uses query parameter
  config.url = `${config.url}?locale=${locale}`;
}
```

### 3. Categories API (`src/services/api/categories.api.ts`)
**Changes:**
- Now imports both `shopApiClient` and `restApiClient`
- `getCategories()` uses `shopApiClient` (Shop API endpoint)
- `getCategoryById()` uses `restApiClient` (REST API endpoint)
- Removed manual URL construction with `config.apiUrl.replace()`
- Removed AsyncStorage import (no longer needed)

**Before:**
```typescript
const baseUrl = config.apiUrl.replace('/api/v1', '');
const response = await apiClient.get(`${baseUrl}/api/categories/tree?locale=${locale}`);
```

**After:**
```typescript
const response = await shopApiClient.get('/categories/tree');
```

### 4. Products API (`src/services/api/products.api.ts`)
**Changes:**
- Changed import from `apiClient` to `restApiClient`
- All methods now use `restApiClient`

**Affected Methods:**
- `getProducts()` - Uses REST API
- `getProductById()` - Uses REST API

### 5. Auth API (`src/services/api/auth.api.ts`)
**Changes:**
- Changed import from `apiClient` to `restApiClient`
- All methods now use `restApiClient`

**Affected Methods:**
- `login()` - Uses REST API
- `register()` - Uses REST API
- `logout()` - Uses REST API
- `refreshToken()` - Uses REST API

### 6. Core API (`src/services/api/core.api.ts`)
**Changes:**
- Changed import from `apiClient` to `restApiClient`
- All methods now use `restApiClient`

**Affected Methods:**
- `getLocales()` - Uses REST API
- `getCurrencies()` - Uses REST API
- `getChannels()` - Uses REST API

## Documentation Added

### 1. `API_CLIENT_GUIDE.md`
Comprehensive guide covering:
- Architecture overview
- When to use which client
- Code examples
- Migration guide
- Backend route reference

### 2. `src/services/api/README.md`
Quick reference guide with:
- Import examples
- Common patterns
- Cheat sheet
- Quick examples

## API Endpoints Mapping

| Endpoint | Client | Service |
|----------|--------|---------|
| `/api/categories/tree` | `shopApiClient` | Categories |
| `/api/v1/categories` | `restApiClient` | Categories |
| `/api/v1/categories/{id}` | `restApiClient` | Categories |
| `/api/v1/descendant-categories` | `restApiClient` | Categories |
| `/api/v1/products` | `restApiClient` | Products |
| `/api/v1/products/{id}` | `restApiClient` | Products |
| `/api/v1/customer/login` | `restApiClient` | Auth |
| `/api/v1/customer/register` | `restApiClient` | Auth |
| `/api/v1/locales` | `restApiClient` | Core |
| `/api/v1/currencies` | `restApiClient` | Core |
| `/api/v1/channels` | `restApiClient` | Core |

## How Locale is Handled

### REST API Client (`restApiClient`)
```
Request: GET /api/v1/products
Headers:
  X-Locale: en
  X-Currency: USD
  Authorization: Bearer <token>
```

### Shop API Client (`shopApiClient`)
```
Request: GET /api/categories/tree?locale=en
Headers:
  X-Currency: USD
  Authorization: Bearer <token>
```

## Benefits

✅ **Clean Code** - No manual URL manipulation  
✅ **Automatic Locale** - Handled transparently  
✅ **Type Safe** - Full TypeScript support  
✅ **Maintainable** - Easy to switch endpoints  
✅ **Scalable** - Easy to add new services  
✅ **Consistent** - Same pattern everywhere  
✅ **Backend Aware** - Matches backend expectations  

## Testing Checklist

- [ ] Categories load with correct locale
- [ ] Products load with correct locale
- [ ] Login/Register works
- [ ] Locale switching updates all data
- [ ] Currency switching works
- [ ] Auth token is sent correctly
- [ ] No console errors

## Backward Compatibility

The default `apiClient` export still exists and points to `restApiClient` for backward compatibility:

```typescript
export const apiClient = restApiClient; // Backward compatibility
export default apiClient;
```

However, it's recommended to use explicit imports:
```typescript
// ✅ Recommended
import { restApiClient } from './client';

// ⚠️ Still works but less clear
import apiClient from './client';
```

## Future Additions

When adding new API services:

1. Determine if the endpoint is under `/api` or `/api/v1`
2. Import the appropriate client:
   ```typescript
   import { restApiClient } from './client';  // For /api/v1
   // OR
   import { shopApiClient } from './client';  // For /api
   ```
3. Use the client methods as normal

## Breaking Changes

⚠️ **None** - This is a refactor with full backward compatibility.

All existing code continues to work. The changes are internal improvements.

---

**Migration Date**: December 2024  
**Version**: 1.0.0  
**Status**: ✅ Complete

