import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Table, Alert, Spinner, Modal, Form, Nav } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { PaymentService, TokenUtils } from './ApiService';
import WriteReview from './WriteReview';
import './OrdersPage.css';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loadingOrderItems, setLoadingOrderItems] = useState(false);
  
  const [activeTab, setActiveTab] = useState('all');
  
  const navigate = useNavigate();
  
  // Use explicit backend URL
  const API_URL = 'https://localhost:7209';

  useEffect(() => {
    fetchOrders();
    
    // Check login status
    if (!TokenUtils.isTokenValid()) {
      navigate('/login?redirect=/orders');
    }
  }, [navigate]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Необходимо войти в систему');
        setLoading(false);
        return;
      }

      console.log('Fetching orders with token');
      
      // Use the service to fetch orders
      const ordersData = await PaymentService.getUserOrders();
      
      console.log('Processed orders data:', ordersData);
      setOrders(ordersData);
    } catch (err) {
      console.error('Error fetching orders:', err);
      
      let errorMessage = 'Ошибка при загрузке заказов';
      
      if (err.response) {
        if (err.response.status === 500) {
          errorMessage = 'Произошла ошибка на сервере при попытке получить заказы';
        } else if (err.response.status === 401) {
          errorMessage = 'Ваша сессия истекла. Пожалуйста, войдите в систему снова';
          // Optional: Redirect to login
          navigate('/login?redirect=/orders');
        } else {
          errorMessage = `Ошибка при загрузке заказов: ${err.response.data?.message || 'Неизвестная ошибка'}`;
        }
      } else if (err.request) {
        errorMessage = 'Не удалось получить ответ от сервера. Проверьте подключение к интернету';
      } else {
        errorMessage = `Ошибка при создании запроса: ${err.message}`;
      }
      
      setError(errorMessage);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };
