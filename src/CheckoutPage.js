import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, ListGroup } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
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
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Необходимо войти в систему');
        setLoading(false);
        return;
      }

      const response = await axios({
        method: 'get',
        url: `${API_URL}/api/Cart`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setCartItems(response.data);
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
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios({
        method: 'get',
        url: `${API_URL}/api/Payment/currencies`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && Array.isArray(response.data)) {
        setAvailableCurrencies(response.data);
        // Set default selected currency
        if (response.data.includes('BTC')) {
          setSelectedCurrency('BTC');
        } else if (response.data.length > 0) {
          setSelectedCurrency(response.data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching available currencies:', err);
    }
  };

  const handleCurrencyChange = (e) => {
    setSelectedCurrency(e.target.value);
  };

  const handleCheckout = async () => {
    if (!selectedCurrency) {
      setError('Пожалуйста, выберите валюту для оплаты');
      return;
    }

    setProcessingPayment(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Необходимо войти в систему');
        setProcessingPayment(false);
        return;
      }

      const response = await axios({
        method: 'post',
        url: `${API_URL}/api/Payment/create`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          currency: selectedCurrency
        }
      });

      // Redirect to NOWPayments invoice page
      window.location.href = response.data.paymentUrl;
    } catch (err) {
      console.error('Error creating payment:', err);
      
      // Более детальная информация об ошибке
      let errorMessage = 'Ошибка при создании платежа. Пожалуйста, попробуйте еще раз.';
      
      if (err.response) {
        // Сервер ответил со статусом не 2xx
        console.error('Server response data:', err.response.data);
        console.error('Server response status:', err.response.status);
        console.error('Server response headers:', err.response.headers);
        
        if (err.response.data && typeof err.response.data === 'string') {
          errorMessage = `Ошибка: ${err.response.data}`;
        } else if (err.response.data && err.response.data.message) {
          errorMessage = `Ошибка: ${err.response.data.message}`;
        }
      } else if (err.request) {
        // Запрос был сделан, но ответ не получен
        console.error('Request without response:', err.request);
        errorMessage = 'Не удалось получить ответ от сервера. Проверьте подключение к интернету.';
      } else {
        // Ошибка при подготовке запроса
        console.error('Error message:', err.message);
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
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </Spinner>
          <p className="mt-2">Загрузка данных...</p>
        </div>
      </Container>
    );
  }

  if (cartItems.length === 0 && !loading) {
    return (
      <Container className="checkout-page py-5">
        <Card className="text-center p-5 shadow-sm">
          <Card.Body>
            <i className="bi bi-cart fs-1 mb-3 text-muted"></i>
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
      
      <Row>
        <Col lg={8}>
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-white border-bottom-0">
              <h5 className="mb-0">Товары в корзине ({cartItems.length})</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <ListGroup variant="flush">
                {cartItems.map(item => (
                  <ListGroup.Item key={item.cartItemId} className="p-3">
                    <Row className="align-items-center">
                      <Col xs={2} md={1}>
                        <img 
                          src={item.productImageUrl || '/placeholder-image.jpg'} 
                          alt={item.productName} 
                          className="img-fluid rounded checkout-item-image"
                        />
                      </Col>
                      <Col xs={10} md={5}>
                        <h6 className="mb-0">{item.productName}</h6>
                        <small className="text-muted">{item.quantity} x {item.price.toLocaleString()} $</small>
                      </Col>
                      <Col xs={12} md={3} className="text-md-end mt-2 mt-md-0">
                        <span className="fw-bold">{item.totalPrice.toLocaleString()} $</span>
                      </Col>
                    </Row>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white border-bottom-0">
              <h5 className="mb-0">Оплата заказа</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-3">
                <span>Товаров ({cartItems.length}):</span>
                <span>{totalAmount.toLocaleString()} $</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span>Доставка:</span>
                <span>Бесплатно</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-4 fw-bold">
                <span>Итого:</span>
                <span className="fs-5">{totalAmount.toLocaleString()} $</span>
              </div>
              
              <Form.Group className="mb-4">
                <Form.Label><strong>Выберите криптовалюту для оплаты</strong></Form.Label>
                <div className="mb-3">
                  <div className="d-flex flex-wrap currency-quick-select mb-2">
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
                </div>
              </Form.Group>
              
              <Button 
                variant="primary" 
                size="lg" 
                block 
                className="w-100" 
                onClick={handleCheckout}
                disabled={processingPayment || !selectedCurrency}
              >
                {processingPayment ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    Обработка...
                  </>
                ) : 'Оплатить заказ'}
              </Button>
              
              <div className="mt-3 text-center">
                <small className="text-muted">
                  Нажимая кнопку "Оплатить заказ", вы будете перенаправлены на страницу оплаты NOWPayments для завершения транзакции.
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutPage;