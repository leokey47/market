import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Table, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './OrdersPage.css';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [rawResponse, setRawResponse] = useState(null);
  
  const navigate = useNavigate();
  
  // Use explicit backend URL
  const API_URL = 'https://localhost:7209';

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    setDebugInfo(null);
    setRawResponse(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Необходимо войти в систему');
        setLoading(false);
        return;
      }

      console.log('Fetching orders with token:', token.substring(0, 15) + '...');
      
      const response = await axios({
        method: 'get',
        url: `${API_URL}/api/Payment/orders`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Save the raw response for debugging
      setRawResponse(JSON.stringify(response.data, null, 2));
      console.log('Orders raw response:', response.data);
      
      // Better handling of response data
      let ordersData = response.data;
      
      // Handle both array and object responses
      if (!Array.isArray(ordersData)) {
        console.warn('Response is not an array - examining structure');
        
        // If response.data is the object with a value property that contains our array
        if (ordersData && ordersData.value && Array.isArray(ordersData.value)) {
          ordersData = ordersData.value;
          console.log('Found array in response.data.value');
        } 
        // If it's some other kind of object, try to find any arrays
        else if (ordersData && typeof ordersData === 'object') {
          const possibleArrayFields = Object.values(ordersData).filter(Array.isArray);
          if (possibleArrayFields.length > 0) {
            ordersData = possibleArrayFields[0];
            console.log('Extracted array from response:', ordersData);
          } else if (Object.keys(ordersData).length === 0) {
            // Empty object - treat as empty array
            ordersData = [];
            console.log('Response is an empty object, using empty array');
          } else if (!Array.isArray(ordersData)) {
            // Single object - wrap in array
            ordersData = [ordersData];
            console.log('Response is a single object, wrapping in array');
          } else {
            // Couldn't find an array - use empty array
            ordersData = [];
            console.warn('Could not extract array data from response');
          }
        }
      }

      // Ensure the required fields exist on all order objects
      ordersData = ordersData.map(order => ({
        orderId: order.orderId || 0,
        status: order.status || 'Неизвестно',
        total: typeof order.total === 'number' ? order.total : 0,
        currency: order.currency || '',
        createdAt: order.createdAt || new Date().toISOString(),
        completedAt: order.completedAt,
        paymentId: order.paymentId || '',
        paymentUrl: order.paymentUrl || ''
      }));

      console.log('Processed orders data:', ordersData);
      setOrders(ordersData);
    } catch (err) {
      console.error('Error fetching orders:', err);
      
      // Save detailed error information for debugging
      let errorDetails = '';
      if (err.response) {
        // Request was made and server responded with non-2xx status
        errorDetails = `Status: ${err.response.status}, Data: ${JSON.stringify(err.response.data)}`;
        setDebugInfo(errorDetails);
        
        if (err.response.status === 500) {
          setError('Произошла ошибка на сервере при попытке получить заказы. Проверьте логи сервера для получения дополнительной информации.');
        } else if (err.response.status === 401) {
          setError('Ваша сессия истекла. Пожалуйста, войдите в систему снова.');
          // Optional: Redirect to login
          // navigate('/login');
        } else {
          setError(`Ошибка при загрузке заказов: ${err.response.data?.message || err.response.data || 'Неизвестная ошибка'}`);
        }
      } else if (err.request) {
        // Request was made but no response received
        errorDetails = 'Сервер не ответил на запрос. Возможно, сервер не запущен или URL неверный.';
        setDebugInfo(errorDetails);
        setError('Не удалось получить ответ от сервера. Проверьте подключение к интернету и работоспособность сервера.');
      } else {
        // Error setting up the request
        errorDetails = err.message;
        setDebugInfo(errorDetails);
        setError(`Ошибка при создании запроса: ${err.message}`);
      }
      
      // Do not use mock data in production - just set an empty array
      setOrders([]);
      
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (orderId) => {
    navigate(`/orders/${orderId}`);
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

  if (loading) {
    return (
      <Container className="orders-page py-5">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </Spinner>
          <p className="mt-2">Загрузка списка заказов...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="orders-page py-5">
      <h1 className="mb-4">Мои заказы</h1>
      
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
      
      {/* Enhanced debugging information */}
      {(debugInfo || rawResponse) && (
        <Alert variant="secondary" className="mb-4">
          <Alert.Heading>
            Отладочная информация
            <Button 
              variant="outline-secondary" 
              size="sm" 
              className="ms-2"
              onClick={() => {setDebugInfo(null); setRawResponse(null);}}
            >
              Скрыть
            </Button>
          </Alert.Heading>
          {debugInfo && (
            <>
              <h6>Ошибка:</h6>
              <pre className="mb-3">{debugInfo}</pre>
            </>
          )}
          {rawResponse && (
            <>
              <h6>Сырой ответ от сервера:</h6>
              <pre className="mb-0">{rawResponse}</pre>
            </>
          )}
        </Alert>
      )}
      
      {orders.length === 0 && !error ? (
        <Card className="text-center p-5 shadow-sm">
          <Card.Body>
            <i className="bi bi-receipt fs-1 mb-3 text-muted"></i>
            <h2>У вас пока нет заказов</h2>
            <p className="text-muted mb-4">Сделайте свой первый заказ в нашем магазине</p>
            <Button variant="primary" href="/">Перейти к покупкам</Button>
          </Card.Body>
        </Card>
      ) : (
        <>
          {/* Pending payment orders */}
          {orders.some(order => isPendingOrder(order.status) && order.paymentUrl) && (
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Заказы, ожидающие оплаты</h5>
                <Badge bg="warning" className="fs-6">
                  {orders.filter(order => isPendingOrder(order.status) && order.paymentUrl).length}
                </Badge>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table hover className="mb-0">
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
                      {orders
                        .filter(order => isPendingOrder(order.status) && order.paymentUrl)
                        .map(order => (
                          <tr key={order.orderId} className="table-warning bg-opacity-25">
                            <td>{order.orderId}</td>
                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td>{order.total.toLocaleString()} $</td>
                            <td>{order.currency}</td>
                            <td>{renderStatusBadge(order.status)}</td>
                            <td>
                              <Button 
                                variant="outline-secondary" 
                                size="sm" 
                                onClick={() => handleViewOrder(order.orderId)}
                                className="me-1"
                                title="Просмотр заказа"
                              >
                                <i className="bi bi-eye"></i>
                              </Button>
                              
                              <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={() => handleContinuePayment(order.paymentUrl)}
                                title="Продолжить оплату"
                              >
                                <i className="bi bi-credit-card me-1"></i>
                                Оплатить
                              </Button>
                            </td>
                          </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* All orders */}
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">История всех заказов</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover className="mb-0">
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
                    {orders.map(order => (
                      <tr 
                        key={order.orderId}
                        className={isPendingOrder(order.status) ? 'table-warning bg-opacity-25' : ''}
                      >
                        <td>{order.orderId}</td>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td>{order.total.toLocaleString()} $</td>
                        <td>{order.currency}</td>
                        <td>{renderStatusBadge(order.status)}</td>
                        <td>
                          <Button 
                            variant="outline-secondary" 
                            size="sm" 
                            onClick={() => handleViewOrder(order.orderId)}
                            className="me-1"
                            title="Просмотр заказа"
                          >
                            <i className="bi bi-eye"></i>
                          </Button>
                          
                          {isPendingOrder(order.status) && order.paymentUrl && (
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => handleContinuePayment(order.paymentUrl)}
                              title="Продолжить оплату"
                            >
                              <i className="bi bi-credit-card"></i>
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
    </Container>
  );
};

export default OrdersPage;