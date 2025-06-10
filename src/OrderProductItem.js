import React, { useState, useEffect } from 'react';
import { Button, Card, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import WriteReview from './WriteReview';
import { ReviewService } from './ApiService';

const OrderProductItem = ({ product, order, onReviewSubmitted }) => {
  const [canReview, setCanReview] = useState(false);
  const [reviewStatus, setReviewStatus] = useState({
    canReview: false,
    hasPurchased: false,
    hasReviewed: false,
    message: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkReviewStatus();
  }, [product, order]);

  const checkReviewStatus = async () => {
    if (!product?.productId || !order) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Проверяем статус заказа на клиенте
      const orderIsCompleted = isOrderCompleted(order.status);
      console.log('Order status check:', {
        originalStatus: order.status,
        isCompleted: orderIsCompleted,
        orderId: order.orderId
      });

      if (!orderIsCompleted) {
        setReviewStatus({
          canReview: false,
          hasPurchased: false,
          hasReviewed: false,
          message: 'Отзывы доступны только после завершения заказа'
        });
        setCanReview(false);
        return;
      }

      // Проверяем через API можем ли оставить отзыв
      const response = await ReviewService.canUserReviewProduct(product.productId);
      console.log('Review status from API:', response);
      
      setReviewStatus(response);
      setCanReview(response.canReview);

    } catch (error) {
      console.error('Error checking review status:', error);
      
      // Fallback: проверяем только статус заказа
      const orderIsCompleted = isOrderCompleted(order.status);
      setCanReview(orderIsCompleted);
      setReviewStatus({
        canReview: orderIsCompleted,
        hasPurchased: orderIsCompleted,
        hasReviewed: false,
        message: orderIsCompleted ? 'Вы можете оставить отзыв' : 'Заказ должен быть завершен'
      });
      
      setError('Не удалось проверить статус отзыва');
    } finally {
      setLoading(false);
    }
  };

  // Функция для проверки завершения заказа
  const isOrderCompleted = (status) => {
    if (!status) return false;
    
    const completedStatuses = [
      'completed',
      'оплачен',
      'завершен',
      'доставлен',
      'получен'
    ];
    
    return completedStatuses.some(completedStatus => 
      status.toLowerCase().includes(completedStatus.toLowerCase())
    );
  };

  const handleReviewSubmitted = () => {
    // Обновляем статус после отправки отзыва
    setReviewStatus(prev => ({
      ...prev,
      hasReviewed: true,
      canReview: false,
      message: 'Вы уже оставили отзыв на этот товар'
    }));
    setCanReview(false);
    
    if (onReviewSubmitted) {
      onReviewSubmitted();
    }
  };

  const renderReviewButton = () => {
    if (loading) {
      return (
        <div className="d-flex align-items-center">
          <Spinner size="sm" className="me-2" />
          <span>Проверка...</span>
        </div>
      );
    }

    if (error) {
      return (
        <Button 
          variant="outline-secondary" 
          size="sm" 
          onClick={checkReviewStatus}
          title="Повторить проверку"
        >
          <i className="bi bi-arrow-clockwise me-1"></i>
          Повторить
        </Button>
      );
    }

    if (canReview && reviewStatus.canReview) {
      return (
        <WriteReview
          productId={product.productId}
          productName={product.productName}
          onReviewSubmitted={handleReviewSubmitted}
        />
      );
    }

    // Показываем сообщение о статусе
    return (
      <small className="text-muted">
        {reviewStatus.message || getStatusMessage()}
      </small>
    );
  };

  const getStatusMessage = () => {
    if (!isOrderCompleted(order.status)) {
      return 'Отзывы доступны после завершения заказа';
    }
    if (reviewStatus.hasReviewed) {
      return 'Вы уже оставили отзыв на этот товар';
    }
    return 'Недоступно для отзыва';
  };

  return (
    <Card className="mb-3 order-product-card">
      <Card.Body>
        <div className="d-flex flex-column flex-md-row">
          {/* Изображение товара - УБРАЛ INLINE СТИЛИ! */}
          <div className="order-product-image me-3 mb-3 mb-md-0">
            <Link to={`/product/${product.productId}`}>
              <img
                src={product.productImageUrl || '/placeholder-image.jpg'}
                alt={product.productName}
                className="order-product-image" /* ИСПОЛЬЗУЕМ ТОЛЬКО CSS КЛАСС */
                onError={(e) => {
                  e.target.src = '/placeholder-image.jpg';
                }}
              />
            </Link>
          </div>

          {/* Информация о товаре */}
          <div className="order-product-details flex-grow-1">
            <h5 className="mb-2">
              <Link 
                to={`/product/${product.productId}`}
                className="text-decoration-none"
              >
                {product.productName}
              </Link>
            </h5>
            
            <div className="row">
              <div className="col-md-6">
                <p className="mb-1">
                  <strong>Количество:</strong> {product.quantity}
                </p>
                <p className="mb-1">
                  <strong>Цена за единицу:</strong> ${product.price.toFixed(2)}
                </p>
                <p className="mb-0">
                  <strong>Сумма:</strong> ${(product.price * product.quantity).toFixed(2)}
                </p>
              </div>
              
              <div className="col-md-6 d-flex align-items-end justify-content-md-end">
                <div className="order-product-actions">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    as={Link}
                    to={`/product/${product.productId}`}
                    className="me-2 mb-2"
                  >
                    <i className="bi bi-box-arrow-up-right me-1"></i>
                    К товару
                  </Button>
                  
                  <div className="review-section">
                    {renderReviewButton()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Показываем отладочную информацию в development режиме */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2">
            <details className="mt-2">
              <summary className="text-muted" style={{ fontSize: '0.8em', cursor: 'pointer' }}>
                Debug Info
              </summary>
              <pre className="text-muted" style={{ fontSize: '0.7em', background: '#f8f9fa', padding: '5px', borderRadius: '3px' }}>
                {JSON.stringify({
                  orderStatus: order.status,
                  isCompleted: isOrderCompleted(order.status),
                  reviewStatus: reviewStatus,
                  canReview: canReview,
                  productId: product.productId
                }, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default OrderProductItem;