import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './OrderStatusPage.css';

const OrderStatusPage = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  // Используем явный URL бэкенда
  const API_URL = 'https://localhost:7209';

  // Use useCallback to prevent recreation of this function on each render
  const fetchOrderStatus = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Необходимо войти в систему');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await axios({
        method: 'get',
        url: `${API_URL}/api/Payment/check/${orderId}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setOrder(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching order status:', err);
      setError('Ошибка при загрузке данных заказа. Пожалуйста, попробуйте еще раз.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId, API_URL]);

  useEffect(() => {
    // Initial fetch
    fetchOrderStatus();
    
    // Auto-refresh setup for pending orders
    let intervalId = null;
    
    // Only set up interval if we have an order and it's in a pending state
    if (order && isPendingOrder(order.status)) {
      intervalId = setInterval(() => {
        fetchOrderStatus(false);
      }, 30000);
    }
    
    // Clean up interval on unmount or when order status changes
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchOrderStatus, order?.status]);

  const isPendingOrder = (status) => {
    const pendingStatuses = ['pending', 'confirming', 'partially paid', 'waiting'];
    return pendingStatuses.includes(status?.toLowerCase());
  };

  const handleRefresh = () => {
    fetchOrderStatus(false);
  };

  const handleReturnToShop = () => {
    navigate('/');
  };

  const handleRetryPayment = () => {
    if (order && order.paymentUrl) {
      window.open(order.paymentUrl, '_blank');
    }
  };

  const renderStatusBadge = (status) => {
    let variant = 'secondary';
    let statusText = status || 'Неизвестно';
    
    switch (status?.toLowerCase()) {
      case 'completed':
        variant = 'success';
        statusText = 'Оплачен';
        break;
      case 'pending':
        variant = 'warning';
        statusText = 'Ожидает оплаты';
        break;
      case 'confirming':
        variant = 'info';
        statusText = 'Подтверждается';
        break;
      case 'partially paid':
        variant = 'primary';
        statusText = 'Частично оплачен';
        break;
      case 'waiting':
        variant = 'warning';
        statusText = 'Ожидает оплаты';
        break;
      case 'expired':
        variant = 'danger';
        statusText = 'Истек срок';
        break;
      case 'failed':
        variant = 'danger';
        statusText = 'Ошибка оплаты';
        break;
      default:
        statusText = status || 'Неизвестно';
        break;
    }
    
    return <Badge bg={variant}>{statusText}</Badge>;
  };

  if (loading && !order) {
    return (
      <Container className="order-status-page py-5">
        <div className="text-center loading-container">
          <Spinner animation="border" role="status" className="main-spinner">
            <span className="visually-hidden">Загрузка...</span>
          </Spinner>
          <p className="mt-2">Загрузка информации о заказе...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="order-status-page py-5">
      <h1 className="mb-4">Статус заказа #{orderId}</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {order && (
        <Card className="order-card shadow-sm">
          <Card.Header className="bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Информация о заказе</h5>
              <div>
                {refreshing ? (
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    disabled
                    className="refresh-button"
                  >
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" />
                    Обновление...
                  </Button>
                ) : (
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    onClick={handleRefresh}
                    className="refresh-button"
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Обновить
                  </Button>
                )}
              </div>
            </div>
          </Card.Header>
          <Card.Body>
            <Row className="mb-4">
              <Col md={6} className="order-details">
                <h6 className="details-title">Детали заказа</h6>
                <div className="detail-item">
                  <strong>Заказ №:</strong> <span className="order-id">{order.orderId}</span>
                </div>
                <div className="detail-item">
                  <strong>Дата создания:</strong> {new Date(order.createdAt).toLocaleString()}
                </div>
                <div className="detail-item">
                  <strong>Статус:</strong> {renderStatusBadge(order.status)}
                </div>
                {order.completedAt && (
                  <div className="detail-item">
                    <strong>Дата завершения:</strong> {new Date(order.completedAt).toLocaleString()}
                  </div>
                )}
              </Col>
              <Col md={6} className="payment-details">
                <h6 className="details-title">Детали оплаты</h6>
                <div className="detail-item">
                  <strong>Сумма:</strong> <span className="order-amount">{order.total.toLocaleString()} $</span>
                </div>
                <div className="detail-item">
                  <strong>Валюта оплаты:</strong> <span className="order-currency">{order.currency}</span>
                </div>
                <div className="detail-item">
                  <strong>ID платежа:</strong> <span className="payment-id">{order.paymentId || 'Не присвоен'}</span>
                </div>
              </Col>
            </Row>
            
            <div className="text-center action-container mb-3">
              {isPendingOrder(order.status) && (
                <div className="mb-3">
                  <Alert variant="info" className="status-alert pending-alert">
                    <i className="bi bi-info-circle me-2"></i>
                    Статус вашего платежа обновляется автоматически. Вы также можете обновить страницу вручную.
                  </Alert>
                  {order.paymentUrl && (
                    <Button 
                      variant="primary" 
                      onClick={handleRetryPayment} 
                      className="action-button payment-button me-2"
                    >
                      <i className="bi bi-currency-bitcoin me-1"></i>
                      Продолжить оплату
                    </Button>
                  )}
                </div>
              )}
              
              {['expired', 'failed'].includes(order.status?.toLowerCase()) && (
                <Alert variant="warning" className="status-alert failed-alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Возникла проблема с вашим платежом. Вы можете повторить попытку оплаты или связаться с поддержкой.
                </Alert>
              )}
              
              {order.status?.toLowerCase() === 'completed' && (
                <Alert variant="success" className="status-alert success-alert">
                  <i className="bi bi-check-circle me-2"></i>
                  Ваш заказ успешно оплачен! Благодарим за покупку.
                </Alert>
              )}
              
              <Button 
                variant="outline-secondary" 
                onClick={handleReturnToShop}
                className="action-button return-button"
              >
                <i className="bi bi-shop me-1"></i>
                Вернуться в магазин
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default OrderStatusPage;