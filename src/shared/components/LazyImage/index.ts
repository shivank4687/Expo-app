/**
 * LazyImage Components
 * 
 * A collection of performant image components with lazy loading and caching
 * Built on expo-image for optimal performance
 * 
 * Components:
 * - LazyImage: Base component with full customization
 * - ProductImage: For product images in lists/cards
 * - AvatarImage: For user profile images
 * - CategoryImage: For category thumbnails
 * - BannerImage: For banners and carousels (high priority)
 * 
 * Features:
 * - Automatic lazy loading
 * - Memory and disk caching
 * - Smooth transitions
 * - Error handling with fallback placeholders
 * - Automatic URL conversion (relative to absolute)
 * - Optimized for lists with recycling keys
 * 
 * @example Basic usage
 * ```tsx
 * import { LazyImage } from '@/shared/components/LazyImage';
 * 
 * <LazyImage source={{ uri: imageUrl }} style={styles.image} />
 * ```
 * 
 * @example Product image
 * ```tsx
 * import { ProductImage } from '@/shared/components/LazyImage';
 * 
 * <ProductImage 
 *   imageUrl={product.base_image?.large_image_url}
 *   style={styles.productImage}
 *   recyclingKey={product.id.toString()}
 * />
 * ```
 * 
 * @example Avatar
 * ```tsx
 * import { AvatarImage } from '@/shared/components/LazyImage';
 * 
 * <AvatarImage 
 *   imageUrl={user.avatar}
 *   style={styles.avatar}
 *   size={100}
 * />
 * ```
 */

export { LazyImage } from './LazyImage';
export type { LazyImageProps } from './LazyImage';
export { ProductImage } from './ProductImage';
export { AvatarImage } from './AvatarImage';
export { CategoryImage } from './CategoryImage';
export { BannerImage } from './BannerImage';

