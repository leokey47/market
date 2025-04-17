import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import './PaymentPage.css';

const PaymentCancelPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const orderId = queryParams.get('orderId');
  
  const handleReturnToCheckout = () => {
    navigate('/checkout');
  };
  
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
          <div className="cancel-icon mb-4">
            <i className="bi bi-exclamation-circle-fill text-warning fs-1"></i>
          </div>
          <h2>Оплата не завершена</h2>
          <p className="text-muted mb-4">
            Процесс оплаты был прерван или отменен.
            {orderId && <span> Номер заказа: <strong>{orderId}</strong></span>}
          </p>
          <div className="d-flex justify-content-center flex-wrap">
            <Button 
              variant="primary" 
              onClick={handleReturnToCheckout} 
              className="me-2 mb-2"
            >
              <i className="bi bi-credit-card me-2"></i>
              Вернуться к оплате
            </Button>
            {orderId && (
              <Button 
                variant="outline-primary" 
                onClick={handleViewOrder} 
                className="me-2 mb-2"
              >
                <i className="bi bi-eye me-2"></i>
                Просмотреть заказ
              </Button>
            )}
            <Button 
              variant="outline-secondary" 
              onClick={handleReturnToShop}
              className="mb-2"
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

export default PaymentCancelPage;