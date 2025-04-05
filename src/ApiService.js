import axios from 'axios';

// Get API base URL from environment variable
const API_URL = process.env.REACT_APP_API_URL || 'https://localhost:7209';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Handle 401 Unauthorized globally - redirect to login
    if (error.response && error.response.status === 401) {
      // Store the current location for redirect after login
      localStorage.setItem('loginRedirect', window.location.pathname);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Cart API methods
const CartService = {
  getCartItems: () => {
    return apiClient.get('/api/Cart');
  },
  
  addToCart: (productId, quantity = 1) => {
    return apiClient.post('/api/Cart', { productId, quantity });
  },
  
  updateCartItem: (cartItemId, quantity) => {
    return apiClient.put(`/api/Cart/${cartItemId}`, { quantity });
  },
  
  removeCartItem: (cartItemId) => {
    return apiClient.delete(`/api/Cart/${cartItemId}`);
  },
  
  clearCart: () => {
    return apiClient.delete('/api/Cart');
  }
};

// Wishlist API methods
const WishlistService = {
  getWishlistItems: () => {
    return apiClient.get('/api/Wishlist');
  },
  
  addToWishlist: (productId) => {
    return apiClient.post('/api/Wishlist', { productId });
  },
  
  removeWishlistItem: (wishlistItemId) => {
    return apiClient.delete(`/api/Wishlist/${wishlistItemId}`);
  },
  
  moveToCart: (wishlistItemId) => {
    return apiClient.post(`/api/Wishlist/MoveToCart/${wishlistItemId}`);
  },
  
  clearWishlist: () => {
    return apiClient.delete('/api/Wishlist');
  }
};

// Product API methods
const ProductService = {
  getProducts: () => {
    return apiClient.get('/api/Product');
  },
  
  getProduct: (productId) => {
    return apiClient.get(`/api/Product/${productId}`);
  }
};

// Export all services
export { 
  CartService, 
  WishlistService, 
  ProductService,
  apiClient  // Export base client for other API calls
};