# Theme Customization Implementation for Mobile App

## Overview

This document describes the implementation of the dynamic theme customization system for the mobile app, which now mirrors the web application's homepage structure using Bagisto's theme customization API.

## What Changed

### 1. **New API Service**
- **File**: `src/services/api/theme.api.ts`
- Fetches theme customizations from the backend API endpoint `/api/v1/theme/customizations`
- Returns customizations sorted by `sort_order` as configured in the admin panel

### 2. **Type Definitions**
- **File**: `src/types/theme.types.ts`
- Defines types for all customization types:
  - `IMAGE_CAROUSEL` - Banner/hero images with links
  - `STATIC_CONTENT` - HTML content blocks
  - `CATEGORY_CAROUSEL` - Horizontal scrolling category list
  - `PRODUCT_CAROUSEL` - Horizontal scrolling product list
  - `FOOTER_LINKS` - Footer navigation (not used on home screen)
  - `SERVICES_CONTENT` - Service information blocks (not used on home screen)

### 3. **New Components**

#### a. ImageCarousel (`src/features/home/components/ImageCarousel.tsx`)
- Displays a full-width image carousel/slider
- Supports clickable images with custom links
- Auto-plays through images every 4 seconds
- Shows pagination dots at the bottom
- Fully responsive

#### b. CategoryCarouselCustomization (`src/features/home/components/CategoryCarouselCustomization.tsx`)
- Displays categories in circular thumbnails
- Horizontal scrolling
- Fetches categories from API with optional filters
- Navigates to category page on tap
- Shows category name below the image

#### c. ProductCarouselCustomization (`src/features/home/components/ProductCarouselCustomization.tsx`)
- Displays products in horizontal scroll
- Uses the existing `ProductCard` component
- Fetches products from API with optional filters
- Navigates to product detail on tap
- Supports customizable title

#### d. StaticContent (`src/features/home/components/StaticContent.tsx`)
- Displays HTML content from customizations
- Currently strips HTML tags for simple text display
- **Note**: For full HTML rendering, install `react-native-render-html`

#### e. ThemeCustomization (`src/features/home/components/ThemeCustomization.tsx`)
- Main renderer component
- Switches between different customization types
- Renders the appropriate component based on customization type

### 4. **Updated HomeScreen**
- **File**: `src/features/home/screens/HomeScreen.tsx`
- Now uses dynamic theme customizations instead of hardcoded layout
- Fetches customizations from API on mount
- Renders customizations in order defined by admin
- Pull-to-refresh support
- Error handling with retry option

### 5. **Updated API Services**
- **File**: `src/services/api/categories.api.ts`
  - Updated `getCategories()` to accept optional filters
  - Returns data in `{ data: Category[] }` format for consistency
  - Added `logo` property to `Category` interface

- **File**: `src/config/constants.ts`
  - Added `THEME_CUSTOMIZATIONS` endpoint

## How It Works

### Data Flow

```
1. HomeScreen loads
   ↓
2. Fetches theme customizations from API
   ↓
3. Receives array of customizations sorted by sort_order
   ↓
4. Maps through customizations
   ↓
5. ThemeCustomization component renders each customization
   ↓
6. Appropriate component is rendered based on type:
   - IMAGE_CAROUSEL → ImageCarousel
   - CATEGORY_CAROUSEL → CategoryCarouselCustomization
   - PRODUCT_CAROUSEL → ProductCarouselCustomization
   - STATIC_CONTENT → StaticContent
```

### Example API Response Structure

```json
{
  "data": [
    {
      "id": 1,
      "type": "image_carousel",
      "name": "Hero Banner",
      "sort_order": 1,
      "status": 1,
      "channel_id": 1,
      "theme_code": "default",
      "options": {
        "images": [
          {
            "image": "https://example.com/banner1.jpg",
            "link": "https://example.com/sale",
            "title": "Summer Sale"
          }
        ]
      }
    },
    {
      "id": 2,
      "type": "category_carousel",
      "name": "Shop by Category",
      "sort_order": 2,
      "status": 1,
      "channel_id": 1,
      "theme_code": "default",
      "options": {
        "title": "Shop by Category",
        "filters": {
          "limit": 10
        }
      }
    },
    {
      "id": 3,
      "type": "product_carousel",
      "name": "Featured Products",
      "sort_order": 3,
      "status": 1,
      "channel_id": 1,
      "theme_code": "default",
      "options": {
        "title": "Featured Products",
        "filters": {
          "featured": 1,
          "per_page": 10
        }
      }
    }
  ]
}
```

## Configuration

### In Bagisto Admin Panel

1. Go to **Settings → Themes → Customizations**
2. Create/Edit customizations:
   - Choose customization type
   - Set sort order (lower numbers appear first)
   - Configure options (title, filters, images, etc.)
   - Set status to "Active"
   - Assign to the correct channel

### Mobile App Configuration

No additional configuration needed in the mobile app. It automatically fetches and renders whatever customizations are configured in the admin panel.

## Responsive Design

All components are fully responsive and adapt to different screen sizes:
- **ImageCarousel**: Full screen width, adjustable height
- **CategoryCarousel**: Horizontal scroll with appropriate sizing for touch targets
- **ProductCarousel**: Card-based layout optimized for mobile viewing
- **StaticContent**: Text reflows based on screen width

## Benefits

1. **Dynamic Content Management**: Content is managed from the admin panel, no code changes needed
2. **Consistent Experience**: Mobile app matches web application structure
3. **Flexibility**: Easy to reorder, add, or remove sections
4. **Maintainability**: Centralized theme management across web and mobile
5. **Scalability**: Easy to add new customization types in the future

## Future Enhancements

1. **Full HTML Rendering**: Install and integrate `react-native-render-html` for rich HTML content in StaticContent
2. **Caching**: Implement caching strategy for customizations to improve performance
3. **Image Optimization**: Add image caching and progressive loading
4. **Analytics**: Track user interactions with different customization types
5. **A/B Testing**: Support for testing different customization configurations

## Testing

To test the implementation:

1. **Verify API Connection**:
   ```bash
   # Check if theme customizations API is accessible
   curl https://your-api-url/api/v1/theme/customizations
   ```

2. **Test Each Customization Type**:
   - Create one of each customization type in admin
   - Verify they render correctly in the mobile app
   - Test interactions (taps, scrolling, navigation)

3. **Test Edge Cases**:
   - Empty customizations list
   - API errors
   - Missing images
   - Long titles/text
   - Large number of items in carousels

## Troubleshooting

### Issue: Customizations not loading
- Check API endpoint is correct
- Verify authentication token is valid
- Check network connectivity
- Look for errors in console logs

### Issue: Images not displaying
- Verify image URLs are accessible from mobile device
- Check if images are served over HTTPS
- Ensure correct image permissions

### Issue: Categories/Products not loading in carousels
- Verify the category/product APIs are working
- Check filter parameters in customization options
- Ensure data exists for the given filters

## Migration Notes

If you were using the old hardcoded HomeScreen:
- The old CategoryList component is still available
- The old ProductCard component is reused
- Featured products and all products sections are now managed via product carousels in admin
- Header/search functionality can be added back if needed (currently commented out)

## Summary

The mobile app now has a fully dynamic, theme-driven homepage that matches the web application's structure and content. All content is managed from the Bagisto admin panel, providing a consistent experience across platforms and eliminating the need for code changes when updating homepage content.

