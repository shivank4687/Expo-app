# Testing Guide - Theme Customization Implementation

## Pre-Testing Checklist

Before you start testing, ensure:

- [ ] All new files are created
- [ ] All modified files are saved
- [ ] No linter errors exist
- [ ] API endpoint is configured correctly
- [ ] Mobile app is connected to Bagisto backend

---

## 1. Verify File Creation

Run these commands to verify all files exist:

```bash
# Check new files
ls -la MyFirstApp/src/services/api/theme.api.ts
ls -la MyFirstApp/src/types/theme.types.ts
ls -la MyFirstApp/src/features/home/components/ImageCarousel.tsx
ls -la MyFirstApp/src/features/home/components/CategoryCarouselCustomization.tsx
ls -la MyFirstApp/src/features/home/components/ProductCarouselCustomization.tsx
ls -la MyFirstApp/src/features/home/components/StaticContent.tsx
ls -la MyFirstApp/src/features/home/components/ThemeCustomization.tsx

# Check documentation
ls -la MyFirstApp/THEME_CUSTOMIZATION_IMPLEMENTATION.md
ls -la MyFirstApp/IMPLEMENTATION_SUMMARY.md
ls -la MyFirstApp/WEB_TO_MOBILE_MAPPING.md
ls -la MyFirstApp/TESTING_GUIDE.md
```

---

## 2. Backend Setup (Bagisto Admin)

### Step 1: Login to Bagisto Admin
Navigate to your Bagisto admin panel.

### Step 2: Create Theme Customizations

#### A. Create Image Carousel
1. Go to **Settings → Themes → Customizations**
2. Click **Create Customization**
3. Fill in:
   - **Name**: "Hero Banner"
   - **Type**: Image Carousel
   - **Sort Order**: 1
   - **Status**: Active
   - **Channel**: Select your channel
   - **Theme Code**: default
4. Upload banner images
5. Add links (optional)
6. Save

#### B. Create Category Carousel
1. Click **Create Customization**
2. Fill in:
   - **Name**: "Shop by Category"
   - **Type**: Category Carousel
   - **Sort Order**: 2
   - **Status**: Active
   - **Title**: "Shop by Category"
3. Add filters if needed (optional):
   ```json
   {
     "limit": 10
   }
   ```
4. Save

#### C. Create Product Carousel (Featured)
1. Click **Create Customization**
2. Fill in:
   - **Name**: "Featured Products"
   - **Type**: Product Carousel
   - **Sort Order**: 3
   - **Status**: Active
   - **Title**: "Featured Products"
3. Add filters:
   ```json
   {
     "featured": 1,
     "per_page": 10
   }
   ```
4. Save

#### D. Create Product Carousel (New Arrivals)
1. Click **Create Customization**
2. Fill in:
   - **Name**: "New Arrivals"
   - **Type**: Product Carousel
   - **Sort Order**: 4
   - **Status**: Active
   - **Title**: "New Arrivals"
3. Add filters:
   ```json
   {
     "sort": "created_at",
     "order": "desc",
     "per_page": 10
   }
   ```
4. Save

#### E. Create Static Content (Optional)
1. Click **Create Customization**
2. Fill in:
   - **Name**: "Welcome Message"
   - **Type**: Static Content
   - **Sort Order**: 5
   - **Status**: Active
3. Add HTML content:
   ```html
   <h2>Welcome to Our Store!</h2>
   <p>Discover our latest collections and exclusive deals.</p>
   ```
4. Save

---

## 3. API Testing

### Test API Endpoint Directly

```bash
# Replace with your actual API URL
curl -X GET "https://your-domain.com/api/v1/theme/customizations" \
     -H "Accept: application/json"
```

**Expected Response**:
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
        "images": [...]
      }
    },
    // ... more customizations
  ]
}
```

---

## 4. Mobile App Testing

### Build and Run

```bash
cd MyFirstApp

# Install dependencies (if needed)
npm install

# iOS
npx expo run:ios

# Android
npx expo run:android

