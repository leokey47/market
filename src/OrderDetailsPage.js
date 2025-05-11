import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Spinner, Alert, Button, Table, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { PaymentService } from './ApiService';
import TestPayment from './PaymentTest';

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    fetchOrderDetails();
    fetchOrderItems();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await PaymentService.checkOrderStatus(orderId);
      setOrder(response);
      setError(null);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderItems = async () => {
    try {
      // Это предполагает, что у вас есть эндпоинт для получения элементов заказа
      // Если его нет, вы можете временно использовать моковые данные
      // const response = await PaymentService.getOrderItems(orderId);
      // setOrderItems(response);
      
      // Временные моковые данные для демонстрации
      setOrderItems([
        {
          productId: 1,
          productName: 'Product 1',
          price: 99.99,
          quantity: 2,
          total: 199.98
        },
        {
          productId: 2,
          productName: 'Product 2',
          price: 49.99,
          quantity: 1,
          total: 49.99
        }
      ]);
    } catch (err) {
      console.error('Error fetching order items:', err);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'Pending': { variant: 'warning', icon: 'clock-history' },
      'Waiting': { variant: 'info', icon: 'hourglass-split' },
      'Confirming': { variant: 'info', icon: 'arrow-repeat' },
      'Confirmed': { variant: 'primary', icon: 'check-circle' },
      'Completed': { variant: 'success', icon: 'check-circle-fill' },
      'Failed': { variant: 'danger', icon: 'x-circle-fill' },
      'Expired': { variant: 'secondary', icon: 'calendar-x' },
      'Refunded': { variant: 'warning', icon: 'arrow-return-left' }
    };
    
    const config = statusMap[status] || { variant: 'secondary', icon: 'question-circle' };
    
    return (
      <Badge bg={config.variant}>
        <i className={`bi bi-${config.icon} me-1`}></i>
        {status}
      </Badge>
    );
  };

  const handleRefresh = () => {
    fetchOrderDetails();
    fetchOrderItems();
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading order details...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </Alert>
        <Button variant="primary" onClick={() => navigate('/profile/orders')}>
          <i className="bi bi-arrow-left me-2"></i>
          Back to Orders
        </Button>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          Order not found
        </Alert>
        <Button variant="primary" onClick={() => navigate('/profile/orders')}>
          <i className="bi bi-arrow-left me-2"></i>
          Back to Orders
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Order #{order.orderId}</h2>
        <div>
          <Button 
            variant="outline-secondary" 
            onClick={handleRefresh}
            className="me-2"
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            Refresh
          </Button>
          <Button 
            variant="outline-primary" 
            onClick={() => navigate('/profile/orders')}
          >
            <i className="bi bi-arrow-left me-1"></i>
            Back to Orders
          </Button>
        </div>
      </div>

      <Row>
        <Col lg={8}>
          {/* Order Information Card */}
          <Card className="mb-4">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Order Information</h5>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={6}>
                  <h6>Order Details</h6>
                  <p><strong>Status:</strong> {getStatusBadge(order.status)}</p>
                  <p><strong>Order ID:</strong> #{order.orderId}</p>
                  <p><strong>Created:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                  {order.completedAt && (
                    <p><strong>Completed:</strong> {new Date(order.completedAt).toLocaleString()}</p>
                  )}
                </Col>
                <Col md={6}>
                  <h6>Payment Information</h6>
                  <p><strong>Total Amount:</strong> ${order.total.toFixed(2)}</p>
                  <p><strong>Payment Currency:</strong> {order.currency}</p>
                  {order.paymentId && (
                    <p><strong>Payment ID:</strong> <small>{order.paymentId}</small></p>
                  )}
                </Col>
              </Row>

              {/* Payment Status Alerts */}
              {order.status === 'Pending' && order.paymentUrl && (
                <Alert variant="info">
                  <i className="bi bi-info-circle-fill me-2"></i>
                  Your payment is pending. Click the button below to complete the payment:
                  <div className="mt-2">
                    <Button 
                      variant="primary" 
                      href={order.paymentUrl} 
                      target="_blank"
                    >
                      <i className="bi bi-credit-card me-2"></i>
                      Complete Payment
                    </Button>
                  </div>
                </Alert>
              )}

              {order.status === 'Waiting' && (
                <Alert variant="warning">
                  <i className="bi bi-hourglass-split me-2"></i>
                  Waiting for payment confirmation...
                </Alert>
              )}

              {order.status === 'Completed' && (
                <Alert variant="success">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Payment completed successfully!
                </Alert>
              )}

              {order.status === 'Failed' && (
                <Alert variant="danger">
                  <i className="bi bi-x-circle-fill me-2"></i>
                  Payment failed. Please try again or contact support.
                </Alert>
              )}
            </Card.Body>
          </Card>

          {/* Order Items Card */}
          <Card className="mb-4">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Order Items</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive striped hover>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="text-end">Price</th>
                    <th className="text-center">Quantity</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.length > 0 ? (
                    orderItems.map((item, index) => (
                      <tr key={index}>
                        <td>{item.productName}</td>
                        <td className="text-end">${item.price.toFixed(2)}</td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-end">${item.total.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-4">
                        <i className="bi bi-box-seam me-2"></i>
                        No items found for this order
                      </td>
                    </tr>
                  )}
                </tbody>
                {orderItems.length > 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="text-end"><strong>Subtotal:</strong></td>
                      <td className="text-end"><strong>${order.total.toFixed(2)}</strong></td>
                    </tr>
                  </tfoot>
                )}
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Order Summary Card */}
          <Card className="mb-4">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Order Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Shipping:</span>
                <span>$0.00</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Tax:</span>
                <span>$0.00</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between">
                <strong>Total:</strong>
                <strong>${order.total.toFixed(2)}</strong>
              </div>
              
              {order.status === 'Completed' && (
                <div className="mt-3 d-grid">
                  <Button variant="primary" size="sm">
                    <i className="bi bi-download me-2"></i>
                    Download Invoice
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Actions Card */}
          <Card className="mb-4">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                {order.status === 'Completed' && (
                  <Button variant="success">
                    <i className="bi bi-arrow-repeat me-2"></i>
                    Reorder Items
                  </Button>
                )}
                <Button variant="outline-primary">
                  <i className="bi bi-headset me-2"></i>
                  Contact Support
                </Button>
                {order.status === 'Completed' && (
                  <Button variant="outline-secondary">
                    <i className="bi bi-printer me-2"></i>
                    Print Order
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Test Payment Controls for Development */}
          {isDevelopment && order.status !== 'Completed' && (
            <TestPayment orderId={orderId} onStatusUpdate={fetchOrderDetails} />
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default OrderDetailsPage;