/**
 * Утилиты для работы с API Новой Почты
 */

// Форматирование номера телефона для API Новой почты
export const formatPhoneNumber = (phoneNumber) => {
    // Удаляем все нецифровые символы
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    // Проверяем, начинается ли номер с 380 (код Украины)
    if (digitsOnly.startsWith('380') && digitsOnly.length === 12) {
      return digitsOnly;
    }
    
    // Если номер начинается с 0 и имеет 10 цифр (стандартный украинский номер)
    if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
      return `38${digitsOnly}`;
    }
    
    // Если номер имеет 9 цифр (без начального 0)
    if (digitsOnly.length === 9) {
      return `380${digitsOnly}`;
    }
    
    // Возвращаем исходный формат, если не подходит под шаблоны
    return digitsOnly;
  };
  
  // Валидация номера телефона для Новой почты
  export const validatePhoneNumber = (phoneNumber) => {
    const formattedNumber = formatPhoneNumber(phoneNumber);
    // Проверяем, что номер начинается с 380 и имеет 12 цифр
    return /^380\d{9}$/.test(formattedNumber);
  };
  
  // Форматирование имени получателя для API Новой почты
  export const formatRecipientName = (name) => {
    // Удаляем лишние пробелы
    const trimmedName = name.trim().replace(/\s+/g, ' ');
    
    // Разбиваем имя на части
    const nameParts = trimmedName.split(' ');
    
    // Если менее 2-х частей, возвращаем как есть
    if (nameParts.length < 2) {
      return trimmedName;
    }
    
    // Форматируем имя для API (Фамилия И.О.)
    const lastName = nameParts[0];
    const firstInitial = nameParts[1][0] || '';
    const middleInitial = nameParts[2] ? nameParts[2][0] || '' : '';
    
    // Если есть отчество
    if (middleInitial) {
      return `${lastName} ${firstInitial}.${middleInitial}.`;
    }
    
    // Если только имя и фамилия
    return `${lastName} ${firstInitial}.`;
  };
  
  // Генерация описания для посылки
  export const generateShipmentDescription = (orderId, items) => {
    if (!items || items.length === 0) {
      return `Заказ #${orderId}`;
    }
    
    // Если товаров немного, перечисляем их
    if (items.length <= 3) {
      const itemNames = items.map(item => item.productName).join(', ');
      return `Заказ #${orderId}: ${itemNames}`;
    }
    
    // Если много товаров, указываем количество
    return `Заказ #${orderId}: ${items.length} товаров`;
  };
  
  // Форматирование веса посылки для API
  export const formatWeight = (weightInGrams) => {
    // Новая почта принимает вес в кг с точностью до 3 знаков
    const weightInKg = weightInGrams / 1000;
    return parseFloat(weightInKg.toFixed(3));
  };
  
  // Расчет объемного веса (для крупногабаритных посылок)
  export const calculateVolumeWeight = (length, width, height) => {
    // Формула: (длина * ширина * высота) / 4000, где размеры в см
    return (length * width * height) / 4000;
  };
  
  // Объединение реального и объемного веса для расчета стоимости
  export const calculateShippingWeight = (actualWeight, volumeWeight) => {
    // Новая почта использует большее из двух значений
    return Math.max(actualWeight, volumeWeight);
  };
  
  // Форматирование даты для API Новой почты
  export const formatDateForApi = (date = new Date()) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
  };
  
  // Получение строкового представления типа оплаты для API
  export const getPayerTypeString = (payerType) => {
    const payerTypes = {
      'sender': 'Sender',      // Отправитель
      'recipient': 'Recipient', // Получатель
      'thirdPerson': 'ThirdPerson' // Третье лицо
    };
    
    return payerTypes[payerType] || 'Recipient';
  };
  
  // Получение строкового представления способа оплаты для API
  export const getPaymentMethodString = (paymentMethod) => {
    const paymentMethods = {
      'cash': 'Cash',           // Наличные
      'cashOnDelivery': 'NonCash', // Наложенный платеж
      'card': 'Card'            // Карта
    };
    
    return paymentMethods[paymentMethod] || 'Cash';
  };
  
  // Получение кода типа услуги доставки
  export const getServiceTypeString = (deliveryType) => {
    const serviceTypes = {
      'warehouse': 'WarehouseWarehouse', // Отделение-Отделение
      'courier': 'WarehouseDoors',       // Отделение-Адрес
      'poshtomat': 'WarehousePostomat'   // Отделение-Почтомат
    };
    
    return serviceTypes[deliveryType] || 'WarehouseWarehouse';
  };
  
  // Определение типа груза для API
  export const getCargoTypeString = (cargoType) => {
    const cargoTypes = {
      'parcel': 'Parcel',      // Посылка
      'cargo': 'Cargo',        // Груз
      'documents': 'Documents', // Документы
      'tires': 'TiresWheels'   // Шины-диски
    };
    
    return cargoTypes[cargoType] || 'Cargo';
  };
  
  // Проверка валидности отделения (работает ли оно)
  export const isWarehouseActive = (warehouse) => {
    if (!warehouse) return false;
    
    // Проверяем статус отделения
    return warehouse.WarehouseStatus === 'Working' || 
           warehouse.WarehouseStatus === 'Active';
  };
  
  // Получение номера отделения из его описания
  export const getWarehouseNumber = (description) => {
    if (!description) return '';
    
    // Пытаемся найти номер отделения в формате "Отделение №123"
    const match = description.match(/№\s*(\d+)/);
    if (match && match[1]) {
      return match[1];
    }
    
    return '';
  };
  
  // Форматирование денежной суммы для API (без копеек)
  export const formatMoney = (amount) => {
    return Math.round(parseFloat(amount));
  };
  
  // Экспорт всех утилит
  export default {
    formatPhoneNumber,
    validatePhoneNumber,
    formatRecipientName,
    generateShipmentDescription,
    formatWeight,
    calculateVolumeWeight,
    calculateShippingWeight,
    formatDateForApi,
    getPayerTypeString,
    getPaymentMethodString,
    getServiceTypeString,
    getCargoTypeString,
    isWarehouseActive,
    getWarehouseNumber,
    formatMoney
  };