# Or use Expo Go
npx expo start
```

### Test Cases

#### Test Case 1: Initial Load
1. **Action**: Launch the app and navigate to home screen
2. **Expected Result**: 
   - Loading spinner appears
   - Customizations load from API
   - All configured customizations display in order
3. **Check Console**: Look for log message "Theme customizations loaded: X"

#### Test Case 2: Image Carousel
1. **Action**: View the image carousel
2. **Expected Result**:
   - Images display full width
   - Auto-plays every 4 seconds
   - Pagination dots show at bottom
   - Active dot is highlighted
3. **Action**: Swipe left/right
4. **Expected Result**: Images slide smoothly
5. **Action**: Tap on image with link
6. **Expected Result**: Link opens (if configured)

#### Test Case 3: Category Carousel
1. **Action**: Scroll to category carousel
2. **Expected Result**:
   - Title displays: "Shop by Category"
   - Categories display in circular images
   - Category names show below images
   - Horizontal scroll works
3. **Action**: Tap on a category
4. **Expected Result**: Navigates to category screen

#### Test Case 4: Product Carousel (Featured)
1. **Action**: Scroll to featured products
2. **Expected Result**:
   - Title displays: "Featured Products"
   - Products display in cards
   - Product images, names, prices visible
   - Horizontal scroll works
3. **Action**: Tap on a product
4. **Expected Result**: Navigates to product detail screen

#### Test Case 5: Product Carousel (New Arrivals)
1. **Action**: Scroll to new arrivals
2. **Expected Result**:
   - Title displays: "New Arrivals"
   - Products display in cards
   - Shows most recent products
3. **Action**: Scroll through products
4. **Expected Result**: Smooth horizontal scrolling

#### Test Case 6: Static Content
1. **Action**: Scroll to static content section
2. **Expected Result**:
   - Text content displays
   - HTML tags are stripped
   - Text is readable

#### Test Case 7: Pull to Refresh
1. **Action**: Pull down from top of screen
2. **Expected Result**:
   - Refresh indicator appears
   - API is called again
   - Content updates if changes were made
   - Refresh indicator disappears

#### Test Case 8: Error Handling
1. **Action**: Disconnect internet, then pull to refresh
2. **Expected Result**:
   - Error message displays
   - "Retry" button appears
3. **Action**: Reconnect internet and tap "Retry"
4. **Expected Result**: Content loads successfully

#### Test Case 9: Empty State
1. **Action**: In admin, deactivate all customizations
2. **Action**: Pull to refresh in app
3. **Expected Result**: Empty screen (no errors)

#### Test Case 10: Sort Order
1. **Action**: In admin, change sort_order values
2. **Action**: Pull to refresh in app
3. **Expected Result**: Customizations display in new order

---

## 5. Responsive Testing

Test on different devices and orientations:

### Phone (Portrait)
- [ ] All components display correctly
- [ ] Images scale properly
- [ ] Touch targets are accessible
- [ ] Scroll is smooth

### Phone (Landscape)
- [ ] Components adapt to wider screen
- [ ] No layout breaks
- [ ] Content is readable

### Tablet (Portrait)
- [ ] Larger touch targets
- [ ] Better spacing
- [ ] Content scales appropriately

### Tablet (Landscape)
- [ ] Full width utilization
- [ ] Optimized layout
- [ ] Smooth interactions

---

## 6. Performance Testing

### Load Time
- [ ] Initial load < 3 seconds (with good connection)
- [ ] Pull to refresh < 2 seconds
- [ ] No jank or stuttering

### Scroll Performance
- [ ] Horizontal scrolls are smooth (60 FPS)
- [ ] Vertical scroll is smooth
- [ ] No lag when switching between sections

### Memory Usage
- [ ] No memory leaks
- [ ] Images load efficiently
- [ ] App doesn't crash with many items

---

## 7. Edge Cases Testing

### Large Dataset
1. **Action**: Create 20+ customizations in admin
2. **Expected Result**: All render without issues

### Long Titles
1. **Action**: Use very long title for carousel
2. **Expected Result**: Text truncates or wraps properly

### Missing Images
1. **Action**: Use invalid image URL
2. **Expected Result**: Placeholder or graceful fallback

### Missing Data
1. **Action**: Create carousel with empty filters
2. **Expected Result**: Section doesn't display or shows "No items"

### Special Characters
1. **Action**: Use special characters in titles
2. **Expected Result**: Displays correctly, no encoding issues

---

## 8. Console Logging

Check console for these messages:

### Successful Load
```
[HomeScreen] Loading theme customizations...
[Theme API] GET /api/v1/theme/customizations
[HomeScreen] Theme customizations loaded: 5
```

### Category Carousel
```
[Categories API] Fetching from API
[Categories API] Loaded categories: 8
```

### Product Carousel
```
[Products API] Loading products...
[Products API] Products loaded: 10
```

### Errors (if any)
```
Error loading theme customizations: [error message]
Error loading categories: [error message]
Error loading products: [error message]
```

---

## 9. Network Monitoring

Use React Native Debugger or Flipper to monitor:

### API Calls
- [ ] `/api/v1/theme/customizations` returns 200
- [ ] `/api/v1/categories` returns 200 (if used)
- [ ] `/api/v1/products` returns 200 (for each carousel)

### Response Times
- [ ] Theme customizations: < 500ms
- [ ] Categories: < 500ms
- [ ] Products: < 1000ms

### Error Responses
- [ ] 401: Authentication handled
- [ ] 404: Error message displayed
- [ ] 500: Error message displayed

---

## 10. Comparison Testing

### Side-by-Side Comparison
1. **Action**: Open web application in browser
2. **Action**: Open mobile app
3. **Compare**:
   - Same sections in same order
   - Same titles
   - Same products/categories
   - Same banner images

### Content Updates
1. **Action**: Update customization in admin (e.g., change title)
2. **Action**: Refresh web page
3. **Expected**: Web shows new title
4. **Action**: Pull to refresh in mobile app
5. **Expected**: Mobile shows new title

---

## 11. Regression Testing

Ensure old functionality still works:

- [ ] Product detail screen still works
- [ ] Category navigation still works
- [ ] Cart functionality still works
- [ ] User authentication still works
- [ ] Other tabs/screens still work

---

## 12. Common Issues Checklist

If something doesn't work, check:

### API Connection
- [ ] Base URL is correct
- [ ] API endpoint path is correct
- [ ] Authentication token is valid
- [ ] CORS is configured (if web)

### Backend Configuration
- [ ] Customizations are "Active"
- [ ] Channel ID matches
- [ ] Sort order is set
- [ ] Images are uploaded and accessible

### Frontend Code
- [ ] All files are saved
- [ ] No TypeScript errors
- [ ] App was rebuilt after changes
- [ ] Metro bundler is running

### Data Issues
- [ ] Categories exist in database
- [ ] Products exist in database
- [ ] Images are publicly accessible
- [ ] URLs use HTTPS

---

## 13. Testing Sign-off

After completing all tests, fill this checklist:

### Functionality
- [ ] All customization types work
- [ ] Navigation works correctly
- [ ] Pull to refresh works
- [ ] Error handling works

### UI/UX
- [ ] Layout matches design
- [ ] Responsive on all devices
- [ ] Animations are smooth
- [ ] Touch targets are accessible

### Performance
- [ ] Fast load times
- [ ] Smooth scrolling
- [ ] No memory leaks
- [ ] Efficient API calls

### Quality
- [ ] No console errors
- [ ] No linter errors
- [ ] Code is well-documented
- [ ] Matches web application

---

## 14. Success Criteria

The implementation is successful if:

✅ **Structural Parity**: Mobile homepage structure matches web homepage  
✅ **Dynamic Configuration**: Content is managed from admin panel  
✅ **All Types Supported**: Image, Category, Product carousels and Static content work  
✅ **Responsive Design**: Works on all device sizes  
✅ **Performance**: Smooth and fast user experience  
✅ **Error Handling**: Graceful handling of errors  
✅ **Pull to Refresh**: Content updates without app restart  
✅ **Navigation**: All links and interactions work correctly  

---

## Need Help?

If tests fail, check:
1. Console logs for error messages
2. Network tab for API responses
3. Backend configuration in admin
4. Documentation files for guidance

**Happy Testing! 🚀**

