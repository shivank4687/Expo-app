# API Client Guide - REST API vs Shop API

## Overview

This application now supports **two different API endpoints** from the Bagisto backend:

1. **REST API v1** (`/api/v1`) - Uses `X-Locale` header
2. **Shop API** (`/api`) - Uses `?locale=` query parameter

## Architecture

### 1. Environment Configuration (`src/config/env.ts`)

```typescript
config = {
  baseUrl: "http://10.0.2.2:8000",
  restApiUrl: "http://10.0.2.2:8000/api/v1",  // REST API v1
  shopApiUrl: "http://10.0.2.2:8000/api",     // Shop API
  timeout: 30000
}
```

### 2. API Clients (`src/services/api/client.ts`)

Two specialized clients are available:

#### `restApiClient` - For REST API v1 endpoints
- **Base URL**: `/api/v1`
- **Locale Handling**: Sends `X-Locale` header
- **Currency Handling**: Sends `X-Currency` header
- **Use Case**: Products, Customers, Orders, etc.

#### `shopApiClient` - For Shop API endpoints
- **Base URL**: `/api`
- **Locale Handling**: Appends `?locale=` query parameter
- **Currency Handling**: Sends `X-Currency` header
- **Use Case**: Categories tree, Public shop data

## How to Use

### Example 1: Using Shop API (Categories)

```typescript
import { shopApiClient } from '@/services/api/client';

// Automatically adds ?locale=en (or current locale)
const categories = await shopApiClient.get('/categories/tree');

// Result: GET http://localhost:8000/api/categories/tree?locale=en
```

### Example 2: Using REST API (Products)

```typescript
import { restApiClient } from '@/services/api/client';

// Automatically adds X-Locale: en header
const products = await restApiClient.get('/products?limit=10');

// Result: GET http://localhost:8000/api/v1/products?limit=10
// Headers: { X-Locale: 'en', X-Currency: 'USD' }
```

### Example 3: Mixed Usage in Same Service

```typescript
import { restApiClient, shopApiClient } from '@/services/api/client';

export const catalogApi = {
  // Use Shop API for category tree
  async getCategories() {
    return shopApiClient.get('/categories/tree');
  },
  
  // Use REST API for products
  async getProducts() {
    return restApiClient.get('/products');
  },
  
  // Use REST API for product details
  async getProductById(id: number) {
    return restApiClient.get(`/products/${id}`);
  }
};
```

## Locale Handling - Under the Hood

### REST API Client
```typescript
// Interceptor adds header
config.headers['X-Locale'] = 'en';

// Request looks like:
GET /api/v1/products
Headers: {
  'X-Locale': 'en',
  'X-Currency': 'USD'
}
```

### Shop API Client
```typescript
// Interceptor adds query parameter
config.url = '/categories/tree?locale=en';

// Request looks like:
GET /api/categories/tree?locale=en
Headers: {
  'X-Currency': 'USD'
}
```

## When to Use Which Client?

### Use `shopApiClient` when:
- ✅ Endpoint is under `/api` (not `/api/v1`)
- ✅ Bagisto's Shop API routes (e.g., categories tree)
- ✅ Endpoint expects `?locale=` query parameter

### Use `restApiClient` when:
- ✅ Endpoint is under `/api/v1`
- ✅ Bagisto's REST API routes (e.g., products, customers)
- ✅ Endpoint expects `X-Locale` header

## Migration Guide

### Before (Old Code)
```typescript
// Hard-coded base URL manipulation
const baseUrl = config.apiUrl.replace('/api/v1', '');
const response = await apiClient.get(`${baseUrl}/api/categories/tree?locale=${locale}`);
```

### After (New Code)
```typescript
// Clean and automatic
const response = await shopApiClient.get('/categories/tree');
```

## Backend Route Reference

### Shop API Routes (`/api`)
- `GET /api/categories/tree` - Category tree with hierarchy
- `GET /api/categories` - All categories
- `GET /api/products` - Products list
- More routes in: `Bagisto/packages/Webkul/Shop/src/Routes/api.php`

### REST API Routes (`/api/v1`)
- `GET /api/v1/categories` - Categories (paginated)
- `GET /api/v1/categories/{id}` - Category details
- `GET /api/v1/products` - Products (paginated)
- `GET /api/v1/products/{id}` - Product details
- More routes in: `Bagisto/packages/Webkul/RestApi/src/Routes/V1/Shop/`

## Complete Example: Category Service

```typescript
// src/services/api/categories.api.ts
import { shopApiClient, restApiClient } from './client';

export const categoriesApi = {
  // Use Shop API - returns tree structure with current locale
  async getCategories(): Promise<Category[]> {
    const response = await shopApiClient.get('/categories/tree');
    return response || [];
  },
  
  // Use REST API - for detailed category with pagination
  async getCategoryById(id: number): Promise<Category> {
    const url = `/categories/${id}`;
    const response = await restApiClient.get(url);
    return response.data || response;
  },
  
  // Use REST API - for descendant categories
  async getDescendantCategories(parentId: number): Promise<Category[]> {
    const response = await restApiClient.get('/descendant-categories', {
      params: { parent_id: parentId }
    });
    return response.data || response;
  }
};
```

## Benefits of This Approach

1. ✅ **Clean Code**: No manual URL manipulation
2. ✅ **Automatic Locale**: Locale is handled automatically
3. ✅ **Type Safety**: TypeScript support maintained
4. ✅ **Maintainable**: Easy to switch endpoints
5. ✅ **Scalable**: Easy to add new API services
6. ✅ **Consistent**: Same pattern for all API calls
7. ✅ **Backend Aware**: Respects backend's expected format

## Troubleshooting

### Problem: Categories not showing in correct language
**Solution**: Verify you're using `shopApiClient` for Shop API endpoints

### Problem: REST API not respecting locale
**Solution**: Ensure you're using `restApiClient` and locale is stored in AsyncStorage

### Problem: Need to force a specific locale
```typescript
// Shop API - add to query manually
await shopApiClient.get('/categories/tree?locale=ar');

// REST API - override header
await restApiClient.get('/products', {
  headers: { 'X-Locale': 'ar' }
});
```

## Summary

| Feature | REST API Client | Shop API Client |
|---------|----------------|-----------------|
| Base URL | `/api/v1` | `/api` |
| Locale Method | `X-Locale` header | `?locale=` query param |
| Auto-adds Locale | ✅ Yes | ✅ Yes |
| Auth Token | ✅ Yes | ✅ Yes |
| Currency | ✅ Yes | ✅ Yes |
| Best For | Products, Orders, Users | Categories, Public Data |

---

**Last Updated**: December 2024

