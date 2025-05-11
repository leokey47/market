import { apiClient } from '../ApiService';

// Сервис для работы с API Новой почты через наш бэкенд
const NovaPoshtaService = {
  // Получение списка городов с поддержкой поиска
  getCities: async (searchString = '') => {
    try {
      const response = await apiClient.get(`/api/NovaPoshta/cities`, {
        params: { search: searchString }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching cities from Nova Poshta:', error);
      throw error;
    }
  },

  // Получение отделений в конкретном городе
  getWarehouses: async (cityRef) => {
    try {
      const response = await apiClient.get(`/api/NovaPoshta/warehouses/${cityRef}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching warehouses from Nova Poshta:', error);
      throw error;
    }
  },

  // Получение областей Украины
  getAreas: async () => {
    try {
      const response = await apiClient.get('/api/NovaPoshta/areas');
      return response.data;
    } catch (error) {
      console.error('Error fetching areas from Nova Poshta:', error);
      throw error;
    }
  },

  // Получение типов населенных пунктов
  getSettlementTypes: async () => {
    try {
      const response = await apiClient.get('/api/NovaPoshta/settlement-types');
      return response.data;
    } catch (error) {
      console.error('Error fetching settlement types from Nova Poshta:', error);
      throw error;
    }
  },

  // Расчет стоимости доставки
  calculateDelivery: async (calculationData) => {
    try {
      const response = await apiClient.post('/api/NovaPoshta/calculate', calculationData);
      return response.data;
    } catch (error) {
      console.error('Error calculating delivery cost with Nova Poshta:', error);
      throw error;
    }
  },

  // Создание накладной для отправки
  createShipping: async (shippingData) => {
    try {
      const response = await apiClient.post('/api/NovaPoshta/create-shipping', shippingData);
      return response.data;
    } catch (error) {
      console.error('Error creating shipping with Nova Poshta:', error);
      throw error;
    }
  },

  // Форматирование адреса отделения для отображения
  formatWarehouseAddress: (warehouse) => {
    if (!warehouse) return '';
    
    let address = `${warehouse.Description}`;
    if (warehouse.ShortAddress) {
      address += ` (${warehouse.ShortAddress})`;
    }
    
    return address;
  },

  // Форматирование города для отображения
  formatCity: (city) => {
    if (!city) return '';
    
    let cityName = city.Description || city.DescriptionRu;
    if (city.AreaDescription) {
      cityName += `, ${city.AreaDescription}`;
    }
    
    return cityName;
  },

  // Проверка, работает ли сейчас отделение
  isWarehouseWorking: (warehouse) => {
    if (!warehouse) return false;
    
    // Логируем для отладки
    console.log('Checking warehouse:', warehouse.Description, {
      PlaceMaxWeightAllowed: warehouse.PlaceMaxWeightAllowed,
      TotalMaxWeightAllowed: warehouse.TotalMaxWeightAllowed,
      WarehouseStatus: warehouse.WarehouseStatus
    });
    
    // Проверяем статус отделения
    if (warehouse.WarehouseStatus) {
      const status = warehouse.WarehouseStatus.toLowerCase();
      
      // Если статус явно "working" - возвращаем true
      if (status === 'working' || status === 'работает') {
        return true;
      }
      
      // Если статус явно указывает на закрытие
      if (status === 'closed' || status === 'не работает' || status === 'nonworking') {
        return false;
      }
    }
    
    // Проверяем вес
    // Если оба веса равны нулю - скорее всего отделение не работает
    if (warehouse.PlaceMaxWeightAllowed === 0 && warehouse.TotalMaxWeightAllowed === 0) {
      return false;
    }
    
    // Если поля весов являются строками "0"
    if (warehouse.PlaceMaxWeightAllowed === "0" && warehouse.TotalMaxWeightAllowed === "0") {
      return false;
    }
    
    // Дополнительная проверка - если какой-то из весов больше 0, значит отделение работает
    const placeWeight = parseFloat(warehouse.PlaceMaxWeightAllowed) || 0;
    const totalWeight = parseFloat(warehouse.TotalMaxWeightAllowed) || 0;
    
    if (placeWeight > 0 || totalWeight > 0) {
      return true;
    }
    
    // Проверяем тип отделения - почтоматы и пункты выдачи обычно работают
    if (warehouse.TypeOfWarehouse) {
      const type = warehouse.TypeOfWarehouse.toLowerCase();
      if (type.includes('почтомат') || type.includes('postomat') || 
          type.includes('пункт') || type.includes('poshtamat')) {
        return true;
      }
    }
    
    // По умолчанию считаем отделение работающим
    // Меняем на true, чтобы показывать отделения по умолчанию
    return true;
  },

  // Фильтрация отделений по типу (почтовые, карго и т.д.)
  filterWarehouses: (warehouses, type = 'all') => {
    if (!warehouses || !Array.isArray(warehouses)) return [];
    
    // Фильтр по типу отделения
    if (type === 'post') {
      return warehouses.filter(w => 
        w.TypeOfWarehouse && (
          w.TypeOfWarehouse.toLowerCase().includes('почтовое') ||
          w.TypeOfWarehouse.toLowerCase().includes('поштове') ||
          w.TypeOfWarehouse.toLowerCase().includes('branch')
        )
      );
    } else if (type === 'cargo') {
      return warehouses.filter(w => 
        w.TypeOfWarehouse && (
          w.TypeOfWarehouse.toLowerCase().includes('грузовое') ||
          w.TypeOfWarehouse.toLowerCase().includes('вантажне') ||
          w.TypeOfWarehouse.toLowerCase().includes('cargo')
        )
      );
    } else if (type === 'poshtomat') {
      return warehouses.filter(w => 
        w.TypeOfWarehouse && (
          w.TypeOfWarehouse.toLowerCase().includes('почтомат') ||
          w.TypeOfWarehouse.toLowerCase().includes('поштомат') ||
          w.TypeOfWarehouse.toLowerCase().includes('postomat') ||
          w.TypeOfWarehouse.toLowerCase().includes('poshtomat')
        )
      );
    }
    
    // По умолчанию возвращаем все отделения
    return warehouses;
  }
};

export default NovaPoshtaService;