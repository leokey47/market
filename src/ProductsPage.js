import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ProductsPage.css';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const addToCart = (productId) => {
    console.log(`Product ${productId} added to cart`);
    // Add your cart functionality here
  };

  const toggleFavorite = (productId) => {
    console.log(`Toggled favorite for product ${productId}`);
    // Add your wishlist functionality here
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
      
      <div className="marketplace-grid">
        {products.map(product => (
          <div key={product.id} className="marketplace-card">
            {/* Discount badge - show if there is a discount */}
            {product.originalPrice && (
              <div className="marketplace-discount-badge">
                {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
              </div>
            )}
            
            {/* Favorite button */}
            <button 
              className="marketplace-favorite-btn" 
              onClick={() => toggleFavorite(product.id)}
              aria-label="Add to favorites"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                  stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </button>
            
            {/* Compare button */}
            <button 
              className="marketplace-compare-btn" 
              aria-label="Compare"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 16L10 12L6 8M14 8L18 12L14 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            {/* Product image */}
            <div className="marketplace-image-container">
              <img 
                src={product.imageUrl || 'https://via.placeholder.com/300x300'} 
                alt={product.name}
                className="marketplace-product-image"
              />
            </div>
            
            {/* Product info */}
            <div className="marketplace-product-info">
              {/* Price */}
              <div className="marketplace-price-container">
                <span className="marketplace-current-price">{product.price} $</span>
                {product.originalPrice && (
                  <span className="marketplace-original-price">{product.originalPrice} $</span>
                )}
              </div>
              
              {/* Title */}
              <h3 className="marketplace-product-title">{product.name}</h3>
              
              {/* Description/Category */}
              <p className="marketplace-product-category">{product.category}</p>
              
              {/* Add to cart button */}
              <button 
                className="marketplace-add-to-cart" 
                onClick={() => addToCart(product.id)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3H5L5.4 5M5.4 5H21L17 13H7M5.4 5L7 13M7 13L5.8 16H17M10 20C10 20.5523 9.55228 21 9 21C8.44772 21 8 20.5523 8 20C8 19.4477 8.44772 19 9 19C9.55228 19 10 19.4477 10 20ZM16 20C16 20.5523 15.5523 21 15 21C14.4477 21 14 20.5523 14 20C14 19.4477 14.4477 19 15 19C15.5523 19 16 19.4477 16 20Z" 
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductsPage;