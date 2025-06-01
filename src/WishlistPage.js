import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './WishlistPage.css';

const WishlistPage = () => {
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [statusMessage, setStatusMessage] = useState(null);
  
  // API URL should match your ASP.NET Core backend
  const API_URL = process.env.REACT_APP_API_URL || 'https://localhost:7209';

  useEffect(() => {
    fetchWishlistItems();
  }, []);

  // Helper function to update wishlist count and dispatch event
  const updateWishlistCount = (count) => {
    localStorage.setItem('wishlistCount', count.toString());
    // Dispatch custom event if available
    if (window.wishlistUpdateEvent) {
      window.dispatchEvent(window.wishlistUpdateEvent);
    }
  };

  // Helper function to update cart count and dispatch event
  const updateCartCount = (count) => {
    const currentCount = parseInt(localStorage.getItem('cartCount') || '0');
    localStorage.setItem('cartCount', (currentCount + count).toString());
    // Dispatch custom event if available
    if (window.cartUpdateEvent) {
      window.dispatchEvent(window.cartUpdateEvent);
    }
  };

  const fetchWishlistItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Необходимо войти в систему');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/api/Wishlist`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setWishlistItems(response.data);
      setError(null);
      
      // Update wishlist count in navbar
      updateWishlistCount(response.data.length);
    } catch (err) {
      console.error('Error fetching wishlist items:', err);
      if (err.response?.status === 401) {
        navigate('/login');
        return;
      }
      setError('Ошибка при загрузке списка желаемого');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (wishlistItemId) => {
    setActionLoading(prev => ({ ...prev, [wishlistItemId]: 'remove' }));
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/Wishlist/${wishlistItemId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Remove item from local state
      const updatedItems = wishlistItems.filter(item => item.wishlistItemId !== wishlistItemId);
      setWishlistItems(updatedItems);
      
      // Update wishlist count
      updateWishlistCount(updatedItems.length);
      
      // Show success message
      setStatusMessage({ type: 'success', text: 'Товар удален из избранного' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('Error removing wishlist item:', err);
      setStatusMessage({ type: 'error', text: 'Ошибка при удалении товара' });
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setActionLoading(prev => ({ ...prev, [wishlistItemId]: null }));
    }
  };

  const handleMoveToCart = async (wishlistItemId) => {
    setActionLoading(prev => ({ ...prev, [wishlistItemId]: 'move' }));
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/Wishlist/MoveToCart/${wishlistItemId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Remove item from local state
      const updatedItems = wishlistItems.filter(item => item.wishlistItemId !== wishlistItemId);
      setWishlistItems(updatedItems);
      
      // Update counts
      updateWishlistCount(updatedItems.length);
      updateCartCount(1);
      
      // Show success message
      setStatusMessage({ type: 'success', text: 'Товар добавлен в корзину' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('Error moving item to cart:', err);
      setStatusMessage({ type: 'error', text: 'Ошибка при добавлении в корзину' });
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setActionLoading(prev => ({ ...prev, [wishlistItemId]: null }));
    }
  };

  const handleClearWishlist = async () => {
    if (!window.confirm('Вы уверены, что хотите очистить список избранного?')) return;
    
    setActionLoading(prev => ({ ...prev, clear: true }));
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/Wishlist`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Clear local state
      setWishlistItems([]);
      
      // Update wishlist count
      updateWishlistCount(0);
      
      // Show success message
      setStatusMessage({ type: 'success', text: 'Список избранного очищен' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('Error clearing wishlist:', err);
      setStatusMessage({ type: 'error', text: 'Ошибка при очистке списка' });
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setActionLoading(prev => ({ ...prev, clear: false }));
    }
  };

  const navigateToProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  if (loading) {
    return (
      <div className="wishlist-page">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Загружаем избранное...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && wishlistItems.length === 0) {
    return (
      <div className="wishlist-page">
        <div className="container">
          <div className="error-container">
            <div className="error-icon">⚠</div>
            <h2 className="error-title">Что-то пошло не так</h2>
            <p className="error-text">{error}</p>
            <button onClick={fetchWishlistItems} className="retry-btn">
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Избранное</h1>
          <p className="hero-subtitle">
            {wishlistItems.length > 0 
              ? `${wishlistItems.length} избранных товаров` 
              : 'Ваша коллекция избранных товаров'
            }
          </p>
        </div>
      </div>

      {/* Status Notification */}
      {statusMessage && (
        <div className={`notification notification--${statusMessage.type}`}>
          <div className="notification__content">
            <span className="notification__text">{statusMessage.text}</span>
            <button 
              className="notification__close"
              onClick={() => setStatusMessage(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="container">
        {wishlistItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                  stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </div>
            <h3 className="empty-state__title">Список избранного пуст</h3>
            <p className="empty-state__text">
              Добавьте товары в избранное, чтобы не потерять их
            </p>
            <button 
              className="empty-state__btn"
              onClick={() => navigate('/')}
            >
              Перейти к покупкам
            </button>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="wishlist-toolbar">
              <div className="wishlist-toolbar__left">
                <h2 className="wishlist-toolbar__title">
                  Избранные товары ({wishlistItems.length})
                </h2>
              </div>
              <div className="wishlist-toolbar__right">
                <button 
                  className="clear-btn"
                  onClick={handleClearWishlist}
                  disabled={actionLoading.clear}
                >
                  {actionLoading.clear ? (
                    <>
                      <div className="spinner"></div>
                      <span>Очищаем...</span>
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6H5H21M8 6V4C8 3.45 8.45 3 9 3H15C15.55 3 16 3.45 16 4V6M19 6V20C19 20.55 18.55 21 18 21H6C5.45 21 5 20.55 5 20V6H19Z" 
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Очистить список</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Wishlist Grid */}
            <div className="wishlist-grid">
              {wishlistItems.map(item => (
                <article 
                  key={item.wishlistItemId} 
                  className="wishlist-card"
                >
                  {/* Product Image */}
                  <div 
                    className="wishlist-card__image-container"
                    onClick={() => navigateToProduct(item.productId)}
                  >
                    <img 
                      src={item.productImageUrl || 'https://via.placeholder.com/400x400'} 
                      alt={item.productName}
                      className="wishlist-card__image"
                    />
                    
                    {/* Remove Button */}
                    <button 
                      className={`wishlist-card__remove-btn ${actionLoading[item.wishlistItemId] === 'remove' ? 'loading' : ''}`}
                      onClick={() => handleRemoveItem(item.wishlistItemId)}
                      disabled={actionLoading[item.wishlistItemId] === 'remove'}
                      title="Удалить из избранного"
                    >
                      {actionLoading[item.wishlistItemId] === 'remove' ? (
                        <div className="spinner"></div>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Product Info */}
                  <div className="wishlist-card__info">
                    <div className="wishlist-card__details">
                      <h3 
                        className="wishlist-card__title"
                        onClick={() => navigateToProduct(item.productId)}
                      >
                        {item.productName}
                      </h3>
                      
                      {item.productDescription && (
                        <p className="wishlist-card__description">
                          {item.productDescription.length > 100 
                            ? `${item.productDescription.substring(0, 100)}...`
                            : item.productDescription
                          }
                        </p>
                      )}
                      
                      <div className="wishlist-card__price">
                        <span className="price">${item.price}</span>
                      </div>
                      
                      <div className="wishlist-card__meta">
                        <span className="added-date">
                          Добавлено: {new Date(item.addedAt).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button 
                      className={`wishlist-card__cart-btn ${actionLoading[item.wishlistItemId] === 'move' ? 'loading' : ''}`}
                      onClick={() => handleMoveToCart(item.wishlistItemId)}
                      disabled={actionLoading[item.wishlistItemId] === 'move'}
                    >
                      {actionLoading[item.wishlistItemId] === 'move' ? (
                        <>
                          <div className="spinner"></div>
                          <span>Добавляем...</span>
                        </>
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V19C17 20.1 16.1 21 15 21H9C7.9 21 7 20.1 7 19V13" 
                              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>В корзину</span>
                        </>
                      )}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;