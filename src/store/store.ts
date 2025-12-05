import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import authReducer from './slices/authSlice';
import coreReducer from './slices/coreSlice';
import categoryReducer from './slices/categorySlice';
import cmsReducer from './slices/cmsSlice';
import cartReducer from './slices/cartSlice';
import wishlistReducer from './slices/wishlistSlice';

// Use AsyncStorage for native, localStorage for web
const storage = Platform.OS === 'web'
    ? {
        getItem: async (key: string) => {
            try {
                return localStorage.getItem(key);
            } catch {
                return null;
            }
        },
        setItem: async (key: string, value: string) => {
            try {
                localStorage.setItem(key, value);
            } catch {
                // Ignore
            }
        },
        removeItem: async (key: string) => {
            try {
                localStorage.removeItem(key);
            } catch {
                // Ignore
            }
        },
    }
    : AsyncStorage;

// Persist config
const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['auth', 'core', 'category', 'cms'], // Persist auth, core, category, and cms (cart is fetched from server)
};

// Root reducer
const rootReducer = combineReducers({
  auth: authReducer,
  core: coreReducer,
  category: categoryReducer,
  cms: cmsReducer,
  cart: cartReducer,
  wishlist: wishlistReducer,
});

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Store
export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
});

export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
