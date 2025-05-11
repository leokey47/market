import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Spinner } from 'react-bootstrap';
import DeliveryService from '../../services/DeliveryService';
import NovaPoshtaService from '../../services/NovaPoshtaService';
import './DeliveryInfo.css';

const DeliveryInfo = ({ delivery, orderId, onTrackDelivery }) => {
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Проверяем трекинг-статус при монтировании компонента
  useEffect(() => {
    if (delivery?.trackingNumber) {
      fetchTrackingInfo(delivery.trackingNumber);
    }
  }, [delivery]);

  // Функция для получения данных о статусе посылки
  const fetchTrackingInfo = async (trackingNumber) => {
    if (!trackingNumber) return;
    
    setLoading(true);
    try {
      // В реальном приложении здесь будет API-запрос к Новой почте
      // Для примера используем имитацию данных трекинга
      
      // Имитация задержки запроса
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Пример данных трекинга (в реальности получаемых от API Новой почты)
      const trackingData = {
        status: 'InTransit',
        statusDescription: 'В пути',
        receivedAt: new Date().toISOString(),
        estimatedDeliveryDate: new Date(Date.now() + 2*24*60*60*1000).toISOString(),
        currentCity: 'Киев',
        currentWarehouse: 'Отделение №1',
        statusHistory: [
          {
            date: new Date().toISOString(),
            status: 'InTransit',
            description: 'Отправление в пути',
            city: 'Киев'
          },
          {
            date: new Date(Date.now() - 12*60*60*1000).toISOString(),
            status: 'Received',
            description: 'Отправление принято',
            city: 'Днепр'
          }
        ]
      };
      
      setTrackingInfo(trackingData);
    } catch (err) {
      console.error('Error fetching tracking info:', err);
      setError('Не удалось получить информацию о статусе доставки');
    } finally {
      setLoading(false);
    }
  };

  // Функция для обновления информации о трекинге
  const handleRefreshTracking = () => {
    if (delivery?.trackingNumber) {
      fetchTrackingInfo(delivery.trackingNumber);
    }
  };

  // Получаем стили для статуса
  const getStatusStyle = (status) => {
    return DeliveryService.getDeliveryStatusStyle(status || delivery?.deliveryStatus);
  };

  // Форматируем статус доставки
  const formatStatus = (status) => {
    return DeliveryService.formatDeliveryStatus(status || delivery?.deliveryStatus);
  };

  if (!delivery) {
    return (
      <Card className="delivery-info mb-4 shadow-sm">
        <Card.Body className="text-center py-4">
          <p className="mb-0 text-muted">Информация о доставке отсутствует</p>
        </Card.Body>
      </Card>
    );
  }

  const statusStyle = getStatusStyle(delivery.deliveryStatus);

  return (
    <Card className="delivery-info mb-4 shadow-sm">
      <Card.Header className="bg-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Информация о доставке</h5>
        <Badge bg={statusStyle.color}>
          <i className={`bi ${statusStyle.icon} me-1`}></i>
          {formatStatus(delivery.deliveryStatus)}
        </Badge>
      </Card.Header>
      <Card.Body>
        <div className="delivery-method mb-3">
          <strong>Способ доставки:</strong> {delivery.deliveryMethod === 'novaposhta' ? 'Новая Почта' : delivery.deliveryMethod}
        </div>
        
        <div className="delivery-details mb-3">
          <div className="mb-1"><strong>Получатель:</strong> {delivery.recipientFullName}</div>
          <div className="mb-1"><strong>Телефон:</strong> {delivery.recipientPhone}</div>
          
          {delivery.deliveryMethod === 'novaposhta' && delivery.deliveryType === 'warehouse' && (
            <>
              <div className="mb-1"><strong>Город:</strong> {delivery.cityName}</div>
              <div className="mb-1"><strong>Отделение:</strong> {delivery.warehouseAddress}</div>
            </>
          )}
          
          {delivery.deliveryType === 'courier' && (
            <div className="mb-1"><strong>Адрес доставки:</strong> {delivery.deliveryAddress}</div>
          )}
          
          <div className="mb-1"><strong>Стоимость доставки:</strong> {delivery.deliveryCost} грн</div>
        </div>
        
        {delivery.trackingNumber && (
          <div className="tracking-info">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Информация о посылке</h6>
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={handleRefreshTracking}
                disabled={loading}
              >
                {loading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <i className="bi bi-arrow-clockwise"></i>
                )}
              </Button>
            </div>
            
            <div className="tracking-details p-3 bg-light rounded">
              <div className="mb-1"><strong>Номер отслеживания:</strong> {delivery.trackingNumber}</div>
              
              {trackingInfo ? (
                <>
                  <div className="mb-1">
                    <strong>Статус:</strong> {trackingInfo.statusDescription}
                  </div>
                  <div className="mb-1">
                    <strong>Текущее местоположение:</strong> {trackingInfo.currentCity}, {trackingInfo.currentWarehouse}
                  </div>
                  <div className="mb-1">
                    <strong>Ожидаемая дата доставки:</strong> {new Date(trackingInfo.estimatedDeliveryDate).toLocaleDateString()}
                  </div>
                  
                  <div className="tracking-history mt-3">
                    <h6>История перемещений:</h6>
                    <div className="history-timeline">
                      {trackingInfo.statusHistory.map((item, index) => (
                        <div key={index} className="history-item">
                          <div className="history-dot"></div>
                          <div className="history-date">{new Date(item.date).toLocaleString()}</div>
                          <div className="history-status">{item.description}</div>
                          <div className="history-location">{item.city}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="tracking-status">
                  {loading ? (
                    <div className="text-center py-3">
                      <Spinner animation="border" size="sm" className="me-2" />
                      Получение данных...
                    </div>
                  ) : error ? (
                    <div className="text-danger">{error}</div>
                  ) : (
                    <div className="text-muted">Нет данных о перемещении посылки</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {delivery.deliveryMethod === 'novaposhta' && !delivery.trackingNumber && delivery.deliveryStatus !== 'Delivered' && (
          <div className="text-center mt-3">
            <Button 
              variant="outline-primary" 
              onClick={() => onTrackDelivery && onTrackDelivery(orderId)}
            >
              <i className="bi bi-truck me-2"></i>
              Отследить посылку
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default DeliveryInfo;