# Image URL Fix - Theme Customization

## Problem

The Bagisto API returns relative image URLs like:
```
"storage/theme/1/z2TdF95Ej2eDCWuVraKAZhXs8EuxvPVlcuAMFCFb.webp"
```

The mobile app was trying to load these from `localhost:8081` (React Native dev server) instead of the Bagisto backend server, causing images not to display.

## Solution

Created a utility function that converts relative image URLs to absolute URLs using the configured backend server URL.

### Files Created

**`src/shared/utils/imageUtils.ts`**
- `getAbsoluteImageUrl(imageUrl)` - Converts relative to absolute URL
- `normalizeImageUrls(images)` - Batch conversion for arrays

### Files Modified

1. **`src/features/home/components/ImageCarousel.tsx`**
   - Now uses `getAbsoluteImageUrl()` for carousel images

2. **`src/features/home/components/CategoryCarouselCustomization.tsx`**
   - Now uses `getAbsoluteImageUrl()` for category images

3. **`src/features/home/components/ProductCard.tsx`**
   - Now uses `getAbsoluteImageUrl()` for product images

## How It Works

```typescript
// Before
<Image source={{ uri: "storage/theme/1/image.webp" }} />
// Tries to load from: localhost:8081/storage/theme/1/image.webp ❌

// After
<Image source={{ uri: getAbsoluteImageUrl("storage/theme/1/image.webp") }} />
// Loads from: http://192.168.31.102:8000/storage/theme/1/image.webp ✅
```

### The Function

```typescript
export const getAbsoluteImageUrl = (imageUrl?: string): string => {
    if (!imageUrl) {
        return 'https://via.placeholder.com/400x300?text=No+Image';
    }

    // If already absolute, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }

    // Convert relative to absolute
    const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
    return `${config.baseUrl}/${cleanPath}`;
};
```

## Configuration

The base URL is configured in `src/config/env.ts`:

```typescript
const getBaseUrl = () => {
  return Platform.OS === "android"
    ? "http://10.0.2.2:8000"      // Android emulator
    : "http://192.168.31.102:8000"; // iOS simulator / physical device
};
```

## Testing

1. **Image Carousel**: Banner images now load correctly
2. **Category Carousel**: Category logos now load correctly
3. **Product Carousel**: Product thumbnails now load correctly

## Benefits

✅ All images now load from the correct backend server  
✅ Handles both relative and absolute URLs  
✅ Provides fallback placeholder for missing images  
✅ Works across all components  
✅ Easy to maintain and extend  

## Usage in New Components

When displaying images from the API, always use:

```typescript
import { getAbsoluteImageUrl } from '@/shared/utils/imageUtils';

// Single image
<Image source={{ uri: getAbsoluteImageUrl(product.image) }} />

// From array
<Image source={{ uri: getAbsoluteImageUrl(product.images[0]?.url) }} />
```

## Future Improvements

- [ ] Add image caching
- [ ] Add progressive image loading
- [ ] Add retry logic for failed image loads
- [ ] Add image optimization/resizing

---

**Status**: ✅ Fixed and Working  
**Date**: December 3, 2025

