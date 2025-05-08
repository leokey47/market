import axios from 'axios';

// Используем HTTPS для API
const API_URL = 'https://localhost:7209';

// Создаем экземпляр axios с настройками по умолчанию
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false
});

// Добавляем перехватчик запросов для добавления токена авторизации
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

// Добавляем перехватчик ответов для обработки ошибок аутентификации
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.setItem('loginRedirect', window.location.pathname);
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Функция для обновления количества в корзине
const updateCartCount = (change = 0, absolute = null) => {
  try {
    if (absolute !== null) {
      localStorage.setItem('cartCount', absolute.toString());
    } else {
      const currentCount = parseInt(localStorage.getItem('cartCount') || '0');
      const newCount = Math.max(0, currentCount + change);
      localStorage.setItem('cartCount', newCount.toString());
    }
    
    const cartUpdateEvent = new Event('cartUpdate');
    window.dispatchEvent(cartUpdateEvent);
  } catch (error) {
    console.error('Ошибка обновления счетчика корзины:', error);
  }
};

// Функция для обновления количества в списке желаемого
const updateWishlistCount = (change = 0, absolute = null) => {
  try {
    if (absolute !== null) {
      localStorage.setItem('wishlistCount', absolute.toString());
    } else {
      const currentCount = parseInt(localStorage.getItem('wishlistCount') || '0');
      const newCount = Math.max(0, currentCount + change);
      localStorage.setItem('wishlistCount', newCount.toString());
    }
    
    const wishlistUpdateEvent = new Event('wishlistUpdate');
    window.dispatchEvent(wishlistUpdateEvent);
  } catch (error) {
    console.error('Ошибка обновления счетчика желаемого:', error);
  }
};

// Методы API для корзины
const CartService = {
  getCartItems: async () => {
    try {
      const response = await apiClient.get('/api/Cart');
      updateCartCount(0, response.data.length);
      return response.data;
    } catch (error) {
      console.error('Ошибка получения товаров корзины:', error);
      throw error;
    }
  },
 
  addToCart: async (productId, quantity = 1) => {
    try {
      const response = await apiClient.post('/api/Cart', { productId, quantity });
      updateCartCount(1);
      return response.data;
    } catch (error) {
      console.error('Ошибка добавления в корзину:', error);
      throw error;
    }
  },
 
  updateCartItem: async (cartItemId, quantity) => {
    try {
      const response = await apiClient.put(`/api/Cart/${cartItemId}`, { quantity });
      return response.data;
    } catch (error) {
      console.error('Ошибка обновления товара в корзине:', error);
      throw error;
    }
  },
 
  removeCartItem: async (cartItemId) => {
    try {
      const response = await apiClient.delete(`/api/Cart/${cartItemId}`);
      updateCartCount(-1);
      return response.data;
    } catch (error) {
      console.error('Ошибка удаления товара из корзины:', error);
      throw error;
    }
  },
 
  clearCart: async () => {
    try {
      const response = await apiClient.delete('/api/Cart');
      updateCartCount(0, 0);
      return response.data;
    } catch (error) {
      console.error('Ошибка очистки корзины:', error);
      throw error;
    }
  }
};

// Методы API для списка желаемого
const WishlistService = {
  getWishlistItems: async () => {
    try {
      const response = await apiClient.get('/api/Wishlist');
      updateWishlistCount(0, response.data.length);
      return response.data;
    } catch (error) {
      console.error('Ошибка получения списка желаемого:', error);
      throw error;
    }
  },
 
  addToWishlist: async (productId) => {
    try {
      const response = await apiClient.post('/api/Wishlist', { productId });
      updateWishlistCount(1);
      return response.data;
    } catch (error) {
      console.error('Ошибка добавления в список желаемого:', error);
      throw error;
    }
  },
 
  removeWishlistItem: async (wishlistItemId) => {
    try {
      const response = await apiClient.delete(`/api/Wishlist/${wishlistItemId}`);
      updateWishlistCount(-1);
      return response.data;
    } catch (error) {
      console.error('Ошибка удаления из списка желаемого:', error);
      throw error;
    }
  },
 
  moveToCart: async (wishlistItemId) => {
    try {
      const response = await apiClient.post(`/api/Wishlist/MoveToCart/${wishlistItemId}`);
      updateWishlistCount(-1);
      updateCartCount(1);
      return response.data;
    } catch (error) {
      console.error('Ошибка перемещения в корзину:', error);
      throw error;
    }
  },
 
  clearWishlist: async () => {
    try {
      const response = await apiClient.delete('/api/Wishlist');
      updateWishlistCount(0, 0);
      return response.data;
    } catch (error) {
      console.error('Ошибка очистки списка желаемого:', error);
      throw error;
    }
  }
};

