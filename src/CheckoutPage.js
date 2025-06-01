import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { CartService, PaymentService } from './ApiService';
import DeliveryService from './services/DeliveryService';
import CartSummary from './components/Cart/CartSummary';
import DeliveryStep from './components/Checkout/DeliveryStep';
import './CheckoutPage.css';

const CheckoutPage = () => {
  // Состояния для всего процесса оформления заказа
  const [currentStep, setCurrentStep] = useState(1);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  
  // Состояния для доставки - изменено с null на пустой объект
  const [deliveryDetails, setDeliveryDetails] = useState({});
  
  // Состояния для оплаты
  const [processingPayment, setProcessingPayment] = useState(false);
  const [availableCurrencies, setAvailableCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [popularCurrencies, setPopularCurrencies] = useState(['BTC', 'ETH', 'LTC', 'USDT', 'USDC', 'XRP', 'DOGE']);
  
  const navigate = useNavigate();
  
  // Используем явный URL бэкенда
  const API_URL = 'https://localhost:7209';

  useEffect(() => {
    fetchCartItems();
    fetchAvailableCurrencies();
  }, []);

  useEffect(() => {
    const total = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    setTotalAmount(total);
  }, [cartItems]);

  const fetchCartItems = async () => {
    setLoading(true);
    try {
      const data = await CartService.getCartItems();
      setCartItems(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching cart items:', err);
      setError('Ошибка при загрузке корзины. Пожалуйста, попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCurrencies = async () => {
    try {
      const data = await PaymentService.getAvailableCurrencies();
      console.log('Получены валюты:', data); // Для отладки
      
      if (data && Array.isArray(data)) {
        setAvailableCurrencies(data);
        // Set default selected currency
        if (data.includes('BTC')) {
          setSelectedCurrency('BTC');
        } else if (data.length > 0) {
          setSelectedCurrency(data[0]);
        }
      } else {
        // Если API не работает, используем fallback валюты
        console.warn('API валют не вернул данные, используем fallback');
        const fallbackCurrencies = ['BTC', 'ETH', 'LTC', 'USDT', 'USDC', 'XRP', 'DOGE', 'ADA', 'DOT', 'MATIC'];
        setAvailableCurrencies(fallbackCurrencies);
        setSelectedCurrency('BTC');
      }
    } catch (err) {
      console.error('Error fetching available currencies:', err);
      // Устанавливаем fallback валюты при ошибке
      const fallbackCurrencies = ['BTC', 'ETH', 'LTC', 'USDT', 'USDC', 'XRP', 'DOGE', 'ADA', 'DOT', 'MATIC'];
      setAvailableCurrencies(fallbackCurrencies);
      setSelectedCurrency('BTC');
    }
  };

  const handleCurrencyChange = (e) => {
    setSelectedCurrency(e.target.value);
  };

  const handleSetDeliveryDetails = (details) => {
    setDeliveryDetails(details);
  };

  // Переход к следующему шагу
  const handleNextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  // Переход к предыдущему шагу
  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleCheckout = async () => {
    if (!selectedCurrency) {
      setError('Пожалуйста, выберите валюту для оплаты');
      return;
    }

    setProcessingPayment(true);
    setError(null);

    try {
      // 1. Создаем заказ с оплатой
      const paymentResponse = await PaymentService.createPayment(selectedCurrency);
      
      // 2. Создаем данные о доставке и привязываем к заказу
      if (deliveryDetails && paymentResponse.orderId) {
        try {
          const deliveryData = {
            orderId: paymentResponse.orderId,
            deliveryMethod: deliveryDetails.deliveryMethod,
            deliveryType: deliveryDetails.deliveryType,
            recipientFullName: deliveryDetails.recipientFullName,
            recipientPhone: deliveryDetails.recipientPhone,
            cityRef: deliveryDetails.cityRef,
            cityName: deliveryDetails.cityName,
            warehouseRef: deliveryDetails.warehouseRef,
            warehouseAddress: deliveryDetails.warehouseAddress,
            deliveryAddress: deliveryDetails.deliveryAddress,
            deliveryCost: deliveryDetails.deliveryCost,
            additionalData: {}
          };
          
          await DeliveryService.createDelivery(deliveryData);
        } catch (deliveryError) {
          console.error('Error creating delivery:', deliveryError);
          // Продолжаем процесс, даже если доставка не создалась - она может быть добавлена позже
        }
      }

      // Редирект на страницу оплаты
      window.location.href = paymentResponse.paymentUrl;
    } catch (err) {
      console.error('Error creating payment:', err);
      
      // Более детальная информация об ошибке
      let errorMessage = 'Ошибка при создании платежа. Пожалуйста, попробуйте еще раз.';
      
      if (err.response) {
        // Сервер ответил со статусом не 2xx
        if (err.response.data && typeof err.response.data === 'string') {
          errorMessage = `Ошибка: ${err.response.data}`;
        } else if (err.response.data && err.response.data.message) {
          errorMessage = `Ошибка: ${err.response.data.message}`;
        }
      } else if (err.request) {
        // Запрос был сделан, но ответ не получен
        errorMessage = 'Не удалось получить ответ от сервера. Проверьте подключение к интернету.';
      } else {
        // Ошибка при подготовке запроса
        errorMessage = `Ошибка: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <Container className="checkout-page py-5">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Загрузка данных...</p>
        </div>
      </Container>
    );
  }

  if (cartItems.length === 0 && !loading) {
    return (
      <Container className="checkout-page py-5">
        <Card className="text-center p-5 shadow-sm">
          <Card.Body>
            <div className="fs-1 mb-3 text-muted">🛒</div>
            <h2>Ваша корзина пуста</h2>
            <p className="text-muted mb-4">Добавьте товары из каталога, чтобы оформить заказ</p>
            <Button variant="primary" href="/">Перейти к покупкам</Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="checkout-page py-5">
      <h1 className="mb-4">Оформление заказа</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {/* Шаги оформления заказа */}
      <div className="checkout-steps mb-4">
        <div className={`checkout-step ${currentStep >= 1 ? 'active' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Доставка</div>
        </div>
        <div className="step-line"></div>
        <div className={`checkout-step ${currentStep >= 2 ? 'active' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Оплата</div>
        </div>
        <div className="step-line"></div>
        <div className={`checkout-step ${currentStep >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Подтверждение</div>
        </div>
      </div>
      
      <Row>
        <Col lg={8}>
          {/* Шаг 1: Доставка */}
          {currentStep === 1 && (
            <DeliveryStep 
              onNext={handleNextStep}
              onSetDeliveryDetails={handleSetDeliveryDetails}
              initialData={deliveryDetails}
            />
          )}
          
          {/* Шаг 2: Оплата */}
          {currentStep === 2 && (
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Выберите способ оплаты</h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-4">
                  <Form.Label><strong>Выберите криптовалюту для оплаты</strong></Form.Label>
                  
                  {availableCurrencies.length === 0 ? (
                    <div className="text-center py-3">
                      <Spinner animation="border" size="sm" className="me-2" />
                      <span>Загрузка доступных валют...</span>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <div className="currency-quick-select mb-2">
                        {popularCurrencies.map(currency => (
                          availableCurrencies.includes(currency) && (
                            <Button 
                              key={currency}
                              variant={selectedCurrency === currency ? "primary" : "outline-primary"}
                              className="me-2 mb-2"
                              onClick={() => setSelectedCurrency(currency)}
                            >
                              {currency}
                            </Button>
                          )
                        ))}
                      </div>
                      <Form.Select 
                        value={selectedCurrency}
                        onChange={handleCurrencyChange}
                      >
                        <option value="">Выберите криптовалюту</option>
                        {availableCurrencies.map(currency => (
                          <option key={currency} value={currency}>
                            {currency}
                          </option>
                        ))}
                      </Form.Select>
                      
                      {selectedCurrency && (
                        <div className="mt-2">
                          <small className="text-success">
                            ✓ Выбрана валюта: <strong>{selectedCurrency}</strong>
                          </small>
                        </div>
                      )}
                    </div>
                  )}
                </Form.Group>
                
                <div className="d-flex justify-content-between mt-4">
                  <Button 
                    variant="outline-secondary" 
                    onClick={handlePrevStep}
                  >
                    Назад
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handleNextStep}
                    disabled={!selectedCurrency}
                  >
                    Продолжить
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}
          
          {/* Шаг 3: Подтверждение заказа */}
          {currentStep === 3 && (
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Подтверждение заказа</h5>
              </Card.Header>
              <Card.Body>
                {/* Информация о доставке */}
                <div className="mb-4">
                  <h6>Доставка</h6>
                  <div className="delivery-details">
                    <p className="mb-1"><strong>Способ доставки:</strong> {
                      deliveryDetails?.deliveryMethod === 'novaposhta' 
                        ? 'Новая Почта' 
                        : deliveryDetails?.deliveryMethod
                    }</p>
                    <p className="mb-1"><strong>Тип доставки:</strong> {
                      deliveryDetails?.deliveryType === 'warehouse' 
                        ? 'Отделение' 
                        : (deliveryDetails?.deliveryType === 'courier' ? 'Курьер' : deliveryDetails?.deliveryType)
                    }</p>
                    <p className="mb-1"><strong>Получатель:</strong> {deliveryDetails?.recipientFullName}</p>
                    <p className="mb-1"><strong>Телефон:</strong> {deliveryDetails?.recipientPhone}</p>
                    
                    {deliveryDetails?.deliveryMethod === 'novaposhta' && deliveryDetails?.deliveryType === 'warehouse' && (
                      <>
                        <p className="mb-1"><strong>Город:</strong> {deliveryDetails.cityName}</p>
                        <p className="mb-1"><strong>Отделение:</strong> {deliveryDetails.warehouseAddress}</p>
                      </>
                    )}
                    
                    {deliveryDetails?.deliveryType === 'courier' && (
                      <p className="mb-1"><strong>Адрес доставки:</strong> {deliveryDetails.deliveryAddress}</p>
                    )}
                    
                    <p className="mb-0"><strong>Стоимость доставки:</strong> {deliveryDetails?.deliveryCost} грн</p>
                  </div>
                </div>
                
                {/* Информация о оплате */}
                <div className="mb-4">
                  <h6>Оплата</h6>
                  <div className="payment-details">
                    <p className="mb-0"><strong>Способ оплаты:</strong> Криптовалюта ({selectedCurrency})</p>
                  </div>
                </div>
                
                {/* Список товаров */}
                <div className="mb-4">
                  <h6>Товары ({cartItems.length})</h6>
                  <div className="cart-items">
                    {cartItems.map(item => (
                      <div key={item.cartItemId} className="cart-item-summary d-flex align-items-center mb-2 p-2 border-bottom">
                        <img 
                          src={item.productImageUrl || '/placeholder-image.jpg'} 
                          alt={item.productName} 
                          className="cart-item-image me-3"
                          width="40"
                          height="40"
                        />
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between">
                            <div>
                              <p className="mb-0">{item.productName}</p>
                              <small className="text-muted">{item.quantity} x {item.price.toLocaleString()} $</small>
                            </div>
                            <div className="text-end">
                              <p className="mb-0 fw-bold">{item.totalPrice.toLocaleString()} $</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="d-flex justify-content-between mt-4">
                  <Button 
                    variant="outline-secondary" 
                    onClick={handlePrevStep}
                  >
                    Назад
                  </Button>
                  <Button 
                    variant="success" 
                    size="lg" 
                    onClick={handleCheckout}
                    disabled={processingPayment}
                  >
                    {processingPayment ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                        Обработка...
                      </>
                    ) : 'Оформить заказ'}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
        
        <Col lg={4}>
          {/* Сводка по заказу */}
          <CartSummary 
            cartItems={cartItems} 
            totalAmount={totalAmount} 
            deliveryCost={deliveryDetails?.deliveryCost || 0}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutPage;