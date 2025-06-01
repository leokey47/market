import React, { useEffect, useState } from 'react';
import { ProductService, CartService, WishlistService } from './ApiService';
import { useNavigate } from 'react-router-dom';
import { useCompare } from './CompareContext';
import './ProductsPage.css';

const ProductsPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState({});
  const [addingToWishlist, setAddingToWishlist] = useState({});
  const [addingToCompare, setAddingToCompare] = useState({});
  const [statusMessage, setStatusMessage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState('grid');
  
  // Используем контекст сравнения
  const { addToCompare, compareItems, error: compareError } = useCompare();
  
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

  // Отслеживаем ошибки из контекста сравнения
  useEffect(() => {
    if (compareError) {
      setStatusMessage({ type: 'error', text: compareError });
      setTimeout(() => setStatusMessage(null), 4000);
    }
  }, [compareError]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
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
    e.stopPropagation();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      setAddingToCart(prev => ({ ...prev, [productId]: true }));
      
      await CartService.addToCart(productId, 1);
      
      setStatusMessage({ type: 'success', text: 'Товар добавлен в корзину' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (error) {
      console.error('Ошибка при добавлении в корзину:', error);
      
      if (error.response && error.response.status === 401) {
        setStatusMessage({ type: 'error', text: 'Необходимо авторизоваться для добавления товаров в корзину' });
      } else {
        setStatusMessage({ type: 'error', text: 'Ошибка при добавлении товара в корзину' });
      }
      
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };

  const toggleFavorite = async (e, productId) => {
    e.stopPropagation();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      setAddingToWishlist(prev => ({ ...prev, [productId]: true }));
      
      await WishlistService.addToWishlist(productId);
      
      setStatusMessage({ type: 'success', text: 'Товар добавлен в избранное' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (error) {
      console.error('Ошибка при добавлении в список желаемого:', error);
      
      if (error.response && error.response.data && error.response.data.message && 
          error.response.data.message.includes('уже в списке')) {
        setStatusMessage({ type: 'info', text: 'Товар уже в избранном' });
      } else if (error.response && error.response.status === 401) {
        setStatusMessage({ type: 'error', text: 'Необходимо авторизоваться' });
      } else {
        setStatusMessage({ type: 'error', text: 'Ошибка при добавлении в избранное' });
      }
      
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setAddingToWishlist(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleAddToCompare = async (e, productId) => {
    e.stopPropagation();
    
    try {
      if (compareItems.some(item => item.id === productId)) {
        setStatusMessage({ type: 'info', text: 'Товар уже добавлен в сравнение' });
        setTimeout(() => setStatusMessage(null), 4000);
        return;
      }
      
      setAddingToCompare(prev => ({ ...prev, [productId]: true }));
      
      const result = await addToCompare(productId);
      
      if (result) {
        setStatusMessage({ type: 'success', text: 'Товар добавлен в сравнение' });
      }
      
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (error) {
      console.error('Ошибка при добавлении в сравнение:', error);
      setStatusMessage({ type: 'error', text: 'Ошибка при добавлении в сравнение' });
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setAddingToCompare(prev => ({ ...prev, [productId]: false }));
    }
  };

  const navigateToProductDetail = (productId) => {
    navigate(`/product/${productId}`);
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };
  
  const isInCompare = (productId) => {
    return compareItems.some(item => item.id === productId);
  };

  // Функция сортировки
  const sortProducts = (products) => {
    const sorted = [...products];
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-high':
        return sorted.sort((a, b) => b.price - a.price);
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'newest':
        return sorted.sort((a, b) => b.id - a.id);
      default:
        return sorted;
    }
  };
  
  // Фильтруем и сортируем товары
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.category === selectedCategory);
  
  const sortedProducts = sortProducts(filteredProducts);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Загружаем коллекцию...</p>
      </div>
    );
  }

  if (error && !products.length) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠</div>
        <h2 className="error-title">Что-то пошло не так</h2>
        <p className="error-text">{error}</p>
        <button onClick={fetchProducts} className="retry-btn">Попробовать снова</button>
      </div>
    );
  }

  return (
    <div className="products-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Marketplace OG</h1>
          <p className="hero-subtitle">Эксклюзивные товары от ведущих дизайнеров мира</p>
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
        {/* Toolbar */}
        <div className="toolbar">
          <div className="toolbar__left">
            <button 
              className="filter-toggle"
              onClick={toggleSidebar}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 7H21M3 12H15M3 17H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Фильтры
            </button>
            
            <div className="results-count">
              <span>{sortedProducts.length} товаров</span>
            </div>
          </div>

          <div className="toolbar__right">
            <div className="sort-select">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-dropdown"
              >
                <option value="featured">Рекомендуемые</option>
                <option value="newest">Новинки</option>
                <option value="price-low">Цена: по возрастанию</option>
                <option value="price-high">Цена: по убыванию</option>
                <option value="name">По алфавиту</option>
              </select>
            </div>

            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="8" height="8" stroke="currentColor" strokeWidth="2"/>
                  <rect x="13" y="3" width="8" height="8" stroke="currentColor" strokeWidth="2"/>
                  <rect x="3" y="13" width="8" height="8" stroke="currentColor" strokeWidth="2"/>
                  <rect x="13" y="13" width="8" height="8" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="main-content">
          {/* Sidebar */}
          <aside className={`sidebar ${sidebarVisible ? 'sidebar--open' : ''}`}>
            <div className="sidebar__header">
              <h3 className="sidebar__title">Категории</h3>
              <button 
                className="sidebar__close"
                onClick={() => setSidebarVisible(false)}
              >
                ×
              </button>
            </div>
            
            <div className="categories">
              <button 
                className={`category-item ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                <span className="category-item__text">Все товары</span>
                <span className="category-item__count">{products.length}</span>
              </button>
              
              {categories.map(category => {
                const count = products.filter(p => p.category === category).length;
                return (
                  <button 
                    key={category} 
                    className={`category-item ${selectedCategory === category ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    <span className="category-item__text">{category}</span>
                    <span className="category-item__count">{count}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Products Grid */}
          <main className="products-section">
            {sortedProducts.length > 0 ? (
              <div className={`products-grid ${viewMode === 'list' ? 'products-grid--list' : ''}`}>
                {sortedProducts.map(product => (
                  <article 
                    key={product.id} 
                    className="product-card"
                    onClick={() => navigateToProductDetail(product.id)}
                  >
                    {/* Product Image */}
                    <div className="product-card__image-container">
                      <img 
                        src={product.imageUrl || 'https://via.placeholder.com/400x400'} 
                        alt={product.name}
                        className="product-card__image"
                      />
                      
                      {/* Action Buttons */}
                      <div className="product-card__actions">
                        <button 
                          className={`action-btn action-btn--wishlist ${addingToWishlist[product.id] ? 'loading' : ''}`}
                          onClick={(e) => toggleFavorite(e, product.id)}
                          disabled={addingToWishlist[product.id]}
                          title="Добавить в избранное"
                        >
                          {addingToWishlist[product.id] ? (
                            <div className="spinner"></div>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                                stroke="currentColor" strokeWidth="2" fill="none" />
                            </svg>
                          )}
                        </button>
                        
                        <button 
                          className={`action-btn action-btn--compare ${isInCompare(product.id) ? 'active' : ''} ${addingToCompare[product.id] ? 'loading' : ''}`}
                          onClick={(e) => handleAddToCompare(e, product.id)} 
                          disabled={addingToCompare[product.id]}
                          title="Добавить к сравнению"
                        >
                          {addingToCompare[product.id] ? (
                            <div className="spinner"></div>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                              <path d="M9 3L5 7L9 11M15 13L19 17L15 21M5 7H19M19 17H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      </div>

                      {/* Add to Cart Button */}
                      <button 
                        className={`product-card__cart-btn ${addingToCart[product.id] ? 'loading' : ''}`}
                        onClick={(e) => addToCart(e, product.id)}
                        disabled={addingToCart[product.id]}
                      >
                        {addingToCart[product.id] ? (
                          <div className="spinner"></div>
                        ) : (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                              <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V19C17 20.1 16.1 21 15 21H9C7.9 21 7 20.1 7 19V13" 
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>В корзину</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Product Info */}
                    <div className="product-card__info">
                      <div className="product-card__category">{product.category}</div>
                      <h3 className="product-card__title">{product.name}</h3>
                      <div className="product-card__price">
                        <span className="price price--current">${product.price}</span>
                        {product.originalPrice && (
                          <span className="price price--original">${product.originalPrice}</span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state__icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <path d="M20 7L9 18L4 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="empty-state__title">Товары не найдены</h3>
                <p className="empty-state__text">
                  Попробуйте изменить фильтры или посмотреть другие категории
                </p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarVisible && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarVisible(false)}
        />
      )}
    </div>
  );
};

export default ProductsPage;