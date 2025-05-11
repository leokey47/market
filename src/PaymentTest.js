import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Nav, Tab, Table, Badge } from 'react-bootstrap';
import PaymentSimulator from './PaymentSimulator';
import TestPayment from './PaymentTest';
import { PaymentService } from './ApiService';
import './PaymentTestPage.css';

const PaymentTest = () => {
  const [orderId, setOrderId] = useState('');
  const [activeTab, setActiveTab] = useState('simulator');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState('BTC');

  useEffect(() => {
    fetchRecentOrders();
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const response = await PaymentService.getAvailableCurrencies();
      setCurrencies(response);
      if (response.includes('BTC')) {
        setSelectedCurrency('BTC');
      } else if (response.length > 0) {
        setSelectedCurrency(response[0]);
      }
    } catch (err) {
      console.error('Error fetching currencies:', err);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      setLoading(true);
      const response = await PaymentService.getUserOrders();
      // Сортируем по дате создания и берем последние 10
      const sortedOrders = response.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setOrders(sortedOrders.slice(0, 10));
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load recent orders');
    } finally {
      setLoading(false);
    }
  };

  const createTestOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Создаем тестовый заказ
      const response = await PaymentService.createPayment(selectedCurrency);
      setOrderId(response.orderId.toString());
      setSuccess(`Test order created: Order ID ${response.orderId}`);
      
      // Обновляем список заказов
      fetchRecentOrders();
    } catch (err) {
      console.error('Error creating test order:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
      setError(`Failed to create test order: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (orderIdToDelete) => {
    try {
      await PaymentService.deleteOrder(orderIdToDelete);
      setSuccess(`Order ${orderIdToDelete} deleted successfully`);
      fetchRecentOrders();
    } catch (err) {
      console.error('Error deleting order:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
      setError(`Failed to delete order: ${errorMessage}`);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'Pending': { variant: 'warning', icon: 'clock' },
      'Waiting': { variant: 'info', icon: 'hourglass-split' },
      'Confirming': { variant: 'info', icon: 'arrow-repeat' },
      'Confirmed': { variant: 'primary', icon: 'check-circle' },
      'Completed': { variant: 'success', icon: 'check-circle-fill' },
      'Failed': { variant: 'danger', icon: 'x-circle' },
      'Expired': { variant: 'secondary', icon: 'clock-history' },
      'Cancelled': { variant: 'danger', icon: 'x-lg' },
      'Refunded': { variant: 'warning', icon: 'arrow-counterclockwise' }
    };
    
    const config = statusMap[status] || { variant: 'secondary', icon: 'question' };
    
    return (
      <Badge bg={config.variant}>
        <i className={`bi bi-${config.icon} me-1`}></i>
        {status}
      </Badge>
    );
  };

  const canDeleteOrder = (status) => {
    return ['Failed', 'Expired', 'Cancelled'].includes(status);
  };

  return (
    <Container className="py-5">
      {/* Header */}
      <div className="mb-4">
        <h1>
          <i className="bi bi-flask me-2"></i>
          Payment Testing Tools
        </h1>
        <p className="text-muted">Development tools for testing payment workflows</p>
        <Alert variant="warning">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Development Mode Only:</strong> These tools are only available in development environment.
        </Alert>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          <i className="bi bi-x-circle me-2"></i>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          <i className="bi bi-check-circle me-2"></i>
          {success}
        </Alert>
      )}

      {/* Main Content */}
      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
        <Nav variant="tabs" className="mb-4">
          <Nav.Item>
            <Nav.Link eventKey="simulator">
              <i className="bi bi-play-circle me-2"></i>
              Payment Simulator
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="status-updater">
              <i className="bi bi-pencil-square me-2"></i>
              Status Updater
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="recent-orders">
              <i className="bi bi-clock-history me-2"></i>
              Recent Orders
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          {/* Payment Simulator Tab */}
          <Tab.Pane eventKey="simulator">
            <Row>
              <Col md={6}>
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">Order Selection</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label>Order ID</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter Order ID"
                          value={orderId}
                          onChange={(e) => setOrderId(e.target.value)}
                        />
                        <Form.Text className="text-muted">
                          Enter an existing order ID or create a test order
                        </Form.Text>
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Currency</Form.Label>
                        <Form.Select
                          value={selectedCurrency}
                          onChange={(e) => setSelectedCurrency(e.target.value)}
                        >
                          {currencies.map(currency => (
                            <option key={currency} value={currency}>
                              {currency}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                      
                      <div className="d-grid gap-2">
                        <Button 
                          variant="primary" 
                          onClick={createTestOrder}
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Creating...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-plus-circle me-2"></i>
                              Create Test Order
                            </>
                          )}
                        </Button>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6}>
                {orderId && (
                  <PaymentSimulator 
                    orderId={parseInt(orderId)} 
                    onComplete={() => fetchRecentOrders()}
                  />
                )}
              </Col>
            </Row>
          </Tab.Pane>

          {/* Status Updater Tab */}
          <Tab.Pane eventKey="status-updater">
            <Row>
              <Col md={6}>
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">Manual Status Update</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label>Order ID</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter Order ID"
                          value={orderId}
                          onChange={(e) => setOrderId(e.target.value)}
                        />
                      </Form.Group>
                      
                      {orderId && (
                        <TestPayment 
                          orderId={parseInt(orderId)} 
                          onStatusUpdate={() => fetchRecentOrders()}
                        />
                      )}
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6}>
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">Status Workflow</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="status-workflow">
                      <div className="status-step">
                        <Badge bg="warning">Pending</Badge>
                        <i className="bi bi-arrow-right mx-2"></i>
                      </div>
                      <div className="status-step">
                        <Badge bg="info">Waiting</Badge>
                        <i className="bi bi-arrow-right mx-2"></i>
                      </div>
                      <div className="status-step">
                        <Badge bg="info">Confirming</Badge>
                        <i className="bi bi-arrow-right mx-2"></i>
                      </div>
                      <div className="status-step">
                        <Badge bg="primary">Confirmed</Badge>
                        <i className="bi bi-arrow-right mx-2"></i>
                      </div>
                      <div className="status-step">
                        <Badge bg="success">Completed</Badge>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-muted mb-2">Alternative outcomes:</p>
                      <Badge bg="danger" className="me-2">Failed</Badge>
                      <Badge bg="secondary" className="me-2">Expired</Badge>
                      <Badge bg="danger" className="me-2">Cancelled</Badge>
                      <Badge bg="warning">Refunded</Badge>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab.Pane>

          {/* Recent Orders Tab */}
          <Tab.Pane eventKey="recent-orders">
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Orders</h5>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={fetchRecentOrders}
                  disabled={loading}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Refresh
                </Button>
              </Card.Header>
              <Card.Body>
                {loading && orders.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : orders.length > 0 ? (
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Status</th>
                        <th>Total</th>
                        <th>Currency</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.orderId}>
                          <td>#{order.orderId}</td>
                          <td>{getStatusBadge(order.status)}</td>
                          <td>${order.total}</td>
                          <td>{order.currency}</td>
                          <td>{new Date(order.createdAt).toLocaleString()}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => setOrderId(order.orderId.toString())}
                                title="Test this order"
                              >
                                <i className="bi bi-flask"></i>
                              </Button>
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => window.open(`/orders/${order.orderId}`, '_blank')}
                                title="View details"
                              >
                                <i className="bi bi-eye"></i>
                              </Button>
                              {canDeleteOrder(order.status) && (
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => deleteOrder(order.orderId)}
                                  title="Delete order"
                                >
                                  <i className="bi bi-trash"></i>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                    No orders found
                  </div>
                )}
              </Card.Body>
            </Card>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      {/* Quick Actions */}
      <Card className="mt-4">
        <Card.Header>
          <h5 className="mb-0">Quick Actions</h5>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            <Col md={3}>
              <Button 
                variant="outline-primary" 
                className="w-100"
                onClick={() => window.open('/checkout', '_blank')}
              >
                <i className="bi bi-cart-check me-2"></i>
                Open Checkout
              </Button>
            </Col>
            <Col md={3}>
              <Button 
                variant="outline-success" 
                className="w-100"
                onClick={() => window.open('/orders', '_blank')}
              >
                <i className="bi bi-list-ul me-2"></i>
                View Orders
              </Button>
            </Col>
            <Col md={3}>
              <Button 
                variant="outline-info" 
                className="w-100"
                onClick={() => window.open(`/payment/success?orderId=${orderId}`, '_blank')}
                disabled={!orderId}
              >
                <i className="bi bi-check-circle me-2"></i>
                Simulate Success
              </Button>
            </Col>
            <Col md={3}>
              <Button 
                variant="outline-danger" 
                className="w-100"
                onClick={() => window.open(`/payment/cancel?orderId=${orderId}`, '_blank')}
                disabled={!orderId}
              >
                <i className="bi bi-x-circle me-2"></i>
                Simulate Cancel
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PaymentTest;