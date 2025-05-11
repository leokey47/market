import React, { useState } from 'react';
import { Card, Button } from 'react-bootstrap';
import NovaPoshtaButton from './NovaPoshtaButton';
import './MiniDeliveryMap.css';

const MiniDeliveryMap = ({ onSelectDelivery }) => {
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  
  const handleDeliverySelect = (delivery) => {
    setDeliveryInfo(delivery);
    onSelectDelivery && onSelectDelivery(delivery);
  };
  
  return (
    <Card className="mini-delivery-map shadow-sm">
      <Card.Header className="bg-white d-flex align-items-center">
        <img 
          src="/images/novaposhta-logo.svg" 
          alt="Новая Почта" 
          className="np-logo-header me-2" 
        />
        <h5 className="mb-0">Доставка Новой Почтой</h5>
      </Card.Header>
      <Card.Body>
        <p className="text-muted mb-3">
          Выберите ближайшее к вам отделение Новой Почты для доставки товара.
        </p>
        
        <NovaPoshtaButton 
          buttonText="Выбрать отделение"
          variant="outline-primary"
          block={true}
          onSelectDelivery={handleDeliverySelect}
        />
        
        {deliveryInfo && (
          <div className="delivery-cost-info mt-3">
            <div className="d-flex justify-content-between">
              <span>Стоимость доставки:</span>
              <span className="delivery-cost-value">От 60 грн</span>
            </div>
            <div className="d-flex justify-content-between">
              <span>Ориентировочное время доставки:</span>
              <span className="delivery-time-value">1-2 дня</span>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default MiniDeliveryMap;