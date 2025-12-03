# API Endpoint Path Fix - 404 Error Resolved

## 🐛 The 404 Error

```
GET http://192.168.31.102:8000/api/v1/categories/tree 404 (Not Found)
```

### Why It Failed:
- **API Client BaseURL**: `http://192.168.31.102:8000/api/v1`
- **Attempted Call**: `/categories/tree`
- **Result**: `http://192.168.31.102:8000/api/v1/categories/tree` ❌ 404

### The Actual Endpoint:
- **Correct Path**: `http://192.168.31.102:8000/api/categories/tree` ✅
- **Without** `/v1` in the path

---

## ✅ The Fix

### Problem:
Different Bagisto API endpoints have different base paths:
- REST API v1: `/api/v1/*` (products, orders, etc.)
- Shop API: `/api/*` (categories/tree, etc.)

### Solution:
Manually construct the full URL for the tree endpoint:

**`src/services/api/categories.api.ts`**
```typescript
async getCategories() {
  // Remove /api/v1 from baseURL
  const baseUrl = config.apiUrl.replace('/api/v1', '');
  
  // Construct full URL: http://192.168.31.102:8000/api/categories/tree
  const treeUrl = `${baseUrl}/api/categories/tree`;
  
  const response = await axios.get(treeUrl);
  return response.data.data;
}
```

---

## 🎯 URL Construction

### Before (Wrong):
```
config.apiUrl = "http://192.168.31.102:8000/api/v1"
+
"/categories/tree"
=
"http://192.168.31.102:8000/api/v1/categories/tree" ❌
```

### After (Correct):
```
config.apiUrl = "http://192.168.31.102:8000/api/v1"
↓ (remove /api/v1)
"http://192.168.31.102:8000"
+
"/api/categories/tree"
=
"http://192.168.31.102:8000/api/categories/tree" ✅
```

---

## 📊 Bagisto API Structure

### REST API v1 (with `/api/v1`):
```
/api/v1/products
/api/v1/categories          (flat list)
/api/v1/customer/login
/api/v1/locales
/api/v1/currencies
```

### Shop API (with `/api` only):
```
/api/categories/tree        (hierarchical) ✅
/api/categories/max-price
/api/products
/api/checkout/cart
```

---

## 🧪 Testing

### Test the endpoint directly:
```bash
# This works ✅
curl http://localhost:8000/api/categories/tree

# This doesn't exist ❌
curl http://localhost:8000/api/v1/categories/tree
```

### In the mobile app:
1. Open home page or drawer
2. Categories should now load successfully
3. Console will show: `[Categories API] Fetching from: http://192.168.31.102:8000/api/categories/tree`
4. Should return proper hierarchy

---

## 🔍 Key Changes

### File: `src/services/api/categories.api.ts`

**Added imports:**
```typescript
import axios from 'axios';
import { config } from '@/config/env';
```

**Updated getCategories():**
```typescript
// Construct correct URL
const baseUrl = config.apiUrl.replace('/api/v1', '');
const treeUrl = `${baseUrl}/api/categories/tree`;

// Use axios directly to bypass apiClient baseURL
const response = await axios.get(treeUrl);
```

---

## ✅ Summary

✅ **Identified issue**: Mixing `/api/v1` and `/api` endpoints
✅ **Root cause**: Tree endpoint is not under REST API v1
✅ **Solution**: Manually construct full URL
✅ **Result**: Categories load correctly with hierarchy

---

**Fixed**: December 2024  
**Status**: ✅ 404 Error Resolved  
**Endpoint**: `/api/categories/tree` Working

