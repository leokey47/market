import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompare } from './CompareContext';
import { CartService } from './ApiService';
import './ComparePage.css';

const ComparePage = () => {
  const navigate = useNavigate();
  const { 
    compareItems, 
    compareCategory, 
    removeFromCompare, 
    clearCompare 
  } = useCompare();
  
  // Состояние для хранения всех уникальных спецификаций
  const [specificationsMap, setSpecificationsMap] = useState({});
  // Состояние для отслеживания процесса добавления в корзину
  const [addingToCart, setAddingToCart] = useState({});
  // Состояние для сообщений о статусе операций
  const [statusMessage, setStatusMessage] = useState(null);
  // Состояние для отображаемых спецификаций
  const [displayedSpecs, setDisplayedSpecs] = useState([]);
  // Состояние для отображения только различий
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);

  // Обрабатываем список спецификаций при изменении списка товаров
  useEffect(() => {
    if (compareItems.length === 0) return;

    // Собираем все уникальные спецификации из всех товаров
    const allSpecs = {};
    
    compareItems.forEach(product => {
      if (product.specifications) {
        product.specifications.forEach(spec => {
          if (!allSpecs[spec.name]) {
            allSpecs[spec.name] = new Set();
          }
          allSpecs[spec.name].add(spec.value);
        });
      }
    });
    
    setSpecificationsMap(allSpecs);
    
    // Формируем список спецификаций для отображения
    updateDisplayedSpecs(allSpecs, showOnlyDifferences);
    
  }, [compareItems, showOnlyDifferences]);

  // Обновляем список отображаемых спецификаций с учетом фильтра различий
  const updateDisplayedSpecs = (specs, onlyDifferences) => {
    if (!specs) return;
    
    let specNames = Object.keys(specs);
    
    // Если нужно показать только различающиеся характеристики
    if (onlyDifferences) {
      specNames = specNames.filter(name => specs[name].size > 1);
    }
    
    // Сортируем характеристики по алфавиту
    specNames.sort();
    
    setDisplayedSpecs(specNames);
  };

  // Переключатель отображения только различий
  const toggleDifferencesOnly = () => {
    const newValue = !showOnlyDifferences;
    setShowOnlyDifferences(newValue);
    updateDisplayedSpecs(specificationsMap, newValue);
  };

  // Получить значение спецификации для конкретного товара
  const getSpecValue = (product, specName) => {
    if (!product.specifications) return '—';
    
    const spec = product.specifications.find(s => s.name === specName);
    return spec ? spec.value : '—';
  };

  // Добавить товар в корзину
  const addToCart = async (productId) => {
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
        setStatusMessage({ type: 'error', text: 'Ошибка при добавлении товара в корзину' });
      }
      
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      // Сбрасываем состояние загрузки
      setAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Перейти к детальной странице товара
  const goToProductDetail = (productId) => {
    navigate(`/product/${productId}`);
  };

  // Если нет товаров для сравнения, показываем сообщение
  if (compareItems.length === 0) {
    return (
      <div className="compare-empty-container">
        <div className="compare-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 16L10 12L6 8M14 8L18 12L14 16" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2>Список сравнения пуст</h2>
          <p>Добавьте товары для сравнения через карточки товаров</p>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/')}
          >
            Перейти к товарам
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="compare-container">
      <div className="compare-header">
        <h1>Сравнение товаров</h1>
        <div className="compare-actions">
          <div className="compare-filter">
            <label className="compare-switch">
              <input 
                type="checkbox" 
                checked={showOnlyDifferences} 
                onChange={toggleDifferencesOnly}
              />
              <span className="compare-slider"></span>
            </label>
            <span>Только различия</span>
          </div>
          <button 
            className="compare-clear-btn"
            onClick={clearCompare}
          >
            Очистить все
          </button>
        </div>
        <div className="compare-category">
          <span>Категория:</span> {compareCategory}
        </div>
      </div>

      {/* Уведомление об успехе/ошибке */}
      {statusMessage && (
        <div className={`compare-notification ${statusMessage.type}`}>
          {statusMessage.text}
        </div>
      )}

      <div className="compare-table-wrapper">
        <table className="compare-table">
          <thead>
            <tr>
              <th className="compare-feature-col">Характеристика</th>
              {compareItems.map(product => (
                <th key={product.id} className="compare-product-col">
                  <div className="compare-product-header">
                    <div className="compare-product-image-container">
                      <img 
                        src={product.imageUrl || 'https://via.placeholder.com/100'} 
                        alt={product.name}
                        className="compare-product-image"
                      />
                    </div>
                    <h3 className="compare-product-name">{product.name}</h3>
                    <div className="compare-product-price">{product.price} $</div>
                    <div className="compare-product-actions">
                      <button 
                        className="compare-view-btn"
                        onClick={() => goToProductDetail(product.id)}
                      >
                        Просмотр
                      </button>
                      <button 
                        className={`compare-cart-btn ${addingToCart[product.id] ? 'loading' : ''}`}
                        onClick={() => addToCart(product.id)}
                        disabled={addingToCart[product.id]}
                      >
                        {addingToCart[product.id] ? (
                          <span className="btn-spinner"></span>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 3H5L5.4 5M5.4 5H21L17 13H7M5.4 5L7 13M7 13L5.8 16H17M10 20C10 20.5523 9.55228 21 9 21C8.44772 21 8 20.5523 8 20C8 19.4477 8.44772 19 9 19C9.55228 19 10 19.4477 10 20ZM16 20C16 20.5523 15.5523 21 15 21C14.4477 21 14 20.5523 14 20C14 19.4477 14.4477 19 15 19C15.5523 19 16 19.4477 16 20Z" 
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            В корзину
                          </>
                        )}
                      </button>
                      <button 
                        className="compare-remove-btn"
                        onClick={() => removeFromCompare(product.id)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Удалить
                      </button>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Строка базовой информации - описание */}
            <tr>
              <td className="compare-feature-name">Описание</td>
              {compareItems.map(product => (
                <td key={product.id}>
                  <div className="compare-product-description">
                    {product.description || 'Нет описания'}
                  </div>
                </td>
              ))}
            </tr>

            {/* Строки с характеристиками */}
            {displayedSpecs.map(specName => {
              // Проверяем, есть ли различия в этой характеристике
              const specValues = new Set();
              compareItems.forEach(product => {
                specValues.add(getSpecValue(product, specName));
              });
              
              const hasDifferences = specValues.size > 1;
              
              return (
                <tr key={specName} className={hasDifferences ? 'has-differences' : ''}>
                  <td className="compare-feature-name">{specName}</td>
                  {compareItems.map(product => {
                    const value = getSpecValue(product, specName);
                    return (
                      <td key={product.id}>
                        <div className="compare-spec-value">{value}</div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparePage;