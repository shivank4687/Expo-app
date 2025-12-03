// App Constants
export const APP_NAME = 'Shop App';

export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
    CART_DATA: 'cart_data',
    LANGUAGE: 'language',
};

export const API_ENDPOINTS = {
    LOGIN: '/customer/login',
    REGISTER: '/customer/register',
    LOGOUT: '/customer/logout',
    // Products
    PRODUCTS: '/products',
    PRODUCT_DETAIL: '/products/:id',
    // Categories
    CATEGORIES: '/categories',
    CATEGORY_DETAIL: '/categories/:id',
    // Cart
    CART: '/cart',
    ADD_TO_CART: '/cart/add',
    UPDATE_CART: '/cart/update',
    REMOVE_FROM_CART: '/cart/remove',

    // Orders
    ORDERS: '/orders',
    ORDER_DETAIL: '/orders/:id',

    // Customer
    PROFILE: '/customer/profile',
    UPDATE_PROFILE: '/customer/profile/update',
    ADDRESSES: '/customer/addresses',
    
    // Theme Customizations
    THEME_CUSTOMIZATIONS: '/theme/customizations',
};

export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
};

export const VALIDATION = {
    PASSWORD_MIN_LENGTH: 8,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,
};
