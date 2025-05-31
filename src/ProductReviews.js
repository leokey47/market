import React, { useState, useEffect } from 'react';
import { ReviewService } from './ApiService';
import WriteReview from './WriteReview';
import './ProductReviews.css';

const ProductReviews = ({ productId, onReviewSubmitted }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState({1: 0, 2: 0, 3: 0, 4: 0, 5: 0});

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const data = await ReviewService.getProductReviews(productId);
        setReviews(data);
        
        // Calculate average rating
        if (data.length > 0) {
          const total = data.reduce((sum, review) => sum + review.rating, 0);
          setAverageRating((total / data.length).toFixed(1));
          
          // Calculate rating distribution
          const distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
          data.forEach(review => {
            distribution[review.rating] = (distribution[review.rating] || 0) + 1;
          });
          setRatingDistribution(distribution);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setError('Не удалось загрузить отзывы.');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchReviews();
    }
  }, [productId]);

  // Обработчик для отправки нового отзыва
  const handleReviewSubmitted = () => {
    if (onReviewSubmitted) {
      onReviewSubmitted();
    }
  };

  // Генерация цвета для аватара на основе имени пользователя
  const getAvatarColor = (username) => {
    if (!username) return '#6c757d';
    
    // Определяем набор градиентов для аватаров
    const gradients = [
      'linear-gradient(135deg, #FF6B6B, #FF8E53)',
      'linear-gradient(135deg, #36D1DC, #5B86E5)',
      'linear-gradient(135deg, #cb2d3e, #ef473a)',
      'linear-gradient(135deg, #0F2027, #203A43, #2C5364)',
      'linear-gradient(135deg, #42275a, #734b6d)',
      'linear-gradient(135deg, #2980B9, #6DD5FA)',
      'linear-gradient(135deg, #11998e, #38ef7d)',
      'linear-gradient(135deg, #c33764, #1d2671)',
      'linear-gradient(135deg, #8A2387, #E94057, #F27121)'
    ];
    
    // Используем первую букву имени для выбора градиента
    const firstChar = username.charAt(0).toUpperCase();
    const charCode = firstChar.charCodeAt(0);
    const index = charCode % gradients.length;
    
    return gradients[index];
  };

  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, index) => (
      <span key={index} className={`star ${index < rating ? 'filled' : ''}`}>
        ★
      </span>
    ));
  };
  
  const renderRatingBar = (starCount, count, total) => {
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    
    return (
      <div className="rating-bar-item">
        <div className="rating-bar-label">{starCount} <span className="star filled">★</span></div>
        <div className="rating-bar-outer">
          <div 
            className="rating-bar-inner"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="rating-bar-count">{count}</div>
      </div>
    );
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };

  if (loading) {
    return (
      <div className="reviews-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка отзывов...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reviews-error">
        <div className="error-icon">!</div>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="product-reviews">
      {reviews.length === 0 ? (
        <div className="no-reviews">
          <div className="no-reviews-icon">
            <i className="bi bi-chat-square-text"></i>
          </div>
          <h4>У этого товара пока нет отзывов</h4>
          <p>Будьте первым, кто оставит отзыв после покупки!</p>
          
          <div className="mt-4">
            <WriteReview 
              productId={productId} 
              productName="этого товара" 
              onReviewSubmitted={handleReviewSubmitted} 
            />
          </div>
        </div>
      ) : (
        <>
          <div className="reviews-summary">
            <div className="average-rating">
              <div className="rating-number">{averageRating}</div>
              <div className="rating-stars">{renderStars(Math.round(averageRating))}</div>
              <div className="reviews-count">{reviews.length} {getReviewsCountText(reviews.length)}</div>
            </div>
            
            <div className="rating-distribution">
              {[5, 4, 3, 2, 1].map(starCount => (
                <div key={starCount}>
                  {renderRatingBar(
                    starCount,
                    ratingDistribution[starCount] || 0,
                    reviews.length
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="reviews-actions">
            <WriteReview 
              productId={productId} 
              productName="этого товара" 
              onReviewSubmitted={handleReviewSubmitted} 
            />
            
            <div className="reviews-filter">
              <select className="form-select form-select-sm">
                <option value="date-desc">Сначала новые</option>
                <option value="date-asc">Сначала старые</option>
                <option value="rating-desc">Высокий рейтинг</option>
                <option value="rating-asc">Низкий рейтинг</option>
              </select>
            </div>
          </div>

          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review.reviewId} className="review-item">
                <div className="review-header">
                  <div className="reviewer-info">
                    <div 
                      className="reviewer-avatar"
                      style={{ background: getAvatarColor(review.username) }}
                    >
                      {review.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="reviewer-details">
                      <div className="reviewer-name">
                        {review.username}
                        <span className="verified-purchase">
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" 
                             fill="currentColor" strokeWidth="1" />
                          </svg>
                          Проверенная покупка
                        </span>
                      </div>
                      <div className="review-date">
                        {formatDate(review.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="review-rating">{renderStars(review.rating)}</div>
                </div>
                <div className="review-text">{review.text}</div>
                
                <div className="review-helpful">
                  <button className="helpful-btn">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"></path>
                      <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"></path>
                    </svg>
                    <span className="ml-1">Полезно (0)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Helper function to get the correct form of "отзыв" based on count
function getReviewsCountText(count) {
  // Handle special cases for Russian language pluralization
  if (count % 10 === 1 && count % 100 !== 11) {
    return 'отзыв';
  } else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    return 'отзыва';
  } else {
    return 'отзывов';
  }
}

export default ProductReviews;