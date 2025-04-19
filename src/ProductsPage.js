import React, { useEffect, useState } from 'react';
import { ProductService, CartService, WishlistService } from './ApiService'; // Обновите путь, если нужно
import { useNavigate } from 'react-router-dom';
import './ProductsPage.css'; // Убедитесь, что у вас есть этот файл стилей

const ProductsPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState({});
  const [addingToWishlist, setAddingToWishlist] = useState({});
  const [statusMessage, setStatusMessage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  
  // Создаем события, если они не существуют
  if (!window.cartUpdateEvent) {
    window.cartUpdateEvent = new Event('cartUpdate');
  }
  if (!window.wishlistUpdateEvent) {
    window.wishlistUpdateEvent = new Event('wishlistUpdate');
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Используем ProductService для получения товаров
      const data = await ProductService.getProducts();
      setProducts(data);
      
      // Извлекаем уникальные категории
      const uniqueCategories = [...new Set(data.map(product => product.category))];
      setCategories(uniqueCategories);
      
      setError(null);
    } catch (error) {
      console.error('Ошибка при получении товаров:', error);
      setError('Ошибка при загрузке товаров. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (e, productId) => {
    e.stopPropagation(); // Предотвращаем навигацию при клике на кнопку корзины
    
    try {
      // Проверяем наличие токена аутентификации
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Устанавливаем состояние загрузки для этого товара
      setAddingToCart(prev => ({ ...prev, [productId]: true }));
      
      // Вызываем API сервис
      console.log(`Добавляем товар ${productId} в корзину...`);
      await CartService.addToCart(productId, 1);
      
      // Показываем сообщение об успехе
      setStatusMessage({ type: 'success', text: 'Товар добавлен в корзину' });
      
      // Автоматически скрываем сообщение через 3 секунды
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error('Ошибка при добавлении в корзину:', error);
      
      // Показываем информативное сообщение об ошибке
      if (error.response && error.response.status === 401) {
        setStatusMessage({ type: 'error', text: 'Необходимо авторизоваться для добавления товаров в корзину' });
      } else {
        setStatusMessage({ type: 'error', text: 'Ошибка при добавлении товара в корзину. Пожалуйста, попробуйте еще раз.' });
      }
      
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      // Сбрасываем состояние загрузки
      setAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };

  const toggleFavorite = async (e, productId) => {
    e.stopPropagation(); // Предотвращаем навигацию при клике на кнопку избранного
    
    try {
      // Проверяем наличие токена аутентификации
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Устанавливаем состояние загрузки для этого товара
      setAddingToWishlist(prev => ({ ...prev, [productId]: true }));
      
      // Вызываем API сервис
      console.log(`Добавляем товар ${productId} в список желаемого...`);
      await WishlistService.addToWishlist(productId);
      
      // Показываем сообщение об успехе
      setStatusMessage({ type: 'success', text: 'Товар добавлен в список желаемого' });
      
      // Автоматически скрываем сообщение через 3 секунды
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error('Ошибка при добавлении в список желаемого:', error);
      
      // Обрабатываем сообщение "уже в списке"
      if (error.response && error.response.data && error.response.data.message && 
          error.response.data.message.includes('уже в списке')) {
        setStatusMessage({ type: 'info', text: 'Товар уже в списке желаемого' });
      } else if (error.response && error.response.status === 401) {
        setStatusMessage({ type: 'error', text: 'Необходимо авторизоваться для добавления товаров в список желаемого' });
      } else {
        setStatusMessage({ type: 'error', text: 'Ошибка при добавлении товара в список желаемого. Пожалуйста, попробуйте еще раз.' });
      }
      
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      // Сбрасываем состояние загрузки
      setAddingToWishlist(prev => ({ ...prev, [productId]: false }));
    }
  };

  const navigateToProductDetail = (productId) => {
    navigate(`/product/${productId}`);
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };
  
  // Фильтруем товары по выбранной категории
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  if (loading) {
    return (
      <div className="marketplace-loading">
        <div className="marketplace-spinner"></div>
        <p>Загрузка товаров...</p>
      </div>
    );
  }

  if (error && !products.length) {
    return (
      <div className="marketplace-error">
        <h2>Ошибка загрузки</h2>
        <p>{error}</p>
        <button onClick={fetchProducts} className="retry-button">Попробовать снова</button>
      </div>
    );
  }

  return (
    <div className="marketplace-container">
      <h2 className="marketplace-heading">Популярные товары</h2>
      
      {/* Кнопка переключения сайдбара для мобильных устройств */}
      <button className="mobile-filter-toggle" onClick={toggleSidebar}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {sidebarVisible ? 'Скрыть фильтры' : 'Показать фильтры'}
      </button>
      
      {/* Уведомление об успехе/ошибке */}
      {statusMessage && (
        <div className={`marketplace-notification ${statusMessage.type}`}>
          {statusMessage.text}
        </div>
      )}
      
      <div className="marketplace-layout">
        {/* Левый сайдбар с категориями */}
        <div className={`marketplace-sidebar ${sidebarVisible ? 'visible' : ''}`}>
          <div className="marketplace-categories">
            <h3 className="marketplace-categories-title">Категории</h3>
            <div className="category-list">
              <button 
                className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                <span className="icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 13H10C10.55 13 11 12.55 11 12V4C11 3.45 10.55 3 10 3H4C3.45 3 3 3.45 3 4V12C3 12.55 3.45 13 4 13ZM4 21H10C10.55 21 11 20.55 11 20V16C11 15.45 10.55 15 10 15H4C3.45 15 3 15.45 3 16V20C3 20.55 3.45 21 4 21ZM14 21H20C20.55 21 21 20.55 21 20V12C21 11.45 20.55 11 20 11H14C13.45 11 13 11.45 13 12V20C13 20.55 13.45 21 14 21ZM13 4V8C13 8.55 13.45 9 14 9H20C20.55 9 21 8.55 21 8V4C21 3.45 20.55 3 20 3H14C13.45 3 13 3.45 13 4Z" fill="currentColor"/>
                  </svg>
                </span>
                Все категории
              </button>
              {categories.map(category => (
                <button 
                  key={category} 
                  className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  <span className="icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L6.5 11H17.5L12 2Z" fill="currentColor"/>
                      <path d="M17.5 22C19.9853 22 22 19.9853 22 17.5C22 15.0147 19.9853 13 17.5 13C15.0147 13 13 15.0147 13 17.5C13 19.9853 15.0147 22 17.5 22Z" fill="currentColor"/>
                      <path d="M3 13.5H11V21.5H3V13.5Z" fill="currentColor"/>
                    </svg>
                  </span>
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Основная область контента */}
        <div className="marketplace-content">
          <div className="product-count">
            Найдено товаров: {filteredProducts.length}
          </div>
          
          <div className="marketplace-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  className="marketplace-card"
                  onClick={() => navigateToProductDetail(product.id)}
                >
                  {/* Бейдж скидки - показывается при наличии скидки */}
                  {product.originalPrice && (
                    <div className="marketplace-discount-badge">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                    </div>
                  )}
                  
                  {/* Кнопка Избранное */}
                  <button 
                    className={`marketplace-favorite-btn ${addingToWishlist[product.id] ? 'loading' : ''}`}
                    onClick={(e) => toggleFavorite(e, product.id)}
                    disabled={addingToWishlist[product.id]}
                    aria-label="Добавить в избранное"
                  >
                    {addingToWishlist[product.id] ? (
                      <span className="btn-spinner"></span>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                          stroke="currentColor" strokeWidth="2" fill="none" />
                      </svg>
                    )}
                  </button>
                  
                  {/* Кнопка сравнения */}
                  <button 
                    className="marketplace-compare-btn"
                    onClick={(e) => e.stopPropagation()} 
                    aria-label="Сравнить"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 16L10 12L6 8M14 8L18 12L14 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  <div className="marketplace-image-container">
                    <img 
                      src={product.imageUrl || 'https://via.placeholder.com/300x300'} 
                      alt={product.name}
                      className="marketplace-product-image"
                    />
                  </div>

                  <div className="marketplace-product-info">
                    <div className="marketplace-price-container">
                      <span className="marketplace-current-price">{product.price} $</span>
                      {product.originalPrice && (
                        <span className="marketplace-original-price">{product.originalPrice} $</span>
                      )}
                    </div>

                    <h3 className="marketplace-product-title">{product.name}</h3>
                    <p className="marketplace-product-category">{product.category}</p>

                    <button 
                      className={`marketplace-add-to-cart ${addingToCart[product.id] ? 'loading' : ''}`}
                      onClick={(e) => addToCart(e, product.id)}
                      disabled={addingToCart[product.id]}
                      aria-label="Добавить в корзину"
                    >
                      {addingToCart[product.id] ? (
                        <span className="btn-spinner"></span>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 3H5L5.4 5M5.4 5H21L17 13H7M5.4 5L7 13M7 13L5.8 16H17M10 20C10 20.5523 9.55228 21 9 21C8.44772 21 8 20.5523 8 20C8 19.4477 8.44772 19 9 19C9.55228 19 10 19.4477 10 20ZM16 20C16 20.5523 15.5523 21 15 21C14.4477 21 14 20.5523 14 20C14 19.4477 14.4477 19 15 19C15.5523 19 16 19.4477 16 20Z" 
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="marketplace-empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H21C22.1046 19 23 18.1046 23 17V7C23 5.89543 22.1046 5 21 5Z" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 7L12 13L21 7" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p>Товары в категории "{selectedCategory === 'all' ? 'Все категории' : selectedCategory}" пока отсутствуют</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;