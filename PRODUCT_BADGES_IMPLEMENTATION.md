# Product Badges and Price Display Implementation

## Overview

This document describes the implementation of product badges (NEW, SALE) and improved price display with strikethrough styling in the mobile application, matching the web application's design.

## Changes Made

### 1. Updated Product Type Definition

**File**: `src/features/product/types/product.types.ts`

#### Added Fields:
```typescript
export interface Product {
    // ... existing fields ...
    new?: boolean | number;      // Product is marked as "new"
    on_sale?: boolean;           // Product is on sale (has special price)
    is_new?: boolean;            // Alternative field name for "new" status
}
```

These fields are provided by the Bagisto API and indicate:
- `new` or `is_new`: Product is newly added to the catalog
- `on_sale`: Product has a special/discounted price

### 2. Enhanced ProductCard Component

**File**: `src/features/home/components/ProductCard.tsx`

#### Key Changes:

1. **Badge Logic**:
   - Added logic to detect if a product is on sale or new
   - Sale badge takes priority over new badge (matching web app behavior)
   - Badges only show for in-stock products

2. **Badge Display**:
   - **SALE Badge**: Red background (#DC2626) - shown when product has discount
   - **NEW Badge**: Navy blue background (#1E3A8A) - shown when product is new and NOT on sale
   - Both badges positioned at top-left of product image
   - Pill-shaped design with rounded corners (borderRadius: 22)

3. **Price Display**:
   - Enhanced strikethrough styling for original price
   - Gray color (#9CA3AF) matching web application
   - Special price shown in red (error color)
   - Regular price shown in primary color

## Visual Design

### Badge Hierarchy (Priority Order)

1. **Out of Stock** (if not in stock) - Bottom overlay, dark background
2. **SALE** (if on sale and in stock) - Top-left, red badge
3. **NEW** (if new, not on sale, and in stock) - Top-left, navy blue badge

### Badge Styles

#### SALE Badge
```typescript
{
    backgroundColor: '#DC2626',  // Red (bg-red-600)
    color: 'white',
    borderRadius: 22,            // Pill shape
    position: 'top-left',
    text: 'SALE' (uppercase)
}
```

#### NEW Badge
```typescript
{
    backgroundColor: '#1E3A8A',  // Navy blue (bg-navyBlue)
    color: 'white',
    borderRadius: 22,            // Pill shape
    position: 'top-left',
    text: 'NEW' (uppercase)
}
```

### Price Display Styles

#### With Discount
```
┌─────────────────┐
│ $79.99  $99.99  │  ← Special price (red) + Original price (gray, strikethrough)
└─────────────────┘
```

#### Without Discount
```
┌─────────────────┐
│ $99.99          │  ← Regular price (primary color)
└─────────────────┘
```

## Implementation Details

### Badge Detection Logic

```typescript
const productData = useMemo(() => {
    const hasDiscount = product.special_price && product.special_price < product.price;
    
    // Check if product is on sale (has discount)
    const isOnSale = product.on_sale || hasDiscount;
    
    // Check if product is new (using either 'new' or 'is_new' field)
    const isNew = product.is_new || (product.new === true || product.new === 1);

    return {
        hasDiscount,
        isOnSale,
        isNew,
        // ... other data
    };
}, [product]);
```

### Badge Rendering Logic

```typescript
{/* Sale Badge - Shows when product is on sale */}
{productData.isOnSale && product.in_stock ? (
    <View style={styles.saleBadge}>
        <Text style={styles.saleText}>SALE</Text>
    </View>
) : null}

{/* New Badge - Shows when product is new and not on sale */}
{!productData.isOnSale && productData.isNew && product.in_stock ? (
    <View style={styles.newBadge}>
        <Text style={styles.newText}>NEW</Text>
    </View>
) : null}
```

### Price Rendering Logic

```typescript
<View style={styles.priceContainer}>
    {productData.hasDiscount ? (
        <>
            <Text style={styles.specialPrice}>
                {formatters.formatPrice(product.special_price!)}
            </Text>
            <Text style={styles.originalPrice}>
                {formatters.formatPrice(product.price)}
            </Text>
        </>
    ) : (
        <Text style={styles.price}>
            {formatters.formatPrice(product.price)}
        </Text>
    )}
</View>
```

## Comparison with Web Application

| Feature | Web App | Mobile App (Now) | Status |
|---------|---------|------------------|--------|
| SALE Badge | ✅ Red, top-left | ✅ Red, top-left | ✅ Match |
| NEW Badge | ✅ Navy, top-left | ✅ Navy, top-left | ✅ Match |
| Badge Priority | ✅ Sale > New | ✅ Sale > New | ✅ Match |
| Strikethrough Price | ✅ Gray, line-through | ✅ Gray, line-through | ✅ Match |
| Special Price Color | ✅ Red/Error | ✅ Red/Error | ✅ Match |
| Badge Shape | ✅ Pill/Rounded | ✅ Pill/Rounded | ✅ Match |

## Product States and Badge Display

### State Matrix

| Product State | Badge Shown | Price Display |
|--------------|-------------|---------------|
| New + In Stock + No Discount | NEW (Navy) | Regular price |
| On Sale + In Stock | SALE (Red) | Special price + Strikethrough original |
| New + On Sale + In Stock | SALE (Red) | Special price + Strikethrough original |
| Out of Stock | Out of Stock | Regular/Special price |
| Regular (No badges) | None | Regular price |

### Examples

#### Example 1: New Product
```
┌──────────────────┐
│ [NEW]            │  ← Navy blue badge
│                  │
│   Product Image  │
│                  │
└──────────────────┘
Product Name
⭐ 4.5 (120)
$99.99
```

#### Example 2: Sale Product
```
┌──────────────────┐
│ [SALE]           │  ← Red badge
│                  │
│   Product Image  │
│                  │
└──────────────────┘
Product Name
⭐ 4.5 (120)
$79.99  $99.99
        ̶̶̶̶̶̶̶̶
```

#### Example 3: New + Sale Product
```
┌──────────────────┐
│ [SALE]           │  ← Red badge (priority over NEW)
│                  │
│   Product Image  │
│                  │
└──────────────────┘
Product Name
⭐ 4.5 (120)
$79.99  $99.99
        ̶̶̶̶̶̶̶̶
```

#### Example 4: Out of Stock
```
┌──────────────────┐
│                  │
│   Product Image  │
│                  │
│ Out of Stock     │  ← Bottom overlay
└──────────────────┘
Product Name
⭐ 4.5 (120)
$99.99
```

## Color Reference

### Badge Colors
- **SALE Badge Background**: `#DC2626` (Tailwind red-600)
- **NEW Badge Background**: `#1E3A8A` (Tailwind blue-900 / navyBlue)
- **Badge Text**: `#FFFFFF` (White)

### Price Colors
- **Regular Price**: Primary color from theme
- **Special Price**: Error/Red color from theme
- **Original Price (Strikethrough)**: `#9CA3AF` (Tailwind gray-400)

## API Integration

### Expected API Response Fields

```json
{
    "id": 123,
    "name": "Product Name",
    "price": 99.99,
    "special_price": 79.99,
    "new": 1,              // or true
    "is_new": true,        // alternative field
    "on_sale": true,
    "in_stock": true,
    "thumbnail": "https://...",
    "rating": 4.5,
    "reviews_count": 120
}
```

### Field Compatibility

The implementation handles multiple field name variations:
- `new` can be boolean (`true`/`false`) or number (`1`/`0`)
- `is_new` is also checked as an alternative
- `on_sale` is checked first, with fallback to discount calculation

## Testing Checklist

### Visual Testing
- ✅ SALE badge appears on products with special_price < price
- ✅ NEW badge appears on new products without sale
- ✅ Only one badge shows at a time (SALE has priority)
- ✅ Badges only show on in-stock products
- ✅ Out of Stock overlay appears correctly
- ✅ Badge colors match web application
- ✅ Badge positioning is consistent

### Price Display Testing
- ✅ Strikethrough appears on original price when discounted
- ✅ Special price shows in red color
- ✅ Regular price shows in primary color
- ✅ Price formatting is correct
- ✅ Strikethrough color matches web app

### Edge Cases
- ✅ Product with no badges displays correctly
- ✅ Product with only NEW badge displays correctly
- ✅ Product with only SALE badge displays correctly
- ✅ Out of stock products don't show NEW/SALE badges
- ✅ Products with missing fields don't crash

## Files Modified

1. **`src/features/product/types/product.types.ts`**
   - Added `new`, `on_sale`, and `is_new` fields to Product interface

2. **`src/features/home/components/ProductCard.tsx`**
   - Added badge detection logic
   - Added SALE and NEW badge components
   - Enhanced price display styling
   - Updated badge positioning and styling

## Future Enhancements

Possible improvements:
1. **Animated Badges**: Add subtle animations when badges appear
2. **Custom Badge Text**: Support custom badge text from API
3. **Multiple Badges**: Support showing multiple badges simultaneously
4. **Badge Translations**: Translate "SALE" and "NEW" text using i18n
5. **Discount Percentage**: Show discount percentage on SALE badge
6. **Limited Time Offers**: Add countdown timer for time-limited sales
7. **Badge Themes**: Support different badge color schemes

## Summary

The mobile application now displays product badges and prices exactly like the web application:
- ✅ SALE badge for discounted products (red, top-left)
- ✅ NEW badge for new products (navy blue, top-left)
- ✅ Proper badge priority (SALE > NEW)
- ✅ Strikethrough original price with gray color
- ✅ Special price in red/error color
- ✅ Badges only on in-stock products
- ✅ Matching design and colors with web app

This creates a consistent shopping experience across both platforms and helps users quickly identify special offers and new arrivals.

