# API Services - Quick Reference

## Import the Right Client

```typescript
// For REST API v1 endpoints (/api/v1)
import { restApiClient } from './client';

// For Shop API endpoints (/api)
import { shopApiClient } from './client';

// Both
import { restApiClient, shopApiClient } from './client';
```

## Quick Examples

### Categories (Shop API)
```typescript
// ✅ CORRECT - Use Shop API
import { shopApiClient } from '@/services/api/client';

export const categoriesApi = {
  async getCategories() {
    return shopApiClient.get('/categories/tree');
  }
};
```

### Products (REST API)
```typescript
// ✅ CORRECT - Use REST API
import { restApiClient } from '@/services/api/client';

export const productsApi = {
  async getProducts(params?: any) {
    return restApiClient.get('/products', { params });
  },
  
  async getProductById(id: number) {
    return restApiClient.get(`/products/${id}`);
  }
};
```

### Mixed Usage
```typescript
// ✅ CORRECT - Use both as needed
import { restApiClient, shopApiClient } from '@/services/api/client';

export const catalogApi = {
  // Shop API for tree structure
  async getCategoryTree() {
    return shopApiClient.get('/categories/tree');
  },
  
  // REST API for detailed data
  async getCategoryDetails(id: number) {
    return restApiClient.get(`/categories/${id}`);
  }
};
```

## Cheat Sheet

| Endpoint | Client | Example |
|----------|--------|---------|
| `/api/categories/tree` | `shopApiClient` | `shopApiClient.get('/categories/tree')` |
| `/api/v1/categories` | `restApiClient` | `restApiClient.get('/categories')` |
| `/api/v1/products` | `restApiClient` | `restApiClient.get('/products')` |
| `/api/v1/products/{id}` | `restApiClient` | `restApiClient.get('/products/1')` |
| `/api/v1/customer/login` | `restApiClient` | `restApiClient.post('/customer/login', data)` |

## Common Patterns

### GET Request
```typescript
const data = await restApiClient.get('/products');
```

### POST Request
```typescript
const result = await restApiClient.post('/customer/login', {
  email: 'user@example.com',
  password: 'password123'
});
```

### With Query Parameters
```typescript
const products = await restApiClient.get('/products', {
  params: {
    limit: 10,
    page: 1,
    category_id: 5
  }
});
```

### With Custom Headers
```typescript
const data = await restApiClient.get('/products', {
  headers: {
    'X-Locale': 'ar',
    'Custom-Header': 'value'
  }
});
```

## Remember

- 🔄 Locale is added **automatically**
- 🔑 Auth token is added **automatically**
- 💰 Currency header is added **automatically**
- ✨ Just use the appropriate client and call the endpoint!

