import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import './WishlistPage.css';

const WishlistPage = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  
  // API URL should match your ASP.NET Core backend
  const API_URL = process.env.REACT_APP_API_URL || 'https://localhost:7209';

  useEffect(() => {
    fetchWishlistItems();
  }, []);

  const fetchWishlistItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Необходимо войти в систему');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/api/Wishlist`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setWishlistItems(response.data);
      setError(null);
      
      // Update wishlist count in navbar
      localStorage.setItem('wishlistCount', response.data.length);
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Error fetching wishlist items:', err);
      setError('Ошибка при загрузке списка желаемого. Пожалуйста, попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (wishlistItemId) => {
    setActionLoading(prev => ({ ...prev, [wishlistItemId]: 'remove' }));
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/Wishlist/${wishlistItemId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Remove item from local state
      setWishlistItems(wishlistItems.filter(item => item.wishlistItemId !== wishlistItemId));
      
      // Update wishlist count in navbar
      localStorage.setItem('wishlistCount', wishlistItems.length - 1);
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Error removing wishlist item:', err);
      setError('Ошибка при удалении товара из списка желаемого. Пожалуйста, попробуйте еще раз.');
    } finally {
      setActionLoading(prev => ({ ...prev, [wishlistItemId]: null }));
    }
  };

  const handleMoveToCart = async (wishlistItemId) => {
    setActionLoading(prev => ({ ...prev, [wishlistItemId]: 'move' }));
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/Wishlist/MoveToCart/${wishlistItemId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Remove item from local state
      setWishlistItems(wishlistItems.filter(item => item.wishlistItemId !== wishlistItemId));
      
      // Update counts in navbar
      localStorage.setItem('wishlistCount', wishlistItems.length - 1);
      const cartCount = parseInt(localStorage.getItem('cartCount') || '0');
      localStorage.setItem('cartCount', cartCount + 1);
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Error moving item to cart:', err);
      setError('Ошибка при перемещении товара в корзину. Пожалуйста, попробуйте еще раз.');
    } finally {
      setActionLoading(prev => ({ ...prev, [wishlistItemId]: null }));
    }
  };

  const handleClearWishlist = async () => {
    if (!window.confirm('Вы уверены, что хотите очистить список желаемого?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/Wishlist`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Clear local state
      setWishlistItems([]);
      
      // Update wishlist count in navbar
      localStorage.setItem('wishlistCount', 0);
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Error clearing wishlist:', err);
      setError('Ошибка при очистке списка желаемого. Пожалуйста, попробуйте еще раз.');
    }
  };

  if (loading) {
    return (
      <Container className="wishlist-page py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </div>
          <p className="mt-2">Загрузка списка желаемого...</p>
        </div>
      </Container>
    );
  }

  if (error && wishlistItems.length === 0) {
    return (
      <Container className="wishlist-page py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <Container className="wishlist-page py-5">
        <Card className="text-center p-5 shadow-sm">
          <Card.Body>
            <i className="bi bi-heart fs-1 mb-3 text-muted"></i>
            <h2>Ваш список желаемого пуст</h2>
            <p className="text-muted mb-4">Добавьте товары из каталога в ваш список желаемого</p>
            <Button variant="primary" href="/">Перейти к покупкам</Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="wishlist-page py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Список желаемого</h1>
        <Button 
          variant="outline-danger" 
          onClick={handleClearWishlist}
          disabled={wishlistItems.length === 0}
        >
          Очистить список
        </Button>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row className="wishlist-grid">
        {wishlistItems.map(item => (
          <Col lg={4} md={6} sm={12} key={item.wishlistItemId} className="mb-4">
            <Card className="wishlist-item h-100 shadow-sm">
              <div className="wishlist-item-image-wrapper">
                <Card.Img 
                  variant="top" 
                  src={item.productImageUrl || '/placeholder-image.jpg'} 
                  alt={item.productName} 
                  className="wishlist-item-image"
                />
              </div>
              <Card.Body className="d-flex flex-column">
                <Card.Title className="wishlist-item-title">{item.productName}</Card.Title>
                <Card.Text className="text-muted small mb-2 flex-grow-1">
                  {item.productDescription?.substring(0, 100)}
                  {item.productDescription?.length > 100 ? '...' : ''}
                </Card.Text>
                <div className="d-flex justify-content-between align-items-center mt-auto">
                  <span className="wishlist-item-price fw-bold">
                    {item.price.toLocaleString()} ₽
                  </span>
                  <small className="text-muted">
                    Добавлен: {new Date(item.addedAt).toLocaleDateString()}
                  </small>
                </div>
              </Card.Body>
              <Card.Footer className="bg-white border-top-0">
                <div className="d-flex justify-content-between">
                  <Button 
                    variant="primary" 
                    onClick={() => handleMoveToCart(item.wishlistItemId)}
                    disabled={actionLoading[item.wishlistItemId] === 'move'}
                    className="flex-grow-1 me-2"
                  >
                    {actionLoading[item.wishlistItemId] === 'move' ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Добавление...</>
                    ) : (
                      'В корзину'
                    )}
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    onClick={() => handleRemoveItem(item.wishlistItemId)}
                    disabled={actionLoading[item.wishlistItemId] === 'remove'}
                  >
                    {actionLoading[item.wishlistItemId] === 'remove' ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                      <i className="bi bi-trash"></i>
                    )}
                  </Button>
                </div>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default WishlistPage;