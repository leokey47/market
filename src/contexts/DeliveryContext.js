import React, { createContext, useState, useContext, useEffect } from 'react';

// Создаем контекст доставки
const DeliveryContext = createContext();

// Провайдер контекста доставки
export const DeliveryProvider = ({ children }) => {
  // Состояние для информации о доставке
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  
  // Загружаем информацию о доставке из localStorage при инициализации
  useEffect(() => {
    const savedDelivery = localStorage.getItem('selectedDelivery');
    if (savedDelivery) {
      try {
        const parsedDelivery = JSON.parse(savedDelivery);
        setDeliveryInfo(parsedDelivery);
      } catch (error) {
        console.error('Error parsing delivery info from localStorage:', error);
      }
    }
  }, []);
  
  // Функция для обновления информации о доставке
  const updateDeliveryInfo = (newInfo) => {
    setDeliveryInfo(newInfo);
    
    // Сохраняем в localStorage для персистентности
    if (newInfo) {
      localStorage.setItem('selectedDelivery', JSON.stringify(newInfo));
    } else {
      localStorage.removeItem('selectedDelivery');
    }
  };
  
  // Функция для очистки информации о доставке
  const clearDeliveryInfo = () => {
    setDeliveryInfo(null);
    localStorage.removeItem('selectedDelivery');
  };
  
  // Значение контекста
  const contextValue = {
    deliveryInfo,
    updateDeliveryInfo,
    clearDeliveryInfo
  };
  
  return (
    <DeliveryContext.Provider value={contextValue}>
      {children}
    </DeliveryContext.Provider>
  );
};

// Хук для использования контекста доставки
export const useDelivery = () => {
  const context = useContext(DeliveryContext);
  if (!context) {
    throw new Error('useDelivery must be used within a DeliveryProvider');
  }
  return context;
};

export default DeliveryContext;