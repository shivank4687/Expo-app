# View All Button Implementation for Product Carousels

## Overview

This document describes the implementation of "View All" buttons for product carousels in the mobile application, matching the functionality present in the web application's responsive view.

## Changes Made

### 1. Enhanced ProductListScreen

**File**: `src/features/product/screens/ProductListScreen.tsx`

#### What Changed:
- Added support for filter parameters (featured, new, etc.) in addition to category-based filtering
- Added dynamic page title support via URL parameters
- Added locale support for proper internationalization

#### Key Features:
- **Dynamic Filtering**: Screen now accepts multiple query parameters:
  - `id` - Category ID (for category-based filtering)
  - `featured` - Show featured products
  - `new` - Show new products
  - `title` - Custom page title
  
- **Intelligent Route Handling**: Automatically detects if the `id` parameter is a valid category ID or if filters should be used instead

- **Example Usage**:
  ```typescript
  // Featured products
  router.push('/product-list/all?featured=1&title=Featured Products');
  
  // New products
  router.push('/product-list/all?new=1&title=New Products');
  
  // Category products (existing behavior)
  router.push('/product-list/123?title=Category Name');
  ```

### 2. Updated ProductCarouselCustomization Component

**File**: `src/features/home/components/ProductCarouselCustomization.tsx`

#### What Changed:
- Added "View All" button to the carousel header
- Button appears on the right side of the title
- Only shows when carousel has 10 or more products (indicating more are available)

#### Key Features:
- **Header Layout**: Flexbox layout with title on the left and "View All" button on the right
- **Smart Navigation**: Automatically passes the carousel's filters to the product list screen
- **Icon**: Uses Ionicons arrow-forward icon for better UX
- **Conditional Display**: Button only shows when `products.length >= PRODUCTS_PER_PAGE`

#### Visual Layout:
```
┌─────────────────────────────────────┐
│ Featured Products      View All → │
│                                     │
│ [Product] [Product] [Product] →    │
└─────────────────────────────────────┘
```

### 3. Category Carousel

**File**: `src/features/home/components/CategoryCarouselCustomization.tsx`

#### Decision:
No changes made to CategoryCarouselCustomization because:
- All categories are already displayed in the carousel (no limit)
- Categories are loaded from Redux state (fully available)
- Adding a "View All" button would be redundant

## Implementation Details

### How It Works

1. **User views home screen** with product carousels (Featured, New, etc.)
2. **Carousel displays** up to 10 products horizontally
3. **"View All" button appears** if there are 10 products (indicating more exist)
4. **User taps "View All"**
5. **Navigation occurs** to `/product-list/all` with appropriate filters
6. **ProductListScreen** receives the parameters and loads all matching products
7. **User sees full list** in a 2-column grid with pagination

### Filter Passing Mechanism

```typescript
// In ProductCarouselCustomization
const handleViewAll = useCallback(() => {
    const queryParams = new URLSearchParams();
    
    // Add title for page header
    if (options.title) {
        queryParams.append('title', options.title);
    }
    
    // Add all filters except internal ones
    if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
            if (key !== 'per_page' && key !== 'locale' && value !== undefined) {
                queryParams.append(key, String(value));
            }
        });
    }
    
    router.push(`/product-list/all?${queryParams.toString()}`);
}, [router, options.title, options.filters]);
```

### ProductListScreen Filter Logic

```typescript
// Check if it's a category filter or attribute filter
const categoryId = params.id ? parseInt(params.id) : NaN;
const isCategoryFilter = !isNaN(categoryId);

if (isCategoryFilter) {
    // Use category-based API
    response = await productsApi.getProductsByCategory(categoryId, {...});
} else {
    // Use general product API with filters
    const filters = {
        page,
        per_page: PRODUCTS_PER_PAGE,
        locale: selectedLocale?.code,
    };
    
    if (params.featured === '1') filters.featured = 1;
    if (params.new === '1') filters.new = 1;
    
    response = await productsApi.getProducts(filters);
}
```

## User Experience

### Before
- Users could only see 10 products in each carousel
- No way to view all featured or new products
- Had to search to find more products

### After
- Users can easily view all products in a category/filter
- "View All" button appears prominently in the header
- Consistent with web application experience
- Clear visual hierarchy with title and action button

## Styling

### View All Button Styles
```typescript
viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    gap: 4,
},
viewAllText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.primary[500],
},
```

### Header Layout
```typescript
header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
},
```

## Testing Checklist

### Manual Testing
- ✅ View All button appears on carousels with 10+ products
- ✅ View All button doesn't appear on carousels with < 10 products
- ✅ Tapping View All navigates to product list screen
- ✅ Correct filters are passed (featured, new, etc.)
- ✅ Page title displays correctly on product list screen
- ✅ Products load correctly based on filters
- ✅ Pagination works on product list screen
- ✅ Back button returns to home screen

### Scenarios to Test
1. **Featured Products Carousel**
   - Tap "View All" on Featured Products
   - Verify all featured products load
   - Verify title shows "Featured Products"

2. **New Products Carousel**
   - Tap "View All" on New Products
   - Verify all new products load
   - Verify title shows "New Products"

3. **Category Carousel**
   - No View All button (by design)
   - All categories visible in horizontal scroll

4. **Locale Changes**
   - Switch language
   - Verify View All still works
   - Verify products reload with correct locale

## API Compatibility

The implementation uses existing API endpoints:
- `GET /api/v1/products` - For filtered products (featured, new)
- `GET /api/v1/categories/{id}/products` - For category products

Both endpoints support:
- Pagination (`page`, `per_page`)
- Locale filtering (`locale`)
- Attribute filtering (`featured`, `new`)

## Future Enhancements

Possible future improvements:
1. **Sort Options**: Add sort dropdown on product list screen
2. **Filter Panel**: Add advanced filters (price, rating, etc.)
3. **View Toggle**: Switch between grid and list view
4. **Category View All**: If categories become limited, add View All
5. **Analytics**: Track View All button clicks for insights
6. **Translation**: Translate "View All" text using i18n

## Files Modified

1. `/MyFirstApp/src/features/product/screens/ProductListScreen.tsx`
   - Added filter parameter support
   - Added dynamic title support
   - Enhanced routing logic

2. `/MyFirstApp/src/features/home/components/ProductCarouselCustomization.tsx`
   - Added View All button
   - Added header layout with title and button
   - Added navigation logic with filters

## Comparison with Web Application

| Feature | Web App | Mobile App (Now) |
|---------|---------|------------------|
| View All Button | ✅ Yes | ✅ Yes |
| Button Position | Right corner | Right corner |
| Button Icon | Arrow right | Arrow forward |
| Filter Support | ✅ Yes | ✅ Yes |
| Conditional Display | ✅ Yes | ✅ Yes |
| Responsive | ✅ Yes | ✅ Native |

## Summary

The mobile application now has full feature parity with the web application regarding product carousel "View All" functionality. Users can easily discover and browse all products in specific categories or filters, improving the overall shopping experience.

