import React, { createContext, useState, useContext, useEffect } from 'react';
import { ProductService } from './ApiService';

// Создаем контекст для списка сравнения
const CompareContext = createContext();

// Хук для использования контекста сравнения
export const useCompare = () => useContext(CompareContext);

// Провайдер контекста
export const CompareProvider = ({ children }) => {
  // Состояние для хранения товаров для сравнения
  const [compareItems, setCompareItems] = useState([]);
  // Текущая категория сравнения
  const [compareCategory, setCompareCategory] = useState(null);
  // Загрузка данных
  const [loading, setLoading] = useState(false);
  // Сообщение об ошибке
  const [error, setError] = useState(null);

  // При инициализации загружаем товары из localStorage
  useEffect(() => {
    const savedItems = localStorage.getItem('compareItems');
    if (savedItems) {
      const parsedItems = JSON.parse(savedItems);
      setCompareItems(parsedItems);
      
      // Установка категории, если есть товары
      if (parsedItems.length > 0) {
        setCompareCategory(parsedItems[0].category);
      }
    }
  }, []);

  // Сохраняем товары в localStorage при изменениях
  useEffect(() => {
    localStorage.setItem('compareItems', JSON.stringify(compareItems));
    
    // Обновляем категорию, если список пуст или изменился
    if (compareItems.length === 0) {
      setCompareCategory(null);
    } else if (compareItems.length > 0 && compareCategory !== compareItems[0].category) {
      setCompareCategory(compareItems[0].category);
    }
  }, [compareItems]);

  // Добавить товар в список сравнения
  const addToCompare = async (productId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Получаем полную информацию о товаре через API
      const product = await ProductService.getProduct(productId);
      
      // Проверяем, есть ли этот товар уже в списке
      if (compareItems.some(item => item.id === product.id)) {
        setError("Товар уже добавлен в список сравнения");
        return false;
      }
      
      // Проверяем совместимость категорий
      if (compareItems.length > 0 && compareItems[0].category !== product.category) {
        setError(`Можно сравнивать только товары из одной категории: "${compareItems[0].category}"`);
        return false;
      }
      
      // Добавляем товар в список
      setCompareItems(prev => [...prev, product]);
      
      // Устанавливаем категорию, если это первый товар
      if (compareItems.length === 0) {
        setCompareCategory(product.category);
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка при добавлении товара в сравнение:', error);
      setError('Не удалось добавить товар в список сравнения');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Удалить товар из списка сравнения
  const removeFromCompare = (productId) => {
    setCompareItems(prev => prev.filter(item => item.id !== productId));
  };

  // Очистить весь список сравнения
  const clearCompare = () => {
    setCompareItems([]);
    setCompareCategory(null);
  };

  // Получить количество товаров в списке сравнения
  const getCompareCount = () => compareItems.length;

  // Значение, которое мы предоставляем в контексте
  const value = {
    compareItems,
    compareCategory,
    loading,
    error,
    addToCompare,
    removeFromCompare,
    clearCompare,
    getCompareCount,
  };

  return (
    <CompareContext.Provider value={value}>
      {children}
    </CompareContext.Provider>
  );
};

export default CompareContext;