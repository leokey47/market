import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Alert, Form, Pagination } from 'react-bootstrap';
import { PaymentService } from './ApiService';

const AdminPaymentManager = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, [filterStatus, currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await PaymentService.adminGetAllOrders(filterStatus, currentPage);
      setOrders(response.orders);
      setTotalPages(response.totalPages);
      setTotalOrders(response.totalCount);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const processFakePayment = async (orderId) => {
    try {
      setError(null);
      setSuccess(null);
      
      const response = await PaymentService.adminFakePayment(orderId);
      setSuccess(`Order #${orderId} successfully marked as paid (Payment ID: ${response.paymentId})`);
      
      // Refresh orders list
      fetchOrders();
    } catch (err) {
      console.error('Error processing fake payment:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
      setError(`Failed to process fake payment: ${errorMessage}`);
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

  const canProcessFakePayment = (status) => {
    return ['Pending', 'Waiting', 'Confirming'].includes(status);
  };

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">
                <i className="bi bi-credit-card-2-back me-2"></i>
                Admin Payment Manager
              </h4>
            </Card.Header>
            <Card.Body>
              {/* Alerts */}
              {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
                  <i className="bi bi-check-circle-fill me-2"></i>
                  {success}
                </Alert>
              )}

              {/* Filters */}
              <Row className="mb-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Filter by Status</Form.Label>
                    <Form.Select
                      value={filterStatus}
                      onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Waiting">Waiting</option>
                      <option value="Confirming">Confirming</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Completed">Completed</option>
                      <option value="Failed">Failed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Expired">Expired</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={8} className="d-flex align-items-end">
                  <div className="text-muted">
                    Total Orders: {totalOrders}
                  </div>
                </Col>
              </Row>

              {/* Orders Table */}
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : orders.length > 0 ? (
                <>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Status</th>
                        <th>Total</th>
                        <th>Currency</th>
                        <th>Created</th>
                        <th>Completed</th>
                        <th>Payment ID</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.orderId}>
                          <td>#{order.orderId}</td>
                          <td>{getStatusBadge(order.status)}</td>
                          <td>${order.total.toFixed(2)}</td>
                          <td>{order.currency || 'USD'}</td>
                          <td>{new Date(order.createdAt).toLocaleString()}</td>
                          <td>
                            {order.completedAt ? 
                              new Date(order.completedAt).toLocaleString() : 
                              '-'
                            }
                          </td>
                          <td>
                            {order.paymentId ? (
                              <code className="small">{order.paymentId}</code>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              {canProcessFakePayment(order.status) && (
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => processFakePayment(order.orderId)}
                                  title="Process fake payment"
                                >
                                  <i className="bi bi-cash-coin me-1"></i>
                                  Fake Pay
                                </Button>
                              )}
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => window.open(`/orders/${order.orderId}`, '_blank')}
                                title="View details"
                              >
                                <i className="bi bi-eye"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-3">
                      <Pagination>
                        <Pagination.First 
                          onClick={() => setCurrentPage(1)} 
                          disabled={currentPage === 1}
                        />
                        <Pagination.Prev 
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        />
                        
                        {[...Array(totalPages)].map((_, index) => {
                          const page = index + 1;
                          if (
                            page === 1 || 
                            page === totalPages || 
                            (page >= currentPage - 2 && page <= currentPage + 2)
                          ) {
                            return (
                              <Pagination.Item
                                key={page}
                                active={page === currentPage}
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </Pagination.Item>
                            );
                          } else if (
                            page === currentPage - 3 || 
                            page === currentPage + 3
                          ) {
                            return <Pagination.Ellipsis key={page} />;
                          }
                          return null;
                        })}
                        
                        <Pagination.Next 
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        />
                        <Pagination.Last 
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                        />
                      </Pagination>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                  No orders found
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminPaymentManager;