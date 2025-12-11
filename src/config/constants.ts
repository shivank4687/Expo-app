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
    REGISTER: '/customer/register-mobile',
    CHECK_DUPLICATE: '/customer/check-duplicate',
    VERIFY_OTP: '/customer/verify-otp',
    RESEND_OTP: '/customer/resend-otp',
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
    UPDATE_PROFILE: '/customer/profile',
    ADDRESSES: '/customer/addresses',
    NEWSLETTER_SUBSCRIPTION: '/customer/subscription',
    
    // B2B Marketplace - Supplier Messages
    MESSAGE_SUPPLIER: '/supplier/message',
    SUPPLIER_MESSAGE_THREADS: '/supplier/messages',
    
    // B2B Marketplace - Supplier Shop
    SUPPLIER_PROFILE: '/supplier/:url',
    SUPPLIER_PRODUCTS: '/supplier/:url/products',
    
    // B2B Marketplace - RFQ
    RFQ_STORE: '/supplier/rfq',
    RFQ_SEARCH_PRODUCTS: '/supplier/rfq/search-products',
    
    // B2B Marketplace - Customer Quotes
    CUSTOMER_QUOTES: '/customer/quotes',
    CUSTOMER_QUOTE_DETAIL: '/customer/quotes/:quoteId',
    CUSTOMER_QUOTE_STATUS: '/customer/quotes/:quoteId/status/:status',
    
    // B2B Marketplace - Supplier Reviews
    SUPPLIER_REVIEW_STORE: '/supplier/:url/reviews',
    
    // B2B Marketplace - Quick Order
    QUICK_ORDER_SEARCH: '/supplier/quick-order/search',
    QUICK_ORDER_STORE: '/supplier/quick-order',
    
    // B2B Marketplace - Contact Supplier
    CONTACT_SUPPLIER: '/supplier/:url/contact',
    
    // B2B Marketplace - Report Supplier
    REPORT_SUPPLIER: '/supplier/flag',
    
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
