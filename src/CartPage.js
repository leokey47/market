import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import axios from 'axios';
import './CartPage.css';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateLoading, setUpdateLoading] = useState({});
  const [totalAmount, setTotalAmount] = useState(0);
  
  // Используем явный URL бэкенда
  const API_URL = 'https://localhost:7209';

  useEffect(() => {
    fetchCartItems();
  }, []);

  useEffect(() => {
    // Calculate total amount whenever cart items change
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

      // Корректная настройка запроса
      const response = await axios({
        method: 'get',
        url: `${API_URL}/api/Cart`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Cart items response:', response.data); // Для отладки
      setCartItems(response.data);
      setError(null);
      
      // Update cart count in navbar
      localStorage.setItem('cartCount', response.data.length);
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Error fetching cart items:', err);
      setError('Ошибка при загрузке корзины. Пожалуйста, попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;

    setUpdateLoading(prev => ({ ...prev, [cartItemId]: true }));
    try {
      const token = localStorage.getItem('token');
      
      await axios({
        method: 'put',
        url: `${API_URL}/api/Cart/${cartItemId}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          quantity: newQuantity
        }
      });

      // Update local state
      setCartItems(cartItems.map(item => 
        item.cartItemId === cartItemId 
          ? { ...item, quantity: newQuantity, totalPrice: item.price * newQuantity } 
          : item
      ));
    } catch (err) {
      console.error('Error updating cart item:', err);
      setError('Ошибка при обновлении количества. Пожалуйста, попробуйте еще раз.');
    } finally {
      setUpdateLoading(prev => ({ ...prev, [cartItemId]: false }));
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios({
        method: 'delete',
        url: `${API_URL}/api/Cart/${cartItemId}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Remove item from local state
      setCartItems(cartItems.filter(item => item.cartItemId !== cartItemId));
      
      // Update cart count in navbar
      localStorage.setItem('cartCount', cartItems.length - 1);
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Error removing cart item:', err);
      setError('Ошибка при удалении товара из корзины. Пожалуйста, попробуйте еще раз.');
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Вы уверены, что хотите очистить корзину?')) return;
    
    try {
      const token = localStorage.getItem('token');
      
      await axios({
        method: 'delete',
        url: `${API_URL}/api/Cart`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Clear local state
      setCartItems([]);
      
      // Update cart count in navbar
      localStorage.setItem('cartCount', 0);
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError('Ошибка при очистке корзины. Пожалуйста, попробуйте еще раз.');
    }
  };

  const handleCheckout = () => {
    // This would be implemented to redirect to a checkout page
    alert('Переход к оформлению заказа. Эта функция будет реализована позже.');
  };

  if (loading) {
    return (
      <Container className="cart-page py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </div>
          <p className="mt-2">Загрузка корзины...</p>
        </div>
      </Container>
    );
  }

  if (error && cartItems.length === 0) {
    return (
      <Container className="cart-page py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Container className="cart-page py-5">
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
    <Container className="cart-page py-5">
      <h1 className="mb-4">Корзина</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row>
        <Col lg={8}>
          <Card className="mb-4 shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center bg-white border-bottom-0">
              <h5 className="mb-0">Товары в корзине ({cartItems.length})</h5>
              <Button 
                variant="outline-danger" 
                size="sm" 
                onClick={handleClearCart}
                disabled={cartItems.length === 0}
              >
                Очистить корзину
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {cartItems.map(item => (
                <div key={item.cartItemId} className="cart-item p-3 border-bottom">
                  <Row className="align-items-center">
                    <Col xs={12} md={2} className="mb-3 mb-md-0">
                      <img 
                        src={item.productImageUrl || '/placeholder-image.jpg'} 
                        alt={item.productName} 
                        className="img-fluid cart-item-image rounded"
                      />
                    </Col>
                    <Col xs={12} md={4} className="mb-3 mb-md-0">
                      <h5 className="cart-item-title">{item.productName}</h5>
                      <p className="text-muted small mb-0">{item.productDescription?.substring(0, 100)}
                        {item.productDescription?.length > 100 ? '...' : ''}
                      </p>
                    </Col>
                    <Col xs={6} md={2} className="mb-3 mb-md-0">
                      <div className="cart-item-price">
                        {item.price.toLocaleString()} $
                      </div>
                    </Col>
                    <Col xs={6} md={2} className="mb-3 mb-md-0">
                      <div className="quantity-control d-flex align-items-center">
                        <Button 
                          variant="outline-secondary" 
                          size="sm" 
                          onClick={() => handleQuantityChange(item.cartItemId, item.quantity - 1)}
                          disabled={item.quantity <= 1 || updateLoading[item.cartItemId]}
                        >
                          -
                        </Button>
                        <Form.Control
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.cartItemId, parseInt(e.target.value) || 1)}
                          disabled={updateLoading[item.cartItemId]}
                          className="text-center mx-2 quantity-input"
                        />
                        <Button 
                          variant="outline-secondary" 
                          size="sm" 
                          onClick={() => handleQuantityChange(item.cartItemId, item.quantity + 1)}
                          disabled={updateLoading[item.cartItemId]}
                        >
                          +
                        </Button>
                      </div>
                    </Col>
                    <Col xs={9} md={1} className="mb-2 mb-md-0">
                      <div className="cart-item-total fw-bold">
                        {item.totalPrice.toLocaleString()} $
                      </div>
                    </Col>
                    <Col xs={3} md={1} className="text-end">
                      <Button 
                        variant="link" 
                        className="text-danger p-0" 
                        onClick={() => handleRemoveItem(item.cartItemId)}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </Col>
                  </Row>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white border-bottom-0">
              <h5 className="mb-0">Итого заказа</h5>
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
              <Button 
                variant="primary" 
                size="lg" 
                block 
                className="w-100" 
                onClick={handleCheckout}
              >
                Оформить заказ
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CartPage;