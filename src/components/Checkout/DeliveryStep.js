import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import NovaPoshtaSelector from '../Delivery/NovaPoshtaSelector';
import DeliveryService from '../../services/DeliveryService';
import NovaPoshtaService from '../../services/NovaPoshtaService';
import { useDelivery } from '../../contexts/DeliveryContext';
import './DeliveryStep.css';

const DeliveryStep = ({ onNext, onSetDeliveryDetails, initialData = {} }) => {
  // Защита от null
  const safeInitialData = initialData || {};
  
  // Используем контекст доставки, если он доступен
  const deliveryContext = useDelivery();
  
  // Состояния для выбора способа доставки
  const [deliveryMethod, setDeliveryMethod] = useState(
    safeInitialData.deliveryMethod || deliveryContext?.deliveryInfo?.deliveryMethod || 'novaposhta'
  );
  const [deliveryType, setDeliveryType] = useState(
    safeInitialData.deliveryType || deliveryContext?.deliveryInfo?.deliveryType || 'warehouse'
  );
  
  // Состояния для данных получателя
  const [recipientName, setRecipientName] = useState(
    safeInitialData.recipientFullName || deliveryContext?.deliveryInfo?.recipientFullName || ''
  );
  const [recipientPhone, setRecipientPhone] = useState(
    safeInitialData.recipientPhone || deliveryContext?.deliveryInfo?.recipientPhone || ''
  );
  
  // Состояния для адреса доставки
  const [deliveryAddress, setDeliveryAddress] = useState(
    safeInitialData.deliveryAddress || deliveryContext?.deliveryInfo?.deliveryAddress || ''
  );
  
  // Состояния для Новой почты
  const [novaPoshtaDelivery, setNovaPoshtaDelivery] = useState({
    cityRef: safeInitialData.cityRef || deliveryContext?.deliveryInfo?.cityRef || '',
    cityName: safeInitialData.cityName || deliveryContext?.deliveryInfo?.cityName || '',
    warehouseRef: safeInitialData.warehouseRef || deliveryContext?.deliveryInfo?.warehouseRef || '',
    warehouseAddress: safeInitialData.warehouseAddress || deliveryContext?.deliveryInfo?.warehouseAddress || ''
  });
  
  // Состояния для расчета стоимости
  const [deliveryCost, setDeliveryCost] = useState(
    safeInitialData.deliveryCost || deliveryContext?.deliveryInfo?.deliveryCost || 0
  );
  const [calculatingCost, setCalculatingCost] = useState(false);
  
  // Состояния для ошибок и валидации
  const [validated, setValidated] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Доступные методы доставки
  const availableMethods = DeliveryService.getAvailableDeliveryMethods();
  
  // При изменении данных доставки, выполняем расчет
  useEffect(() => {
    if (deliveryMethod === 'novaposhta' && 
        novaPoshtaDelivery.cityRef && 
        novaPoshtaDelivery.warehouseRef) {
      calculateDeliveryCost(novaPoshtaDelivery);
    }
  }, [deliveryMethod, novaPoshtaDelivery.cityRef, novaPoshtaDelivery.warehouseRef]);
  
  // Обработчик изменения метода доставки
  const handleDeliveryMethodChange = (e) => {
    const method = e.target.value;
    setDeliveryMethod(method);
    
    // Сбрасываем тип доставки и устанавливаем первый доступный
    const availableTypes = DeliveryService.getDeliveryTypes(method);
    const firstAvailableType = availableTypes.find(t => !t.disabled)?.id || availableTypes[0]?.id;
    setDeliveryType(firstAvailableType);
  };
  
  // Обработчик изменения типа доставки
  const handleDeliveryTypeChange = (e) => {
    setDeliveryType(e.target.value);
  };
  
  // Обработчик выбора адреса доставки (Новая почта)
  const handleSelectNovaPoshtaDelivery = (delivery) => {
    setNovaPoshtaDelivery(delivery);
    calculateDeliveryCost(delivery);
  };
  
  // Расчет стоимости доставки
  const calculateDeliveryCost = async (delivery) => {
    setCalculatingCost(true);
    try {
      // Попытка получить стоимость доставки через API
      const calculationData = {
        senderCityRef: '', // В реальном приложении здесь будет ref города отправителя
        recipientCityRef: delivery.cityRef,
        weight: 0.5, // Предполагаемый вес посылки в кг
        serviceType: 'WarehouseWarehouse',
        declaredValue: 1000, // Объявленная стоимость
        cargoType: 'Cargo',
        seatsAmount: 1
      };
      
      try {
        // Пытаемся получить точную стоимость через API
        const response = await NovaPoshtaService.calculateDelivery(calculationData);
        if (response && response.success && response.data && response.data.length > 0) {
          setDeliveryCost(response.data[0].Cost);
        } else {
          // Если не удалось получить точную стоимость, используем приблизительную
          setDeliveryCost(60);
        }
      } catch (error) {
        console.error('Ошибка при расчете стоимости доставки:', error);
        // Устанавливаем приблизительную стоимость
        setDeliveryCost(60);
      }
    } finally {
      setCalculatingCost(false);
    }
  };
  
  // Валидация формы
  const validateForm = () => {
    const newErrors = {};
    
    if (!recipientName.trim()) {
      newErrors.recipientName = 'Необходимо указать ФИО получателя';
    }
    
    if (!recipientPhone.trim()) {
      newErrors.recipientPhone = 'Необходимо указать телефон получателя';
    } else if (!/^\+?[0-9]{10,12}$/.test(recipientPhone.replace(/\s/g, ''))) {
      newErrors.recipientPhone = 'Некорректный формат телефона';
    }
    
    if (deliveryMethod === 'novaposhta' && deliveryType === 'warehouse') {
      if (!novaPoshtaDelivery.cityRef) {
        newErrors.novaPoshtaCity = 'Необходимо выбрать город';
      }
      
      if (!novaPoshtaDelivery.warehouseRef) {
        newErrors.novaPoshtaWarehouse = 'Необходимо выбрать отделение';
      }
    }
    
    if (deliveryType === 'courier' && !deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Необходимо указать адрес доставки';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Обработчик нажатия кнопки продолжения
  const handleContinue = (e) => {
    e.preventDefault();
    setValidated(true);
    
    if (validateForm()) {
      // Собираем данные о доставке
      const deliveryDetails = {
        deliveryMethod,
        deliveryType,
        recipientFullName: recipientName,
        recipientPhone: recipientPhone,
        deliveryCost,
        ...(deliveryType === 'courier' ? { deliveryAddress } : {}),
        ...(deliveryMethod === 'novaposhta' && deliveryType === 'warehouse' ? novaPoshtaDelivery : {})
      };
      
      // Сохраняем в контекст, если он доступен
      if (deliveryContext?.updateDeliveryInfo) {
        deliveryContext.updateDeliveryInfo(deliveryDetails);
      }
      
      // Передаем данные родительскому компоненту
      onSetDeliveryDetails(deliveryDetails);
      onNext();
    }
  };
  
  // Форматирование номера телефона при вводе
  const formatPhoneNumber = (value) => {
    // Удаляем все, кроме цифр
    const digitsOnly = value.replace(/\D/g, '');
    
    if (digitsOnly.length === 0) {
      return '';
    }
    
    // Форматируем телефон с кодом Украины
    if (digitsOnly.startsWith('380') && digitsOnly.length > 3) {
      // +380 XX XXX XX XX
      let formatted = '+380';
      if (digitsOnly.length > 3) {
        formatted += ' ' + digitsOnly.substring(3, 5);
      }
      if (digitsOnly.length > 5) {
        formatted += ' ' + digitsOnly.substring(5, 8);
      }
      if (digitsOnly.length > 8) {
        formatted += ' ' + digitsOnly.substring(8, 10);
      }
      if (digitsOnly.length > 10) {
        formatted += ' ' + digitsOnly.substring(10, 12);
      }
      return formatted;
    }
    
    // Форматируем телефон с 0 в начале (стандартный украинский номер)
    if (digitsOnly.startsWith('0') || !digitsOnly.startsWith('38')) {
      // 0XX XXX XX XX
      let formatted = digitsOnly.startsWith('0') ? '' : '0';
      formatted += digitsOnly.startsWith('0') ? digitsOnly.substring(0, 3) : digitsOnly.substring(0, 2);
      
      const effectiveDigits = digitsOnly.startsWith('0') ? digitsOnly : '0' + digitsOnly;
      
      if (effectiveDigits.length > 3) {
        formatted += ' ' + effectiveDigits.substring(3, 6);
      }
      if (effectiveDigits.length > 6) {
        formatted += ' ' + effectiveDigits.substring(6, 8);
      }
      if (effectiveDigits.length > 8) {
        formatted += ' ' + effectiveDigits.substring(8, 10);
      }
      
      return formatted;
    }
    
    return value;
  };
  
  const handlePhoneChange = (e) => {
    const formattedPhone = formatPhoneNumber(e.target.value);
    setRecipientPhone(formattedPhone);
  };
  
  return (
    <div className="delivery-step">
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-white">
          <h5 className="mb-0">Выберите способ доставки</h5>
        </Card.Header>
        <Card.Body>
          <Form noValidate validated={validated} onSubmit={handleContinue}>
            {/* Выбор метода доставки */}
            <Form.Group className="mb-4">
              <Form.Label>Служба доставки</Form.Label>
              <Row className="delivery-methods">
                {availableMethods.map(method => (
                  <Col xs={12} md={4} key={method.id}>
                    <div 
                      className={`delivery-method-card ${deliveryMethod === method.id ? 'selected' : ''} ${method.disabled ? 'disabled' : ''}`}
                      onClick={() => !method.disabled && setDeliveryMethod(method.id)}
                    >
                      <div className="method-logo">
                        <img src={method.logo} alt={method.name} />
                      </div>
                      <div className="method-info">
                        <Form.Check
                          type="radio"
                          id={`delivery-method-${method.id}`}
                          name="deliveryMethod"
                          value={method.id}
                          checked={deliveryMethod === method.id}
                          onChange={handleDeliveryMethodChange}
                          label={method.name}
                          disabled={method.disabled}
                        />
                        {method.disabled && <small className="text-muted d-block">Скоро будет доступно</small>}
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Form.Group>

            {/* Выбор типа доставки */}
            <Form.Group className="mb-4">
              <Form.Label>Тип доставки</Form.Label>
              <div className="delivery-types">
                {DeliveryService.getDeliveryTypes(deliveryMethod).map(type => (
                  <Form.Check
                    key={type.id}
                    type="radio"
                    id={`delivery-type-${type.id}`}
                    name="deliveryType"
                    value={type.id}
                    checked={deliveryType === type.id}
                    onChange={handleDeliveryTypeChange}
                    label={type.name}
                    disabled={type.disabled}
                    inline
                  />
                ))}
              </div>
            </Form.Group>

            {/* Данные получателя */}
            <Row className="mb-4">
              <Col md={6}>
                <Form.Group controlId="recipientName">
                  <Form.Label>ФИО получателя</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Иванов Иван Иванович"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    isInvalid={!!errors.recipientName}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.recipientName}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="recipientPhone">
                  <Form.Label>Телефон получателя</Form.Label>
                 <Form.Control
                   type="tel"
                   placeholder="+380 XX XXX XX XX"
                   value={recipientPhone}
                   onChange={handlePhoneChange}
                   isInvalid={!!errors.recipientPhone}
                   required
                 />
                 <Form.Control.Feedback type="invalid">
                   {errors.recipientPhone}
                 </Form.Control.Feedback>
               </Form.Group>
             </Col>
           </Row>

           {/* Компонент выбора отделения Новой почты */}
           {deliveryMethod === 'novaposhta' && deliveryType === 'warehouse' && (
             <div className="mb-4">
               <h6>Выберите отделение Новой почты</h6>
               <NovaPoshtaSelector 
                 onSelectDelivery={handleSelectNovaPoshtaDelivery}
                 initialCity={novaPoshtaDelivery.cityRef ? { Ref: novaPoshtaDelivery.cityRef, Description: novaPoshtaDelivery.cityName } : null}
                 initialWarehouse={novaPoshtaDelivery.warehouseRef ? { Ref: novaPoshtaDelivery.warehouseRef, Description: novaPoshtaDelivery.warehouseAddress } : null}
               />
               {errors.novaPoshtaCity && (
                 <Alert variant="danger" className="mt-2 py-1 px-2">{errors.novaPoshtaCity}</Alert>
               )}
               {errors.novaPoshtaWarehouse && (
                 <Alert variant="danger" className="mt-2 py-1 px-2">{errors.novaPoshtaWarehouse}</Alert>
               )}
             </div>
           )}

           {/* Адрес доставки для курьера */}
           {/* {deliveryType === 'courier' && (
             <Form.Group className="mb-4" controlId="deliveryAddress">
               <Form.Label>Адрес доставки</Form.Label>
               <Form.Control
                 as="textarea"
                 rows={3}
                 placeholder="Полный адрес доставки"
                 value={deliveryAddress}
                 onChange={(e) => setDeliveryAddress(e.target.value)}
                 isInvalid={!!errors.deliveryAddress}
                 required
               />
               <Form.Control.Feedback type="invalid">
                 {errors.deliveryAddress}
               </Form.Control.Feedback>
             </Form.Group>
           )} */}

           {/* Стоимость доставки */}
           <div className="delivery-cost mt-4 mb-4">
             <div className="d-flex justify-content-between align-items-center">
               <h6 className="mb-0">Стоимость доставки:</h6>
               <div className="d-flex align-items-center">
                 {calculatingCost ? (
                   <Spinner animation="border" size="sm" className="me-2" />
                 ) : (
                   <span className="cost-value">{deliveryCost} грн</span>
                 )}
               </div>
             </div>
           </div>

           {/* Кнопки */}
           <div className="d-flex justify-content-end">
             <Button variant="primary" type="submit">
               Продолжить
             </Button>
           </div>
         </Form>
       </Card.Body>
     </Card>
   </div>
 );
};

export default DeliveryStep;