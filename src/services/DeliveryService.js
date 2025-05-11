import { apiClient } from '../ApiService';
import NovaPoshtaService from './NovaPoshtaService';

// Сервис для работы с доставкой
const DeliveryService = {
  // Получение данных о доставке по ID заказа
  getDeliveryByOrder: async (orderId) => {
    try {
      const response = await apiClient.get(`/api/Delivery/order/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching delivery data:', error);
      throw error;
    }
  },

  // Создание новой доставки
  createDelivery: async (deliveryData) => {
    try {
      const response = await apiClient.post('/api/Delivery', deliveryData);
      return response.data;
    } catch (error) {
      console.error('Error creating delivery:', error);
      throw error;
    }
  },

  // Обновление данных о доставке
  updateDelivery: async (deliveryId, deliveryData) => {
    try {
      const response = await apiClient.put(`/api/Delivery/${deliveryId}`, deliveryData);
      return response.data;
    } catch (error) {
      console.error('Error updating delivery:', error);
      throw error;
    }
  },

  // Обновление статуса доставки (для админа)
  updateDeliveryStatus: async (deliveryId, statusData) => {
    try {
      const response = await apiClient.patch(`/api/Delivery/${deliveryId}/status`, statusData);
      return response.data;
    } catch (error) {
      console.error('Error updating delivery status:', error);
      throw error;
    }
  },

  // Получить стоимость доставки через Новую почту
  calculateNovaPoshtaDelivery: async (calculationData) => {
    try {
      return await NovaPoshtaService.calculateDelivery(calculationData);
    } catch (error) {
      console.error('Error calculating Nova Poshta delivery:', error);
      throw error;
    }
  },

  // Получить стоимость доставки, в зависимости от метода
  calculateDeliveryCost: async (method, calculationData) => {
    switch (method.toLowerCase()) {
      case 'novaposhta':
        return DeliveryService.calculateNovaPoshtaDelivery(calculationData);
      // Другие службы доставки могут быть добавлены здесь
      default:
        throw new Error(`Unsupported delivery method: ${method}`);
    }
  },

  // Получить список доступных методов доставки
  getAvailableDeliveryMethods: () => {
    return [
      { id: 'novaposhta', name: 'Нова Пошта', logo: '/images/novaposhta-logo.svg' },
      { id: 'ukrposhta', name: 'Укрпошта', logo: '/images/ukrposhta-logo.svg', disabled: true },
      { id: 'meest', name: 'Meest Express', logo: '/images/meest-logo.svg', disabled: true }
    ];
  },

  // Получить список типов доставки для конкретного метода
  getDeliveryTypes: (method) => {
    switch (method.toLowerCase()) {
      case 'novaposhta':
        return [
          { id: 'warehouse', name: 'Доставка в отделение' },
          { id: 'poshtomat', name: 'Доставка в почтомат' },
          { id: 'courier', name: 'Курьерская доставка', disabled: true }
        ];
      case 'ukrposhta':
        return [
          { id: 'office', name: 'Доставка в отделение' },
          { id: 'courier', name: 'Курьерская доставка', disabled: true }
        ];
      case 'meest':
        return [
          { id: 'warehouse', name: 'Доставка в отделение' },
          { id: 'courier', name: 'Курьерская доставка', disabled: true }
        ];
      default:
        return [];
    }
  },

  // Форматировать статус доставки для отображения
  formatDeliveryStatus: (status) => {
    const statusMap = {
      'Pending': 'Ожидает отправки',
      'Processing': 'Обрабатывается',
      'InTransit': 'В пути',
      'Delivered': 'Доставлено',
      'Failed': 'Ошибка доставки',
      'Returned': 'Возвращено отправителю'
    };

    return statusMap[status] || status;
  },

  // Получить стили для статуса доставки
  getDeliveryStatusStyle: (status) => {
    const styleMap = {
      'Pending': { color: 'warning', icon: 'bi-clock' },
      'Processing': { color: 'info', icon: 'bi-gear' },
      'InTransit': { color: 'primary', icon: 'bi-truck' },
      'Delivered': { color: 'success', icon: 'bi-check-circle' },
      'Failed': { color: 'danger', icon: 'bi-exclamation-triangle' },
      'Returned': { color: 'secondary', icon: 'bi-arrow-return-left' }
    };

    return styleMap[status] || { color: 'secondary', icon: 'bi-question-circle' };
  }
};

export default DeliveryService;