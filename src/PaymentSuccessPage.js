import React, { useEffect } from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import './PaymentPage.css';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const orderId = queryParams.get('orderId');
  
  useEffect(() => {
    // Можно добавить логику для обновления интерфейса при успешной оплате
    // Например, обновить счетчик корзины, статус заказа и т.д.
    const updateCartCount = () => {
      localStorage.setItem('cartCount', '0');
      window.dispatchEvent(new Event('cartUpdate'));
    };
    
    updateCartCount();
  }, []);
  
  const handleViewOrder = () => {
    if (orderId) {
      navigate(`/orders/${orderId}`);
    } else {
      navigate('/orders');
    }
  };
  
  const handleReturnToShop = () => {
    navigate('/');
  };

  return (
    <Container className="payment-page py-5">
      <Card className="text-center p-5 shadow-sm">
        <Card.Body>
          <div className="success-icon mb-4">
            <i className="bi bi-check-circle-fill text-success fs-1"></i>
          </div>
          <h2>Оплата успешно выполнена!</h2>
          <p className="text-muted mb-4">
            Ваш заказ был успешно оплачен и принят в обработку.
            {orderId && <span> Номер заказа: <strong>{orderId}</strong></span>}
          </p>
          <div className="d-flex justify-content-center">
            <Button 
              variant="primary" 
              onClick={handleViewOrder} 
              className="me-2"
            >
              <i className="bi bi-list-ul me-2"></i>
              Просмотреть мои заказы
            </Button>
            <Button 
              variant="outline-secondary" 
              onClick={handleReturnToShop}
            >
              <i className="bi bi-shop me-2"></i>
              Вернуться в магазин
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PaymentSuccessPage;