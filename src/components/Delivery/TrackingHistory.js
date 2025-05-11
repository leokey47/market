import React from 'react';
import { Card, Spinner, Alert } from 'react-bootstrap';
import './TrackingHistory.css';

const TrackingHistory = ({ trackingInfo, loading, error }) => {
  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </Spinner>
        <p className="mt-2">Получение данных о перемещении посылки...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <p className="mb-0">{error}</p>
      </Alert>
    );
  }

  if (!trackingInfo || !trackingInfo.statusHistory || trackingInfo.statusHistory.length === 0) {
    return (
      <Alert variant="info">
        <p className="mb-0">Нет данных о перемещении посылки</p>
      </Alert>
    );
  }

  return (
    <div className="tracking-history">
      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <h5 className="mb-0">История перемещения посылки</h5>
        </Card.Header>
        <Card.Body>
          <div className="tracking-status mb-3">
            <div className="d-flex justify-content-between">
              <div>
                <strong>Статус:</strong> {trackingInfo.statusDescription}
              </div>
              <div>
                <strong>Ожидаемая дата доставки:</strong> {new Date(trackingInfo.estimatedDeliveryDate).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          <div className="tracking-location mb-4">
            <strong>Текущее местоположение:</strong> {trackingInfo.currentCity}, {trackingInfo.currentWarehouse}
          </div>
          
          <div className="history-timeline">
            {trackingInfo.statusHistory.map((item, index) => (
              <div key={index} className="history-item">
                <div className="history-dot"></div>
                <div className="history-content">
                  <div className="history-date">{new Date(item.date).toLocaleString()}</div>
                  <div className="history-status">{item.description}</div>
                  <div className="history-location">{item.city}</div>
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default TrackingHistory;