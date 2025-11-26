# Shop Mobile App

A React Native Expo mobile application for your Bagisto e-commerce platform with authentication, product browsing, and detailed product views.

## Features

- ✅ **Authentication**: Login and signup with form validation
- ✅ **Home Page**: Product grid with featured products and categories
- ✅ **Product Details**: Image gallery, pricing, ratings, and add to cart
- ✅ **Professional Architecture**: Feature-based structure for scalability
- ✅ **Theme System**: Consistent design with colors, typography, and spacing
- ✅ **API Integration**: Ready to connect to Bagisto backend

## Project Structure

```
MyFirstApp/
├── src/
│   ├── features/          # Feature modules
│   │   ├── auth/          # Authentication
│   │   ├── home/          # Home screen
│   │   └── product/       # Product details
│   ├── shared/            # Shared components & utilities
│   ├── services/          # API services
│   ├── theme/             # Design system
│   └── config/            # Configuration
├── app/                   # Expo Router screens
└── assets/                # Images, fonts, etc.
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure API URL**:
   Edit `src/config/env.ts` and update the `apiUrl` with your Bagisto backend URL:
   ```typescript
   development: {
     apiUrl: 'http://your-bagisto-url.com/api',
     timeout: 30000,
   }
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Run on device/simulator**:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

## Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run on web
- `npm run lint` - Run ESLint

## API Configuration

The app expects the following Bagisto API endpoints:

### Authentication
- `POST /customer/login` - User login
- `POST /customer/register` - User registration
- `POST /customer/logout` - User logout

### Products
- `GET /products` - List products (with pagination)
- `GET /products/:id` - Get product details
- `GET /products/featured` - Get featured products
- `GET /products/search` - Search products

### Categories
- `GET /categories` - List categories
- `GET /categories/:id/products` - Get products by category

## Key Technologies

- **React Native** - Mobile framework
- **Expo** - Development platform
- **TypeScript** - Type safety
- **Expo Router** - File-based routing
- **Axios** - HTTP client
- **Expo Secure Store** - Secure storage

## Architecture Highlights

### Feature-Based Structure
Each feature (auth, home, product) contains its own:
- Screens
- Components
- Types
- Business logic

### Theme System
Centralized design tokens for:
- Colors (primary, secondary, semantic)
- Typography (sizes, weights, families)
- Spacing (consistent 4px scale)
- Shadows and border radius

### API Layer
- Centralized API client with interceptors
- Automatic token injection
- Error handling
- Type-safe requests/responses

## Next Steps

### Immediate Enhancements
1. Connect to actual Bagisto API
2. Implement search functionality
3. Add cart management
4. Implement checkout flow
5. Add user profile management

### Future Features
- Push notifications
- Wishlist
- Order tracking
- Product reviews
- Social authentication
- Dark mode support

## Troubleshooting

### Path Aliases Not Working
If you see import errors, try:
```bash
# Clear Metro bundler cache
npm start -- --clear

# Or restart with clean cache
npx expo start -c
```

### TypeScript Errors
Make sure all dependencies are installed:
```bash
npm install
```

### API Connection Issues
1. Check that your Bagisto backend is running
2. Verify the API URL in `src/config/env.ts`
3. Ensure CORS is properly configured on backend
4. Check network connectivity

## Contributing

When adding new features:
1. Follow the feature-based structure
2. Use TypeScript for type safety
3. Utilize the theme system for styling
4. Add proper error handling
5. Update this README

## License

[Your License Here]
