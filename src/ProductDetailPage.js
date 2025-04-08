import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CartService, WishlistService } from './ApiService';
import './ProductDetailPage.css';
// Import the custom events (adjust path as needed)
import { cartUpdateEvent, wishlistUpdateEvent } from './CustomNavbar';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [statusMessage, setStatusMessage] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('description');
  const [imageZoomed, setImageZoomed] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [animateElements, setAnimateElements] = useState(false);
  
  // Refs for animation targets
  const headerRef = useRef(null);
  const imageRef = useRef(null);
  const infoRef = useRef(null);
  const actionsRef = useRef(null);
  const relatedRef = useRef(null);

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

  // Animation timing
  useEffect(() => {
    // Trigger animations after a short delay
    const timer = setTimeout(() => {
      setAnimateElements(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Scroll event listener for header animation
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setHasScrolled(true);
      } else {
        setHasScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Reset states when product ID changes
    setLoading(true);
    setImageLoaded(false);
    setQuantity(1);
    setStatusMessage(null);
    setActiveTab('description');
    
    // Fetch product details
    axios.get(`https://localhost:7209/api/Product/${id}`)
      .then(response => {
        setProduct(response.data);
        // After getting product, fetch related products by category
        return axios.get('https://localhost:7209/api/Product');
      })
      .then(response => {
        if (product) {
          // Filter products by the same category, excluding current product
          const filtered = response.data
            .filter(p => p.category === product.category && p.id !== product.id)
            .slice(0, 4); // Limit to 4 related products
          setRelatedProducts(filtered);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching product:', error);
        setLoading(false);
        setStatusMessage({ type: 'error', text: 'Ошибка при загрузке товара' });
      });
  }, [id, product?.category]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleQuantityChange = (value) => {
    // Add a subtle animation when quantity changes
    const qtyInput = document.querySelector('.product-detail-quantity-input');
    if (qtyInput) {
      qtyInput.classList.add('pulse-animation');
      setTimeout(() => qtyInput.classList.remove('pulse-animation'), 500);
    }
    
    const newQuantity = Math.max(1, value); // Ensure quantity is at least 1
    setQuantity(newQuantity);
  };

  const addToCart = async () => {
    try {
      // Check for token
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      setAddingToCart(true);
      
      // Call the API
      await CartService.addToCart(product.id, quantity);
      
      // Update cart count using our helper function
      updateCartCount(quantity);
      
      // Animated toast notification
      setStatusMessage({ type: 'success', text: 'Товар добавлен в корзину' });
      
      // Create a flying cart animation
      createFlyingElement('cart');
      
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setStatusMessage({ type: 'error', text: 'Ошибка при добавлении в корзину' });
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setAddingToCart(false);
    }
  };

  const addToWishlist = async () => {
    try {
      // Check for token
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      setAddingToWishlist(true);
      
      // Call the API
      await WishlistService.addToWishlist(product.id);
      
      // Update wishlist count using our helper function
      updateWishlistCount(1);
      
      // Create a flying heart animation
      createFlyingElement('heart');
      
      setStatusMessage({ type: 'success', text: 'Товар добавлен в список желаемого' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      
      if (error.response?.data?.message?.includes('уже в списке')) {
        setStatusMessage({ type: 'info', text: 'Товар уже в списке желаемого' });
      } else {
        setStatusMessage({ type: 'error', text: 'Ошибка при добавлении в список желаемого' });
      }
      
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setAddingToWishlist(false);
    }
  };

  // Function to create flying element animation
  const createFlyingElement = (type) => {
    // Only proceed if we have the image container
    const imageContainer = document.querySelector('.product-detail-image-container');
    const targetElement = type === 'cart' 
      ? document.querySelector('.product-detail-cart-btn')
      : document.querySelector('.product-detail-wishlist-btn');
    
    if (!imageContainer || !targetElement) return;
    
    // Create flying element
    const flyingEl = document.createElement('div');
    flyingEl.className = `flying-element ${type}`;
    
    if (type === 'cart') {
      flyingEl.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3H5L5.4 5M5.4 5H21L17 13H7M5.4 5L7 13M7 13L5.8 16H17M10 20C10 20.5523 9.55228 21 9 21C8.44772 21 8 20.5523 8 20C8 19.4477 8.44772 19 9 19C9.55228 19 10 19.4477 10 20ZM16 20C16 20.5523 15.5523 21 15 21C14.4477 21 14 20.5523 14 20C14 19.4477 14.4477 19 15 19C15.5523 19 16 19.4477 16 20Z" 
            stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      `;
    } else {
      flyingEl.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
            stroke="#ff5252" strokeWidth="2" fill="#ff5252" />
        </svg>
      `;
    }
    
    // Get positions
    const startRect = imageContainer.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    
    // Position the flying element at the start position
    flyingEl.style.top = `${startRect.top + startRect.height/2}px`;
    flyingEl.style.left = `${startRect.left + startRect.width/2}px`;
    
    // Add to document
    document.body.appendChild(flyingEl);
    
    // Trigger animation
    setTimeout(() => {
      flyingEl.style.top = `${targetRect.top + targetRect.height/2}px`;
      flyingEl.style.left = `${targetRect.left + targetRect.width/2}px`;
      flyingEl.style.opacity = '0';
      flyingEl.style.transform = 'scale(0.5)';
    }, 10);
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(flyingEl);
    }, 1000);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleImageClick = () => {
    setShowImageModal(true);
  };

  const handleZoomToggle = (e) => {
    e.stopPropagation();
    setImageZoomed(!imageZoomed);
  };

  if (loading) {
    return (
      <div className="product-detail-loading">
        <svg className="product-detail-loading-icon" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" stroke="#eee" strokeWidth="8" fill="none" />
          <circle className="product-detail-loading-circle" cx="50" cy="50" r="40" stroke="#3498db" strokeWidth="8" fill="none" />
        </svg>
        <p className="product-detail-loading-text">Загрузка товара...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-error">
        <svg className="product-detail-error-icon" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="#f8d7da" />
          <path d="M12 8v5M12 16v.01" stroke="#721c24" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <h2>Товар не найден</h2>
        <p>К сожалению, запрашиваемый товар не существует или был удален.</p>
        <button className="product-detail-back-btn" onClick={handleGoBack}>
          Вернуться назад
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={`product-detail-container ${animateElements ? 'animate' : ''}`}>
        {/* Floating header that appears on scroll */}
        <div className={`product-detail-floating-header ${hasScrolled ? 'visible' : ''}`} ref={headerRef}>
          <div className="product-detail-floating-content">
            <div className="product-detail-floating-image">
              <img src={product.imageUrl || 'https://via.placeholder.com/80x80'} alt={product.name} />
            </div>
            <div className="product-detail-floating-info">
              <h3>{product.name}</h3>
              <p>${product.price}</p>
            </div>
            <button 
              className="product-detail-floating-cart-btn"
              onClick={addToCart}
              disabled={addingToCart}
            >
              {addingToCart ? 'Добавление...' : 'В корзину'}
            </button>
          </div>
        </div>

        {/* Status notification with improved animation */}
        {statusMessage && (
          <div className={`product-detail-notification ${statusMessage.type}`}>
            <div className="notification-icon">
              {statusMessage.type === 'success' && (
                <svg viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor" />
                </svg>
              )}
              {statusMessage.type === 'error' && (
                <svg viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="currentColor" />
                </svg>
              )}
              {statusMessage.type === 'info' && (
                <svg viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor" />
                </svg>
              )}
            </div>
            <div className="notification-content">
              {statusMessage.text}
            </div>
          </div>
        )}

        {/* Back button with hover animation */}
        <button className="product-detail-back-btn" onClick={handleGoBack}>
          <svg className="back-btn-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="back-btn-text">Назад</span>
        </button>

        <div className="product-detail-content">
          {/* Left side - Product Image with zoom */}
          <div className={`product-detail-image-section ${animateElements ? 'animate-in' : ''}`} ref={imageRef}>
            <div 
              className={`product-detail-image-container ${imageLoaded ? 'loaded' : ''} ${imageZoomed ? 'zoomed' : ''}`}
              onClick={handleImageClick}
            >
              {!imageLoaded && (
                <div className="product-detail-image-skeleton">
                  <div className="skeleton-pulse"></div>
                </div>
              )}
              <img 
                src={product.imageUrl || 'https://via.placeholder.com/600x600'} 
                alt={product.name}
                className="product-detail-image"
                onLoad={handleImageLoad}
              />
              
              <button 
                className="product-detail-zoom-btn"
                onClick={handleZoomToggle}
                aria-label={imageZoomed ? "Уменьшить" : "Увеличить"}
              >
                {imageZoomed ? (
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zm-4 0H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zm-2 0v-3m0 0H9m3 3h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              
              {product.originalPrice && (
                <div className="product-detail-discount-badge">
                  {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                </div>
              )}
            </div>

            {/* Image thumbnails would go here if there were multiple images */}
            <div className="product-detail-thumbnails">
              <div className="product-detail-thumbnail active">
                <img src={product.imageUrl || 'https://via.placeholder.com/100x100'} alt={product.name} />
              </div>
              {/* Placeholder thumbnails for demonstration */}
              <div className="product-detail-thumbnail placeholder"></div>
              <div className="product-detail-thumbnail placeholder"></div>
              <div className="product-detail-thumbnail placeholder"></div>
            </div>
          </div>

          {/* Right side - Product Info with animations */}
          <div className={`product-detail-info-section ${animateElements ? 'animate-in' : ''}`} ref={infoRef}>
            <div className="product-detail-category-badge">
              <span>{product.category}</span>
            </div>
            
            <h1 className="product-detail-title">{product.name}</h1>
            
            <div className="product-detail-price-container">
              <span className="product-detail-current-price">${product.price}</span>
              {product.originalPrice && (
                <span className="product-detail-original-price">${product.originalPrice}</span>
              )}
              {product.originalPrice && (
                <span className="product-detail-savings">
                  Экономия: ${(product.originalPrice - product.price).toFixed(2)}
                </span>
              )}
            </div>

            {/* Interactive rating component */}
            <div className="product-detail-rating">
              <div className="product-detail-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg 
                    key={star} 
                    className={`star ${star <= 4 ? 'filled' : ''}`} 
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
                <span className="product-detail-rating-text">4.0 (24 отзыва)</span>
              </div>
            </div>
            
            <div className="product-detail-tabs">
              <button 
                className={`product-detail-tab ${activeTab === 'description' ? 'active' : ''}`}
                onClick={() => setActiveTab('description')}
              >
                Описание
              </button>
              <button 
                className={`product-detail-tab ${activeTab === 'specifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('specifications')}
              >
                Характеристики
              </button>
              <button 
                className={`product-detail-tab ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                Отзывы
              </button>
            </div>
            
            <div className="product-detail-tab-content">
              {/* Description Tab */}
              {activeTab === 'description' && (
                <div className="product-detail-description">
                  <p>{product.description || 'Подробное описание товара появится в ближайшее время. Следите за обновлениями!'}</p>
                </div>
              )}
              
              {/* Specifications Tab */}
              {activeTab === 'specifications' && (
                <div className="product-detail-specs">
                  <ul>
                    <li><span>Категория:</span> {product.category}</li>
                    <li><span>Артикул:</span> {product.id}</li>
                    <li><span>Цена:</span> ${product.price}</li>
                    <li><span>В наличии:</span> <span className="in-stock">Да</span></li>
                    <li><span>Гарантия:</span> 12 месяцев</li>
                  </ul>
                </div>
              )}
              
              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div className="product-detail-reviews">
                  <p className="reviews-placeholder">Отзывы загружаются...</p>
                </div>
              )}
            </div>
            
            <div className={`product-detail-actions ${animateElements ? 'animate-in' : ''}`} ref={actionsRef}>
              <div className="product-detail-availability">
                <span className="product-detail-stock-indicator available"></span>
                <span>В наличии</span>
              </div>
              
              <div className="product-detail-quantity">
                <button 
                  className="product-detail-quantity-btn minus"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path d="M19 13H5v-2h14v2z" fill="currentColor" />
                  </svg>
                </button>
                <input 
                  type="number" 
                  min="1" 
                  value={quantity} 
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  className="product-detail-quantity-input"
                />
                <button 
                  className="product-detail-quantity-btn plus"
                  onClick={() => handleQuantityChange(quantity + 1)}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor" />
                  </svg>
                </button>
              </div>
              
              <div className="product-detail-buttons">
                <button 
                  className={`product-detail-cart-btn ${addingToCart ? 'loading' : ''}`}
                  onClick={addToCart}
                  disabled={addingToCart}
                >
                  {addingToCart ? (
                    <span className="btn-spinner"></span>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 3H5L5.4 5M5.4 5H21L17 13H7M5.4 5L7 13M7 13L5.8 16H17M10 20C10 20.5523 9.55228 21 9 21C8.44772 21 8 20.5523 8 20C8 19.4477 8.44772 19 9 19C9.55228 19 10 19.4477 10 20ZM16 20C16 20.5523 15.5523 21 15 21C14.4477 21 14 20.5523 14 20C14 19.4477 14.4477 19 15 19C15.5523 19 16 19.4477 16 20Z" 
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Добавить в корзину
                    </>
                  )}
                </button>
                
                <button 
                  className={`product-detail-wishlist-btn ${addingToWishlist ? 'loading' : ''}`}
                  onClick={addToWishlist}
                  disabled={addingToWishlist}
                >
                  {addingToWishlist ? (
                    <span className="btn-spinner"></span>
                  ) : (
                    <>
                      <svg className="heart-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path className="heart-path" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                          stroke="currentColor" strokeWidth="2" fill="none" />
                      </svg>
                      В избранное
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Delivery information */}
            <div className="product-detail-delivery">
              <div className="delivery-icon">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M19.5 8.5h-2v-2h-10v-2h-4v12h1c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h1v-5l-4-4zm-14 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3.5-3h-3.14c-.27-.62-.75-1.14-1.36-1.42v-5.08h4.5v6.5zm8 3c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-3h-3v-6.5h4.5v5.08c-.61.29-1.09.8-1.36 1.42h-.14z" fill="currentColor" />
                </svg>
              </div>
              <div className="delivery-info">
                <h4>Быстрая доставка</h4>
                <p>Доставка по городу: 1-2 дня</p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section with card animations */}
        {relatedProducts.length > 0 && (
          <div className={`product-detail-related ${animateElements ? 'animate-in' : ''}`} ref={relatedRef}>
            <h2 className="related-heading">
              <span className="related-heading-line"></span>
              <span>Похожие товары</span>
              <span className="related-heading-line"></span>
            </h2>
            <div className="product-detail-related-grid">
              {relatedProducts.map((relatedProduct, index) => (
                <div 
                  key={relatedProduct.id} 
                  className="product-detail-related-card"
                  onClick={() => navigate(`/product/${relatedProduct.id}`)}
                  style={{"--i": index}}
                >
                  <div className="product-detail-related-image-container">
                    <img 
                      src={relatedProduct.imageUrl || 'https://via.placeholder.com/300x300'} 
                      alt={relatedProduct.name}
                      className="product-detail-related-image"
                    />
                    <div className="product-detail-related-overlay">
                      <button className="quick-view-btn">Быстрый просмотр</button>
                    </div>
                  </div>
                  <div className="product-detail-related-info">
                    <h4>{relatedProduct.name}</h4>
                    <p className="product-detail-related-price">${relatedProduct.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox/Modal for enlarged product image */}
      {showImageModal && (
        <div className="product-image-modal" onClick={() => setShowImageModal(false)}>
          <button className="modal-close-btn">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="modal-image-container" onClick={(e) => e.stopPropagation()}>
            <img 
              src={product.imageUrl || 'https://via.placeholder.com/800x800'} 
              alt={product.name}
              className="modal-image"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ProductDetailPage;