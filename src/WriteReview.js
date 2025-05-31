import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { ReviewService, CloudinaryService } from './ApiService';
import './WriteReview.css';

const WriteReview = ({ productId, productName, onReviewSubmitted }) => {
  const [show, setShow] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const maxCharCount = 1000;

  const handleClose = () => {
    setShow(false);
    setRating(5);
    setText('');
    setPhotos([]);
    setError(null);
  };

  const handleShow = () => setShow(true);

  const handleTextChange = (e) => {
    const value = e.target.value;
    // Ограничение длины отзыва
    if (value.length <= maxCharCount) {
      setText(value);
      setCharCount(value.length);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating < 1) {
      setError('Пожалуйста, поставьте оценку');
      return;
    }

    if (text.trim().length < 10) {
      setError('Отзыв должен содержать не менее 10 символов');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);

      // Сконструируем данные отзыва, включая фотографии, если они есть
      const reviewData = {
        productId,
        rating,
        text,
        photoUrls: photos.length > 0 ? photos.map(photo => photo.url) : []
      };
      
      await ReviewService.createReview(productId, rating, text);
      
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
      
      handleClose();
      
      // Показать всплывающее уведомление
      showNotification('Спасибо за ваш отзыв!');
      
    } catch (error) {
      console.error('Error submitting review:', error);
      setError(error.response?.data?.message || 'Не удалось отправить отзыв');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Проверить тип файла
    if (!file.type.startsWith('image/')) {
      setError('Пожалуйста, загрузите только изображения (JPEG, PNG, GIF)');
      return;
    }

    // Проверить размер файла (макс. 5 МБ)
    if (file.size > 5 * 1024 * 1024) {
      setError('Размер файла не должен превышать 5 МБ');
      return;
    }

    // Ограничить количество фотографий
    if (photos.length >= 5) {
      setError('Вы можете загрузить не более 5 фотографий');
      return;
    }

    try {
      setUploadingPhoto(true);
      setError(null);
      
      // Загрузить фото через Cloudinary
      const result = await CloudinaryService.uploadImage(file);
      
      // Добавить фото к списку
      setPhotos([...photos, { 
        id: Date.now(), // Уникальный ID для фото
        url: result.imageUrl,
        name: file.name
      }]);
      
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Не удалось загрузить фото. Пожалуйста, попробуйте еще раз.');
    } finally {
      setUploadingPhoto(false);
      // Сбросить input file
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (photoId) => {
    setPhotos(photos.filter(photo => photo.id !== photoId));
  };

  // Функция для показа всплывающего уведомления
  const showNotification = (message) => {
    const notification = document.createElement('div');
    notification.className = 'review-notification';
    notification.innerHTML = `
      <div class="notification-icon">
        <svg viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor" />
        </svg>
      </div>
      <div class="notification-content">${message}</div>
    `;
    document.body.appendChild(notification);
    
    // Показать уведомление с анимацией
    setTimeout(() => {
      notification.classList.add('visible');
    }, 100);
    
    // Удалить уведомление через 3 секунды
    setTimeout(() => {
      notification.classList.remove('visible');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 3000);
  };

  // Отображение текста оценки в зависимости от рейтинга
  const getRatingText = (rating) => {
    switch(rating) {
      case 1: return "Очень плохо";
      case 2: return "Плохо";
      case 3: return "Нормально";
      case 4: return "Хорошо";
      case 5: return "Отлично";
      default: return "";
    }
  };

  return (
    <>
      <Button variant="outline-primary" onClick={handleShow} className="write-review-btn">
        <i className="bi bi-pencil"></i>
        Написать отзыв
      </Button>

      <Modal show={show} onHide={handleClose} centered className="review-modal">
        <Modal.Header closeButton>
          <Modal.Title>Отзыв на товар "{productName}"</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4">
              <Form.Label>Ваша оценка</Form.Label>
              <div className="rating-input">
                {[1, 2, 3, 4, 5].map((value) => (
                  <span
                    key={value}
                    className={`star ${value <= (hoverRating || rating) ? 'filled' : ''}`}
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHoverRating(value)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    ★
                  </span>
                ))}
              </div>
              <div className="rating-text">
                {getRatingText(hoverRating || rating)}
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Ваш отзыв</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={text}
                onChange={handleTextChange}
                placeholder="Поделитесь своим мнением о товаре..."
                required
              />
              <div className="d-flex justify-content-between mt-2">
                <Form.Text className="text-muted">
                  Напишите честный отзыв о вашем опыте использования товара. Это поможет другим покупателям сделать правильный выбор.
                </Form.Text>
                <small className={`${charCount > maxCharCount * 0.8 ? 'text-danger' : 'text-muted'}`}>
                  {charCount}/{maxCharCount}
                </small>
              </div>
            </Form.Group>

            {/* Секция загрузки фотографий */}
            <Form.Group className="review-photo-upload">
              <Form.Label>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                Добавить фото (необязательно)
              </Form.Label>
              
              <div className="photo-upload-container">
                {/* Загруженные фото */}
                {photos.map((photo) => (
                  <div key={photo.id} className="photo-preview">
                    <img src={photo.url} alt="Preview" />
                    <button 
                      type="button" 
                      className="photo-remove-btn"
                      onClick={() => handleRemovePhoto(photo.id)}
                      title="Удалить"
                    >
                      ×
                    </button>
                  </div>
                ))}
                
                {/* Кнопка загрузки фото */}
                {photos.length < 5 && (
                  <label className="photo-upload-box">
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={handleFileUpload}
                      disabled={uploadingPhoto}
                    />
                    {uploadingPhoto ? (
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Загрузка...</span>
                      </div>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                    )}
                  </label>
                )}
              </div>
              
              {photos.length > 0 && (
                <div className="photo-upload-helper">
                  {photos.length} из 5 фото загружено
                </div>
              )}
            </Form.Group>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting || text.trim().length < 10}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Отправка...
              </>
            ) : (
              'Отправить отзыв'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* CSS-стили для всплывающего уведомления */}
      <style>{`
        .review-notification {
          position: fixed;
          bottom: -100px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          background-color: #4caf50;
          color: white;
          padding: 12px 20px;
          border-radius: 50px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 9999;
          transition: bottom 0.3s ease-in-out;
          max-width: 90%;
        }
        
        .review-notification.visible {
          bottom: 20px;
        }
        
        .notification-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
        }
        
        .notification-icon svg {
          width: 20px;
          height: 20px;
        }
        
        .notification-content {
          font-weight: 500;
          font-size: 14px;
        }
      `}</style>
    </>
  );
};

export default WriteReview;