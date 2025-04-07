import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CartService, WishlistService } from './ApiService';
import './ProductDetailPage.css';

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

  useEffect(() => {
    // Reset states when product ID changes
    setLoading(true);
    setImageLoaded(false);
    setQuantity(1);
    setStatusMessage(null);
    
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
      
      // Update cart count in localStorage
      const currentCount = parseInt(localStorage.getItem('cartCount') || '0');
      localStorage.setItem('cartCount', currentCount + quantity);
      window.dispatchEvent(new Event('storage'));
      
      setStatusMessage({ type: 'success', text: 'Товар добавлен в корзину' });
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
      
      // Update wishlist count in localStorage
      const currentCount = parseInt(localStorage.getItem('wishlistCount') || '0');
      localStorage.setItem('wishlistCount', currentCount + 1);
      window.dispatchEvent(new Event('storage'));
      
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

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="product-detail-loading">
        <div className="product-detail-spinner"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-error">
        <h2>Товар не найден</h2>
        <button className="product-detail-back-btn" onClick={handleGoBack}>
          Вернуться назад
        </button>
      </div>
    );
  }

  return (
    <div className="product-detail-container">
      {/* Status notification */}
      {statusMessage && (
        <div className={`product-detail-notification ${statusMessage.type}`}>
          {statusMessage.text}
        </div>
      )}

      {/* Back button */}
      <button className="product-detail-back-btn" onClick={handleGoBack}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Назад
      </button>

      <div className="product-detail-content">
        {/* Left side - Product Image */}
        <div className="product-detail-image-section">
          <div className={`product-detail-image-container ${imageLoaded ? 'loaded' : ''}`}>
            {!imageLoaded && <div className="product-detail-image-spinner"></div>}
            <img 
              src={product.imageUrl || 'https://via.placeholder.com/600x600'} 
              alt={product.name}
              className="product-detail-image"
              onLoad={handleImageLoad}
            />
            
            {product.originalPrice && (
              <div className="product-detail-discount-badge">
                {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
              </div>
            )}
          </div>
        </div>

        {/* Right side - Product Info */}
        <div className="product-detail-info-section">
          <div className="product-detail-category">{product.category}</div>
          
          <h1 className="product-detail-title">{product.name}</h1>
          
          <div className="product-detail-price-container">
            <span className="product-detail-current-price">${product.price}</span>
            {product.originalPrice && (
              <span className="product-detail-original-price">${product.originalPrice}</span>
            )}
          </div>
          
          <div className="product-detail-description">
            <h3>Описание:</h3>
            <p>{product.description || 'Описание отсутствует'}</p>
          </div>
          
          <div className="product-detail-actions">
            <div className="product-detail-quantity">
              <button 
                className="product-detail-quantity-btn"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
              >
                -
              </button>
              <input 
                type="number" 
                min="1" 
                value={quantity} 
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                className="product-detail-quantity-input"
              />
              <button 
                className="product-detail-quantity-btn"
                onClick={() => handleQuantityChange(quantity + 1)}
              >
                +
              </button>
            </div>
            
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                      stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                  В избранное
                </>
              )}
            </button>
          </div>
          
          {/* Product specifications */}
          <div className="product-detail-specs">
            <h3>Характеристики:</h3>
            <ul>
              <li><span>Категория:</span> {product.category}</li>
              <li><span>Артикул:</span> {product.id}</li>
              {/* You can add more specifications here */}
            </ul>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="product-detail-related">
          <h2>Похожие товары</h2>
          <div className="product-detail-related-grid">
            {relatedProducts.map(relatedProduct => (
              <div 
                key={relatedProduct.id} 
                className="product-detail-related-card"
                onClick={() => navigate(`/product/${relatedProduct.id}`)}
              >
                <div className="product-detail-related-image-container">
                  <img 
                    src={relatedProduct.imageUrl || 'https://via.placeholder.com/300x300'} 
                    alt={relatedProduct.name}
                    className="product-detail-related-image"
                  />
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
  );
};

export default ProductDetailPage;