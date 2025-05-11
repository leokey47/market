import React, { useState } from 'react';
import { Button, Badge } from 'react-bootstrap';
import NovaPoshtaMapModal from './NovaPoshtaMapModal';
import './NovaPoshtaButton.css';

const NovaPoshtaButton = ({ 
  buttonText = 'Выбрать отделение Новой Почты', 
  variant = 'primary', 
  size = 'md', 
  block = false,
  className = '',
  initialCity = null,
  initialWarehouse = null,
  onSelectDelivery
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedWarehouse, setSelectedWarehouse] = useState(initialWarehouse);
  
  // Обработчик выбора доставки
  const handleSelectDelivery = (delivery) => {
    setSelectedCity({
      Ref: delivery.cityRef,
      Description: delivery.cityName
    });
    
    setSelectedWarehouse({
      Ref: delivery.warehouseRef,
      Description: delivery.warehouseAddress
    });
    
    onSelectDelivery && onSelectDelivery(delivery);
  };
  
  return (
    <>
      <div className={`nova-poshta-button-container ${block ? 'w-100' : ''} ${className}`}>
        <Button 
          variant={variant} 
          size={size} 
          onClick={() => setShowModal(true)}
          className={`${block ? 'w-100' : ''} ${selectedWarehouse ? 'has-selection' : ''}`}
        >
          <div className="d-flex align-items-center justify-content-center">
            <img 
              src="/images/novaposhta-logo-small.svg" 
              alt="Новая Почта" 
              className="np-logo me-2"
            />
            <span>{buttonText}</span>
          </div>
        </Button>
        
        {selectedWarehouse && (
          <div className="selected-branch mt-2">
            <Badge bg="light" text="dark" className="selected-city-badge">
              {selectedCity?.Description}
            </Badge>
            <Badge bg="light" text="dark" className="selected-warehouse-badge">
              {selectedWarehouse?.Description}
            </Badge>
          </div>
        )}
      </div>
      
      <NovaPoshtaMapModal 
        show={showModal}
        onHide={() => setShowModal(false)}
        onSelectDelivery={handleSelectDelivery}
        initialCity={selectedCity}
        initialWarehouse={selectedWarehouse}
      />
    </>
  );
};

export default NovaPoshtaButton;