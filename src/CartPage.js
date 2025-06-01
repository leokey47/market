import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CartPage.css';

const CartPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateLoading, setUpdateLoading] = useState({});
  const [totalAmount, setTotalAmount] = useState(0);
  const [statusMessage, setStatusMessage] = useState(null);
  
  const API_URL = process.env.REACT_APP_API_URL || 'https://localhost:7209';

  useEffect(() => {
    fetchCartItems();
  }, []);

  useEffect(() => {
    const total = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    setTotalAmount(total);
  }, [cartItems]);

  const updateCartCount = (count) => {
    localStorage.setItem('cartCount', count.toString());
    if (window.cartUpdateEvent) {
      window.dispatchEvent(window.cartUpdateEvent);
    }
  };

  const fetchCartItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_URL}/api/Cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setCartItems(response.data);
      setError(null);
      updateCartCount(response.data.length);
    } catch (err) {
      console.error('Error fetching cart items:', err);
      if (err.response?.status === 401) {
        navigate('/login');
        return;
      }
      setError('Ошибка при загрузке корзины');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;

    setUpdateLoading(prev => ({ ...prev, [cartItemId]: true }));
    try {
      const token = localStorage.getItem('token');
      
      await axios.put(`${API_URL}/api/Cart/${cartItemId}`, 
        { quantity: newQuantity },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setCartItems(cartItems.map(item => 
        item.cartItemId === cartItemId 
          ? { ...item, quantity: newQuantity, totalPrice: item.price * newQuantity } 
          : item
      ));

      setStatusMessage({ type: 'success', text: 'Количество обновлено' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Error updating cart item:', err);
      setStatusMessage({ type: 'error', text: 'Ошибка при обновлении количества' });
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setUpdateLoading(prev => ({ ...prev, [cartItemId]: false }));
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    setUpdateLoading(prev => ({ ...prev, [`remove_${cartItemId}`]: true }));
    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`${API_URL}/api/Cart/${cartItemId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const updatedItems = cartItems.filter(item => item.cartItemId !== cartItemId);
      setCartItems(updatedItems);
      updateCartCount(updatedItems.length);

      setStatusMessage({ type: 'success', text: 'Товар удален из корзины' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Error removing cart item:', err);
      setStatusMessage({ type: 'error', text: 'Ошибка при удалении товара' });
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setUpdateLoading(prev => ({ ...prev, [`remove_${cartItemId}`]: false }));
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Вы уверены, что хотите очистить корзину?')) return;
    
    setUpdateLoading(prev => ({ ...prev, clear: true }));
    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`${API_URL}/api/Cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setCartItems([]);
      updateCartCount(0);

      setStatusMessage({ type: 'success', text: 'Корзина очищена' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Error clearing cart:', err);
      setStatusMessage({ type: 'error', text: 'Ошибка при очистке корзины' });
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setUpdateLoading(prev => ({ ...prev, clear: false }));
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const navigateToProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  if (loading) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Загружаем корзину...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="error-container">
            <div className="error-icon">⚠</div>
            <h2 className="error-title">Что-то пошло не так</h2>
            <p className="error-text">{error}</p>
            <button onClick={fetchCartItems} className="retry-btn">
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Корзина</h1>
          <p className="hero-subtitle">
            {cartItems.length > 0 
              ? `${cartItems.length} товаров на сумму $${totalAmount.toLocaleString()}` 
              : 'Ваша корзина покупок'
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
        {cartItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V19C17 20.1 16.1 21 15 21H9C7.9 21 7 20.1 7 19V13" 
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="empty-state__title">Корзина пуста</h3>
            <p className="empty-state__text">
              Добавьте товары из каталога, чтобы оформить заказ
            </p>
            <button 
              className="empty-state__btn"
              onClick={() => navigate('/')}
            >
              Перейти к покупкам
            </button>
          </div>
        ) : (
          <div className="cart-layout">
            {/* Cart Items Section */}
            <div className="cart-items-section">
              {/* Заголовок с кнопкой очистки - теперь всегда видим */}
              <div className="cart-header">
                <h2 className="cart-header__title">
                  Товары в корзине ({cartItems.length})
                </h2>
                {/* Кнопка очистки отображается только если есть товары */}
                {cartItems.length > 0 && (
                  <button 
                    className="clear-btn"
                    onClick={handleClearCart}
                    disabled={updateLoading.clear}
                  >
                    {updateLoading.clear ? (
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
                        <span>Очистить корзину</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="cart-items">
                {cartItems.map((item, index) => (
                  <article 
                    key={item.cartItemId} 
                    className="cart-item"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Product Image */}
                    <div 
                      className="cart-item__image-container"
                      onClick={() => navigateToProduct(item.productId)}
                    >
                      <img 
                        src={item.productImageUrl || 'https://via.placeholder.com/200x200'} 
                        alt={item.productName}
                        className="cart-item__image"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="cart-item__info">
                      <h3 
                        className="cart-item__title"
                        onClick={() => navigateToProduct(item.productId)}
                      >
                        {item.productName}
                      </h3>
                      
                      {item.productDescription && (
                        <p className="cart-item__description">
                          {item.productDescription.length > 150 
                            ? `${item.productDescription.substring(0, 150)}...`
                            : item.productDescription
                          }
                        </p>
                      )}
                      
                      <div className="cart-item__price-per-unit">
                        ${item.price} за единицу
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="cart-item__quantity">
                      <label className="quantity-label">Количество</label>
                      <div className="quantity-controls">
                        <button 
                          className="quantity-btn quantity-btn--decrease"
                          onClick={() => handleQuantityChange(item.cartItemId, item.quantity - 1)}
                          disabled={item.quantity <= 1 || updateLoading[item.cartItemId]}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                        
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.cartItemId, parseInt(e.target.value) || 1)}
                          disabled={updateLoading[item.cartItemId]}
                          className="quantity-input"
                        />
                        
                        <button 
                          className="quantity-btn quantity-btn--increase"
                          onClick={() => handleQuantityChange(item.cartItemId, item.quantity + 1)}
                          disabled={updateLoading[item.cartItemId]}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                      
                      {updateLoading[item.cartItemId] && (
                        <div className="quantity-loading">
                          <div className="spinner"></div>
                        </div>
                      )}
                    </div>

                    {/* Total Price */}
                    <div className="cart-item__total">
                      <div className="total-price">${item.totalPrice.toLocaleString()}</div>
                    </div>

                    {/* Remove Button */}
                    <button 
                      className={`cart-item__remove-btn ${updateLoading[`remove_${item.cartItemId}`] ? 'loading' : ''}`}
                      onClick={() => handleRemoveItem(item.cartItemId)}
                      disabled={updateLoading[`remove_${item.cartItemId}`]}
                      title="Удалить из корзины"
                    >
                      {updateLoading[`remove_${item.cartItemId}`] ? (
                        <div className="spinner"></div>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M3 6H5H21M8 6V4C8 3.45 8.45 3 9 3H15C15.55 3 16 3.45 16 4V6M19 6V20C19 20.55 18.55 21 18 21H6C5.45 21 5 20.55 5 20V6H19Z" 
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  </article>
                ))}
              </div>
            </div>

            {/* Order Summary Section */}
            <div className="order-summary">
              <div className="summary-card">
                <h3 className="summary-card__title">Сводка заказа</h3>
                
                <div className="summary-line">
                  <span>Товары ({cartItems.length}):</span>
                  <span>${totalAmount.toLocaleString()}</span>
                </div>
                
                <div className="summary-line">
                  <span>Доставка:</span>
                  <span className="free-shipping">Бесплатно</span>
                </div>
                
                <div className="summary-line summary-line--total">
                  <span>Итого:</span>
                  <span className="total-amount">${totalAmount.toLocaleString()}</span>
                </div>
                
                <button 
                  className="checkout-btn"
                  onClick={handleCheckout}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Оформить заказ</span>
                </button>
                
                <div className="security-notice">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 22S8 18 8 13V6L12 4L16 6V13C16 18 12 22 12 22Z" 
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Безопасная оплата</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;