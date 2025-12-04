# Lazy Image Components Usage Guide

## Overview

A collection of performant, lazy-loading image components built on `expo-image` that provide automatic caching, smooth transitions, and error handling. All images are lazy-loaded (only loaded when in viewport) and cached for optimal performance.

## Features

✅ **Lazy Loading** - Images load only when visible in viewport  
✅ **Memory & Disk Caching** - Automatic caching for faster subsequent loads  
✅ **Smooth Transitions** - Fade-in animations when images load  
✅ **Error Handling** - Fallback placeholders when images fail  
✅ **URL Conversion** - Automatic relative to absolute URL conversion  
✅ **List Optimization** - Image recycling for better performance in FlatLists/ScrollViews  
✅ **Priority Loading** - Control which images load first  

## Components

### 1. LazyImage (Base Component)

The foundational component with full customization options.

```tsx
import { LazyImage } from '@/shared/components/LazyImage';

<LazyImage 
  source={{ uri: imageUrl }}
  style={styles.image}
  contentFit="cover"
  transition={{ duration: 300 }}
  cachePolicy="memory-disk"
  priority="normal"
  placeholderIcon="image-outline"
  placeholderIconSize={40}
  onError={() => console.log('Failed to load')}
/>
```

**Props:**
- `source`: string | { uri: string } | number (required)
- `style`: ViewStyle
- `contentFit`: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
- `transition`: number (ms) or ImageTransition object
- `cachePolicy`: 'none' | 'disk' | 'memory' | 'memory-disk'
- `priority`: 'low' | 'normal' | 'high'
- `recyclingKey`: string (for list optimization)
- `placeholderIcon`: Ionicons icon name
- `placeholderIconSize`: number
- `onError`: callback function

### 2. ProductImage

Specialized component for product images with optimized settings.

```tsx
import { ProductImage } from '@/shared/components/LazyImage';

<ProductImage 
  imageUrl={product.base_image?.large_image_url}
  style={styles.productImage}
  recyclingKey={product.id.toString()}
  priority="low"
/>
```

**Best for:**
- Product cards in lists
- Product thumbnails
- Search results

**Auto-configured:**
- Uses 'cube-outline' icon as placeholder
- Memory-disk caching enabled
- 200ms transition duration

### 3. AvatarImage

Specialized component for user profile images.

```tsx
import { AvatarImage } from '@/shared/components/LazyImage';

<AvatarImage 
  imageUrl={user.avatar}
  style={styles.avatar}
  size={100}
/>
```

**Best for:**
- User profile pictures
- Comment avatars
- User lists

**Auto-configured:**
- Uses 'person-outline' icon as placeholder
- High priority loading
- Circular placeholder
- Memory-disk caching

### 4. CategoryImage

Specialized component for category thumbnails.

```tsx
import { CategoryImage } from '@/shared/components/LazyImage';

<CategoryImage 
  imageUrl={category.logo_path || category.image}
  style={styles.categoryImage}
  priority="normal"
/>
```

**Best for:**
- Category cards
- Category carousels
- Navigation menus

**Auto-configured:**
- Uses 'grid-outline' icon as placeholder
- Normal priority loading
- Memory-disk caching

### 5. BannerImage

Specialized component for banner/hero images.

```tsx
import { BannerImage } from '@/shared/components/LazyImage';

<BannerImage 
  imageUrl={banner.image}
  style={styles.bannerImage}
  priority="high"
/>
```

**Best for:**
- Hero banners
- Carousel images
- Above-the-fold content

**Auto-configured:**
- Uses 'images-outline' icon as placeholder
- High priority loading (loads first)
- 300ms transition duration
- Memory-disk caching

## Usage Examples

### Example 1: Product List with Recycling

```tsx
import { ProductImage } from '@/shared/components/LazyImage';

<FlatList
  data={products}
  keyExtractor={(item) => item.id.toString()}
  renderItem={({ item }) => (
    <View style={styles.productCard}>
      <ProductImage
        imageUrl={item.thumbnail}
        style={styles.productImage}
        recyclingKey={item.id.toString()} // Important for performance!
        priority="low"
      />
      <Text>{item.name}</Text>
    </View>
  )}
/>
```

### Example 2: User Profile with Avatar

```tsx
import { AvatarImage } from '@/shared/components/LazyImage';

<View style={styles.profile}>
  <AvatarImage
    imageUrl={user.avatar}
    style={styles.avatar}
    size={120}
  />
  <Text>{user.name}</Text>
</View>

const styles = StyleSheet.create({
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
});
```

