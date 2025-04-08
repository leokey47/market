import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CartService, WishlistService } from './ApiService'; // Импортируем сервисы API
import { useNavigate } from 'react-router-dom';
import './ProductsPage.css';
// Import the custom events
import { cartUpdateEvent, wishlistUpdateEvent } from './CustomNavbar'; // Make sure path is correct

const ProductsPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState({});
  const [addingToWishlist, setAddingToWishlist] = useState({});
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    // Fetch products from your API
    axios.get('https://localhost:7209/api/Product')
      .then(response => {
        setProducts(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching products:', error);
        setLoading(false);
      });
  }, []);

  // Helper function to update cart count and dispatch event
  const updateCartCount = (increment = 1) => {
    const currentCount = parseInt(localStorage.getItem('cartCount') || '0');
    const newCount = currentCount + increment;
    localStorage.setItem('cartCount', newCount.toString());
    // Dispatch our custom event
    window.dispatchEvent(cartUpdateEvent);
  };

  // Helper function to update wishlist count and dispatch event
  const updateWishlistCount = (increment = 1) => {
    const currentCount = parseInt(localStorage.getItem('wishlistCount') || '0');
    const newCount = currentCount + increment;
    localStorage.setItem('wishlistCount', newCount.toString());
    // Dispatch our custom event
    window.dispatchEvent(wishlistUpdateEvent);
  };

  const addToCart = async (e, productId) => {
    e.stopPropagation(); // Prevent navigation when clicking the cart button
    try {
      // Проверяем наличие токена
      const token = localStorage.getItem('token');
      if (!token) {
        // Если токена нет, перенаправляем на страницу логина
        window.location.href = '/login';
        return;
      }

      // Отмечаем, что товар добавляется в корзину
      setAddingToCart(prev => ({ ...prev, [productId]: true }));
      
      // Реальный запрос к API
      await CartService.addToCart(productId, 1);
      
      // Обновляем счетчик корзины используя нашу вспомогательную функцию
      updateCartCount(1);
      
      // Показываем сообщение об успехе
      setStatusMessage({ type: 'success', text: 'Товар добавлен в корзину' });
      
      // Скрываем сообщение через 3 секунды
      setTimeout(() => setStatusMessage(null), 3000);
      
      console.log(`Product ${productId} added to cart`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setStatusMessage({ type: 'error', text: 'Ошибка при добавлении в корзину' });
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      // Убираем индикатор загрузки
      setAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };

  const toggleFavorite = async (e, productId) => {
    e.stopPropagation(); // Prevent navigation when clicking the favorite button
    try {
      // Проверяем наличие токена
      const token = localStorage.getItem('token');
      if (!token) {
        // Если токена нет, перенаправляем на страницу логина
        window.location.href = '/login';
        return;
      }

      // Отмечаем, что товар добавляется в избранное
      setAddingToWishlist(prev => ({ ...prev, [productId]: true }));
      
      // Реальный запрос к API
      await WishlistService.addToWishlist(productId);
      
      // Обновляем счетчик избранного используя нашу вспомогательную функцию
      updateWishlistCount(1);
      
      // Показываем сообщение об успехе
      setStatusMessage({ type: 'success', text: 'Товар добавлен в список желаемого' });
      
      // Скрываем сообщение через 3 секунды
      setTimeout(() => setStatusMessage(null), 3000);
      
      console.log(`Toggled favorite for product ${productId}`);
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      
      // Проверяем, не сообщение ли это о том, что товар уже в избранном
      if (error.response?.data?.message?.includes('уже в списке')) {
        setStatusMessage({ type: 'info', text: 'Товар уже в списке желаемого' });
      } else {
        setStatusMessage({ type: 'error', text: 'Ошибка при добавлении в список желаемого' });
      }
      
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      // Убираем индикатор загрузки
      setAddingToWishlist(prev => ({ ...prev, [productId]: false }));
    }
  };

  const navigateToProductDetail = (productId) => {
    navigate(`/product/${productId}`);
  };

  if (loading) {
    return (
      <div className="marketplace-loading">
        <div className="marketplace-spinner"></div>
      </div>
    );
  }

  return (
    <div className="marketplace-container">
      <h2 className="marketplace-heading">Популярные товары</h2>
      
      {/* Уведомление об успехе/ошибке */}
      {statusMessage && (
        <div className={`marketplace-notification ${statusMessage.type}`}>
          {statusMessage.text}
        </div>
      )}
      
      <div className="marketplace-grid">
        {products.map(product => (
          <div 
            key={product.id} 
            className="marketplace-card"
            onClick={() => navigateToProductDetail(product.id)}
          >
            {/* Discount badge - show if there is a discount */}
            {product.originalPrice && (
              <div className="marketplace-discount-badge">
                {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
              </div>
            )}
            
            {/* Favorite button */}
            <button 
              className={`marketplace-favorite-btn ${addingToWishlist[product.id] ? 'loading' : ''}`}
              onClick={(e) => toggleFavorite(e, product.id)}
              disabled={addingToWishlist[product.id]}
              aria-label="Add to favorites"
            >
              {addingToWishlist[product.id] ? (
                <span className="btn-spinner"></span>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                    stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              )}
            </button>
            
            {/* Compare button */}
            <button 
              className="marketplace-compare-btn"
              onClick={(e) => e.stopPropagation()} 
              aria-label="Compare"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        ))}
      </div>
    </div>
  );
};

export default ProductsPage;