const handleTestCompleteOrder = async (orderId) => {
  try {
    await PaymentService.testCompleteOrder(orderId);
    
    // Обновляем список заказов
    await fetchOrders();
    
    alert('Заказ помечен как завершенный для тестирования');
  } catch (error) {
    console.error('Error test completing order:', error);
    alert('Ошибка при завершении заказа: ' + (error.response?.data?.message || error.message));
  }
};  
  const handleViewOrderDetails = async (orderId) => {
  try {
    setLoadingOrderItems(true);
    
    // Используем новый метод из PaymentService
    const orderItemsData = await PaymentService.getOrderItems(orderId);
    
    setOrderItems(orderItemsData);
    const order = orders.find(o => o.orderId === orderId);
    setSelectedOrder(order);
    setShowOrderDetails(true);
  } catch (error) {
    console.error('Error fetching order items:', error);
    alert('Не удалось загрузить детали заказа: ' + (error.response?.data?.message || error.message));
  } finally {
    setLoadingOrderItems(false);
  }
};

  const handleContinuePayment = (paymentUrl) => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
    } else {
      alert('Ссылка для оплаты отсутствует');
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
  
  const isPendingOrder = (status) => {
    const pendingStatuses = ['pending', 'confirming', 'partially paid', 'waiting', null, ''];
    return pendingStatuses.includes(status?.toLowerCase());
  };
  
  const isCompletedOrder = (status) => {
    return status?.toLowerCase() === 'completed';
  };

  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'pending':
        return orders.filter(order => isPendingOrder(order.status));
      case 'completed':
        return orders.filter(order => isCompletedOrder(order.status));
      case 'all':
      default:
        return orders;
    }
  };

  const handleReviewSubmitted = () => {
    // Refresh order details to show updated review status
    if (selectedOrder) {
      handleViewOrderDetails(selectedOrder.orderId);
    }
  };

  if (loading) {
    return (
      <Container className="orders-page py-5">
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </Spinner>
          <p className="mt-4 text-muted">Загрузка списка заказов...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="orders-page py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="orders-title">Мои заказы</h1>
        <Button variant="primary" as={Link} to="/">Продолжить покупки</Button>
      </div>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>Ошибка загрузки данных</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex justify-content-end">
            <Button 
              variant="outline-danger" 
              onClick={fetchOrders}
              disabled={loading}
            >
              {loading ? 'Загрузка...' : 'Попробовать снова'}
            </Button>
          </div>
        </Alert>
      )}
      
      {orders.length === 0 && !error ? (
        <Card className="text-center p-5 shadow-sm empty-orders-card">
          <Card.Body>
            <div className="empty-orders-icon mb-3">
              <i className="bi bi-receipt fs-1 text-muted"></i>
            </div>
            <h2>У вас пока нет заказов</h2>
            <p className="text-muted mb-4">Сделайте свой первый заказ в нашем магазине</p>
            <Button variant="primary" as={Link} to="/">Перейти к покупкам</Button>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white">
              <Nav variant="tabs" activeKey={activeTab} onSelect={setActiveTab}>
                <Nav.Item>
                  <Nav.Link eventKey="all">
                    Все заказы
                    <Badge bg="secondary" className="ms-2">
                      {orders.length}
                    </Badge>
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="pending">
                    Ожидают оплаты
                    <Badge bg="warning" className="ms-2">
                      {orders.filter(order => isPendingOrder(order.status)).length}
                    </Badge>
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="completed">
                    Оплаченные
                    <Badge bg="success" className="ms-2">
                      {orders.filter(order => isCompletedOrder(order.status)).length}
                    </Badge>
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover className="mb-0 order-table">
                  <thead>
                    <tr>
                      <th>№ заказа</th>
                      <th>Дата</th>
                      <th>Сумма</th>
                      <th>Валюта</th>
                      <th>Статус</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredOrders().map(order => (
                      <tr 
                        key={order.orderId}
                        className={`order-row ${isPendingOrder(order.status) ? 'order-pending' : ''} 
                                   ${isCompletedOrder(order.status) ? 'order-completed' : ''}`}
                      >
                        <td><span className="order-id">#{order.orderId}</span></td>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td><span className="order-price">${order.total.toFixed(2)}</span></td>
                        <td>{order.currency || 'USD'}</td>
                        <td>{renderStatusBadge(order.status)}</td>
                        <td className="order-actions">
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            onClick={() => handleViewOrderDetails(order.orderId)}
                            className="me-2 action-btn view-btn"
                            title="Просмотр заказа"
                          >
                            <i className="bi bi-eye"></i> Детали
                          </Button>
                          
                          {isPendingOrder(order.status) && order.paymentUrl && (
                            <Button 
                              variant="success" 
                              size="sm" 
                              onClick={() => handleContinuePayment(order.paymentUrl)}
                              className="action-btn pay-btn"
                              title="Продолжить оплату"
                            >
                              <i className="bi bi-credit-card"></i> Оплатить
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </>
      )}

      {/* Order Details Modal */}
      <Modal 
        show={showOrderDetails} 
        onHide={() => setShowOrderDetails(false)}
        size="lg"
        dialogClassName="order-detail-modal"
      >
        <Modal.Header closeButton className="order-modal-header">
          <Modal.Title>
            Заказ #{selectedOrder?.orderId} 
            <span className="ms-3">
              {renderStatusBadge(selectedOrder?.status)}
            </span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="order-modal-body">
          {loadingOrderItems ? (
            <div className="text-center p-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Загрузка...</span>
              </Spinner>
              <p className="mt-3">Загрузка информации о товарах...</p>
            </div>
          ) : (
            <>
              <div className="order-info-section">
                <h5 className="section-title">Информация о заказе</h5>
                <div className="order-info-grid">
                  <div className="info-item">
                    <div className="info-label">Дата заказа</div>
                    <div className="info-value">{selectedOrder && new Date(selectedOrder.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Статус</div>
                    <div className="info-value">{renderStatusBadge(selectedOrder?.status)}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Сумма</div>
                    <div className="info-value price">${selectedOrder?.total.toFixed(2)}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Валюта оплаты</div>
                    <div className="info-value">{selectedOrder?.currency || 'USD'}</div>
                  </div>
                  
                  {selectedOrder?.completedAt && (
                    <div className="info-item">
                      <div className="info-label">Дата оплаты</div>
                      <div className="info-value completed-date">{new Date(selectedOrder.completedAt).toLocaleString()}</div>
                    </div>
                  )}
                  
                  {selectedOrder?.paymentId && (
                    <div className="info-item">
                      <div className="info-label">ID платежа</div>
                      <div className="info-value payment-id">{selectedOrder.paymentId}</div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="order-items-section">
                <h5 className="section-title">Товары в заказе ({orderItems.length})</h5>
                {orderItems.length === 0 ? (
                  <Alert variant="info">Информация о товарах не найдена</Alert>
                ) : (
                  <div className="order-items-list">
                    {orderItems.map(item => (
                      <OrderProductItem 
                        key={item.orderItemId}
                        product={item}
                        order={selectedOrder}
                        onReviewSubmitted={handleReviewSubmitted}
                        isCompleted={isCompletedOrder(selectedOrder?.status)}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              <div className="order-summary-section">
                <div className="d-flex justify-content-between">
                  <span>Товаров:</span>
                  <span>{orderItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="d-flex justify-content-between fw-bold total-row">
                  <span>Итого:</span>
                  <span>${selectedOrder?.total.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="order-modal-footer">
          <Button variant="secondary" onClick={() => setShowOrderDetails(false)}>
            Закрыть
          </Button>
          {isPendingOrder(selectedOrder?.status) && selectedOrder?.paymentUrl && (
            <Button 
              variant="success" 
              onClick={() => handleContinuePayment(selectedOrder.paymentUrl)}
            >
              <i className="bi bi-credit-card me-2"></i>
              Продолжить оплату
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

// Component for displaying each order product item
const OrderProductItem = ({ product, order, onReviewSubmitted, isCompleted }) => {
  const navigate = useNavigate();
  
  return (
    <div className="order-product-item">
      <div className="order-product-image" onClick={() => navigate(`/product/${product.productId}`)}>
        <img 
          src={product.productImageUrl} 
          alt={product.productName} 
        />
      </div>
      <div className="order-product-details">
        <h5 className="product-name" onClick={() => navigate(`/product/${product.productId}`)}>
          {product.productName}
        </h5>
        <div className="product-meta">
          <span className="product-price">${product.price.toFixed(2)}</span>
          <span className="product-quantity">× {product.quantity}</span>
          <span className="product-total">${(product.price * product.quantity).toFixed(2)}</span>
        </div>
      </div>
      <div className="order-product-actions">
        <Button 
          variant="outline-secondary" 
          size="sm"
          className="me-2 view-product-btn"
          onClick={() => navigate(`/product/${product.productId}`)}
        >
          <i className="bi bi-box-arrow-up-right me-1"></i> К товару
        </Button>
        
        {isCompleted && (
          <WriteReview 
            productId={product.productId}
            productName={product.productName}
            onReviewSubmitted={onReviewSubmitted}
          />
        )}
      </div>
    </div>
  );
};

export default OrdersPage;