### Example 3: Hero Banner with High Priority

```tsx
import { BannerImage } from '@/shared/components/LazyImage';

<BannerImage 
  imageUrl={bannerData.image}
  style={styles.heroBanner}
  priority="high" // Loads immediately
/>

const styles = StyleSheet.create({
  heroBanner: {
    width: '100%',
    height: 250,
  },
});
```

### Example 4: Category Grid

```tsx
import { CategoryImage } from '@/shared/components/LazyImage';

<ScrollView horizontal>
  {categories.map((category) => (
    <TouchableOpacity key={category.id}>
      <CategoryImage
        imageUrl={category.logo_path}
        style={styles.categoryIcon}
      />
      <Text>{category.name}</Text>
    </TouchableOpacity>
  ))}
</ScrollView>

const styles = StyleSheet.create({
  categoryIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
});
```

### Example 5: Custom LazyImage with Error Handling

```tsx
import { LazyImage } from '@/shared/components/LazyImage';

const [imageError, setImageError] = useState(false);

<LazyImage
  source={{ uri: customImageUrl }}
  style={styles.customImage}
  contentFit="contain"
  transition={500}
  priority="high"
  placeholderIcon="camera-outline"
  placeholderIconSize={60}
  placeholderIconColor="#FF6B6B"
  onError={() => {
    console.log('Image failed to load');
    setImageError(true);
  }}
/>
```

## Performance Tips

### 1. Use Recycling Keys in Lists

Always provide `recyclingKey` for images in FlatList/ScrollView:

```tsx
<ProductImage
  imageUrl={product.image}
  recyclingKey={product.id.toString()} // ✅ Good
/>
```

### 2. Set Appropriate Priority

- **High**: Above-the-fold content, hero banners
- **Normal**: Visible content below the fold
- **Low**: Content in scrollable lists

```tsx
// First carousel image - high priority
<BannerImage priority="high" {...} />

// Product list items - low priority
<ProductImage priority="low" {...} />
```

### 3. Choose Right Cache Policy

- **memory-disk** (default): Best for most use cases
- **memory**: For temporary images
- **disk**: For large images rarely accessed
- **none**: For sensitive content

```tsx
<LazyImage 
  cachePolicy="memory-disk" // ✅ Default - best performance
  {...}
/>
```

### 4. Optimize Image Sizes

Load appropriately sized images from the backend:

```tsx
// ✅ Good - use thumbnails for lists
<ProductImage imageUrl={product.thumbnail} />

// ❌ Bad - loading full-res image for thumbnail
<ProductImage imageUrl={product.full_size_image} />
```

## Migration from Standard Image

### Before (Standard React Native Image)

```tsx
import { Image } from 'react-native';

<Image
  source={{ uri: product.image }}
  style={styles.image}
  resizeMode="cover"
/>
```

### After (LazyImage Component)

```tsx
import { ProductImage } from '@/shared/components/LazyImage';

<ProductImage
  imageUrl={product.image}
  style={styles.image}
/>
```

## Benefits Over Standard Image

| Feature | Standard Image | LazyImage |
|---------|---------------|-----------|
| Lazy Loading | ❌ No | ✅ Yes |
| Caching | ❌ Basic | ✅ Memory + Disk |
| Error Handling | ❌ Manual | ✅ Built-in |
| Transitions | ❌ Manual | ✅ Built-in |
| URL Conversion | ❌ Manual | ✅ Automatic |
| List Optimization | ❌ No | ✅ Image Recycling |
| Priority Loading | ❌ No | ✅ Yes |

## Common Issues & Solutions

### Issue: Images not loading

**Solution:** Check that URLs are correct and the image source is accessible:

```tsx
<LazyImage 
  source={{ uri: imageUrl }}
  onError={() => console.log('Failed:', imageUrl)} // Debug
/>
```

### Issue: Slow loading in lists

**Solution:** Add recycling keys and use low priority:

```tsx
<ProductImage
  recyclingKey={item.id.toString()} // Add this!
  priority="low"
  {...}
/>
```

### Issue: Placeholder not showing

**Solution:** Ensure style has dimensions:

```tsx
<LazyImage 
  style={{ width: 200, height: 200 }} // ✅ Good
  {...}
/>
```

## Summary

Use these components everywhere you need images in the app:

- **ProductImage** → Product lists, search results
- **AvatarImage** → User profiles, comments
- **CategoryImage** → Category navigation, filters
- **BannerImage** → Hero banners, carousels
- **LazyImage** → Custom use cases

All components automatically handle lazy loading, caching, and errors for optimal performance! 🚀

