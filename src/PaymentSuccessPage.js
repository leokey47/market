import React, { useState, useEffect } from 'react';
import { Container, Card, Alert, Button, Row, Col, Spinner } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PaymentService } from './ApiService';
import PaymentSimulator from './PaymentSimulator';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const orderId = searchParams.get('orderId');
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (orderId) {
      checkOrderStatus();
      
      // Проверяем статус каждые 5 секунд
      const intervalId = setInterval(checkOrderStatus, 5000);
      
      // Очищаем интервал при размонтировании
      return () => clearInterval(intervalId);
    } else {
      setError('Order ID not found');
      setLoading(false);
    }
  }, [orderId]);

  const checkOrderStatus = async () => {
    try {
      const response = await PaymentService.checkOrderStatus(orderId);
      setOrderData(response);
      
      // Если статус завершен, прекращаем проверку
      if (response.status === 'Completed' || response.status === 'Failed') {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error checking order status:', err);
      setError('Failed to load order information');
      setLoading(false);
    }
  };

  const handleSimulationComplete = () => {
    checkOrderStatus();
  };

  if (loading && !orderData) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Checking payment status...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={() => navigate('/')}>
          Return to Home
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card>
            <Card.Header as="h4" className="bg-success text-white">
              <i className="bi bi-check-circle-fill me-2"></i>
              Payment Processing
            </Card.Header>
            <Card.Body>
              {orderData && (
                <>
                  <Alert variant={
                    orderData.status === 'Completed' ? 'success' : 
                    orderData.status === 'Failed' ? 'danger' : 
                    'info'
                  }>
                    <h5>Order Status: {orderData.status}</h5>
                    <p className="mb-0">Order ID: {orderData.orderId}</p>
                  </Alert>

                  <div className="order-details">
                    <h5>Order Details</h5>
                    <Row>
                      <Col md={6}>
                        <p><strong>Total Amount:</strong> ${orderData.total}</p>
                        <p><strong>Currency:</strong> {orderData.currency}</p>
                      </Col>
                      <Col md={6}>
                        <p><strong>Created:</strong> {new Date(orderData.createdAt).toLocaleString()}</p>
                        {orderData.completedAt && (
                          <p><strong>Completed:</strong> {new Date(orderData.completedAt).toLocaleString()}</p>
                        )}
                      </Col>
                    </Row>
                  </div>

                  {orderData.status === 'Pending' && (
                    <Alert variant="warning">
                      <i className="bi bi-clock-history me-2"></i>
                      Your payment is being processed. Please wait...
                    </Alert>
                  )}

                  {orderData.status === 'Completed' && (
                    <div className="mt-4">
                      <h5>Thank you for your purchase!</h5>
                      <p>Your order has been confirmed and will be processed soon.</p>
                      <Button 
                        variant="primary" 
                        onClick={() => navigate('/profile/orders')}
                        className="me-2"
                      >
                        View My Orders
                      </Button>
                      <Button 
                        variant="outline-primary" 
                        onClick={() => navigate('/')}
                      >
                        Continue Shopping
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>

          {/* Симулятор оплаты для разработки */}
          {isDevelopment && orderData && orderData.status !== 'Completed' && (
            <div className="mt-4">
              <PaymentSimulator 
                orderId={orderId} 
                onComplete={handleSimulationComplete}
              />
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default PaymentSuccessPage;