// Методы API для товаров
const ProductService = {
  getProducts: async () => {
    try {
      const response = await apiClient.get('/api/Product');
      return response.data;
    } catch (error) {
      console.error('Ошибка получения товаров:', error);
      throw error;
    }
  },
 
  getProduct: async (productId) => {
    try {
      const response = await apiClient.get(`/api/Product/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Ошибка получения информации о товаре:', error);
      throw error;
    }
  },

  createProduct: async (productData) => {
    try {
      const response = await apiClient.post('/api/Product', productData);
      return response.data;
    } catch (error) {
      console.error('Ошибка создания товара:', error);
      throw error;
    }
  },

  updateProduct: async (productId, productData) => {
    try {
      const response = await apiClient.put(`/api/Product/${productId}`, productData);
      return response.data;
    } catch (error) {
      console.error('Ошибка обновления товара:', error);
      throw error;
    }
  },

  deleteProduct: async (productId) => {
    try {
      const response = await apiClient.delete(`/api/Product/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Ошибка удаления товара:', error);
      throw error;
    }
  }
};

// Сервис для работы с профилем пользователя
const UserService = {
  getUserProfile: async (userId) => {
    try {
      const response = await apiClient.get(`/api/User/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Ошибка получения профиля пользователя:', error);
      throw error;
    }
  },
  
  updateUserProfile: async (userId, userData) => {
    try {
      const response = await apiClient.put(`/api/User/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Ошибка обновления профиля пользователя:', error);
      throw error;
    }
  },
  
  updateAvatar: async (userId, imageUrl) => {
    try {
      const response = await apiClient.put(`/api/User/${userId}/avatar`, {
        profileImageUrl: imageUrl
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка обновления аватара:', error);
      throw error;
    }
  },
  
  // Методы для бизнес-аккаунта
  createBusinessAccount: async (userId, businessData) => {
    try {
      const response = await apiClient.post(`/api/User/${userId}/business`, businessData);
      return response.data;
    } catch (error) {
      console.error('Ошибка создания бизнес аккаунта:', error);
      throw error;
    }
  },
  
  getBusinessProducts: async (userId) => {
    try {
      const response = await apiClient.get(`/api/User/${userId}/products`);
      return response.data;
    } catch (error) {
      console.error('Ошибка получения товаров бизнес аккаунта:', error);
      throw error;
    }
  },
  
  updateBusinessProfile: async (userId, businessData) => {
    try {
      const response = await apiClient.put(`/api/User/${userId}/business`, businessData);
      return response.data;
    } catch (error) {
      console.error('Ошибка обновления бизнес профиля:', error);
      throw error;
    }
  }
};

// Сервис для загрузки изображений
const CloudinaryService = {
  uploadImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post('/api/Cloudinary/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error);
      throw error;
    }
  }
};

// Сервисы для авторизации
const AuthService = {
  login: async (username, password) => {
    try {
      const response = await apiClient.post('/api/Authentication/login', {
        username,
        password
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка входа:', error);
      throw error;
    }
  },
  
  register: async (userData) => {
    try {
      const response = await apiClient.post('/api/Authentication/register', userData);
      return response.data;
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      throw error;
    }
  },
  
  googleLogin: () => {
    window.location.href = `${API_URL}/api/GoogleAuth/login`;
  }
};

// Сервис платежей
const PaymentService = {
  getAvailableCurrencies: async () => {
    try {
      const response = await apiClient.get('/api/Payment/currencies');
      return response.data;
    } catch (error) {
      console.error('Ошибка получения валют:', error);
      throw error;
    }
  },
  
  createPayment: async (currency) => {
    try {
      const response = await apiClient.post('/api/Payment/create', { currency });
      return response.data;
    } catch (error) {
      console.error('Ошибка создания платежа:', error);
      throw error;
    }
  },
  
  checkOrderStatus: async (orderId) => {
    try {
      const response = await apiClient.get(`/api/Payment/check/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Ошибка проверки статуса заказа:', error);
      throw error;
    }
  },
  
  getUserOrders: async () => {
    try {
      const response = await apiClient.get('/api/Payment/orders');
      return response.data;
    } catch (error) {
      console.error('Ошибка получения заказов пользователя:', error);
      throw error;
    }
  }
};

// Функция для проверки API соединения
const testApiConnection = async () => {
  try {
    const response = await apiClient.get('/api/Product');
    console.log('API соединение работает:', response.status);
    return true;
  } catch (error) {
    console.error('Тест API соединения не удался:', error);
    return false;
  }
};

// Утилиты для работы с токеном
const TokenUtils = {
  isTokenValid: () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      return Date.now() < exp;
    } catch (error) {
      return false;
    }
  },
  
  getUserIdFromToken: () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.sub;
    } catch (error) {
      return null;
    }
  },
  
  getRoleFromToken: () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    } catch (error) {
      return null;
    }
  }
};

// Экспортируем все сервисы
export {
  CartService,
  WishlistService,
  ProductService,
  UserService,
  CloudinaryService,
  AuthService,
  PaymentService,
  TokenUtils,
  apiClient,
  testApiConnection,
  updateCartCount,
  updateWishlistCount
};