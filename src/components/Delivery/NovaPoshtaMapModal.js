import React, { useState } from 'react';
import { Modal, Button, Tab, Nav, Form, InputGroup, FormControl } from 'react-bootstrap';
import NovaPoshtaSelector from './NovaPoshtaSelector';
import NovaPoshtaMap from './NovaPoshtaMap';
import './NovaPoshtaMapModal.css';

const NovaPoshtaMapModal = ({ show, onHide, onSelectDelivery, initialCity, initialWarehouse }) => {
  const [activeTab, setActiveTab] = useState('list');
  const [selectedCity, setSelectedCity] = useState(initialCity || null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(initialWarehouse || null);
  
  // Обработчик выбора доставки в режиме списка
  const handleListSelection = (delivery) => {
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
  
  // Обработчик выбора отделения с карты
  const handleMapSelection = (warehouse) => {
    setSelectedWarehouse(warehouse);
    
    // Формируем объект доставки для передачи родительскому компоненту
    const delivery = {
      cityRef: selectedCity?.Ref,
      cityName: selectedCity?.Description,
      warehouseRef: warehouse.ref,
      warehouseAddress: `${warehouse.description} (${warehouse.address})`
    };
    
    onSelectDelivery && onSelectDelivery(delivery);
  };
  
  // Обработчик подтверждения выбора
  const handleConfirm = () => {
    if (selectedCity && selectedWarehouse) {
      onHide();
    }
  };
  
  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      backdrop="static"
      keyboard={false}
      centered
      className="nova-poshta-map-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>Выбор отделения Новой Почты</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Tab.Container id="delivery-tabs" activeKey={activeTab} onSelect={setActiveTab}>
          <Nav variant="tabs" className="mb-3">
            <Nav.Item>
              <Nav.Link eventKey="list">Список отделений</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="map" disabled={!selectedCity}>Карта отделений</Nav.Link>
            </Nav.Item>
          </Nav>
          <Tab.Content>
            <Tab.Pane eventKey="list">
              <NovaPoshtaSelector
                onSelectDelivery={handleListSelection}
                initialCity={initialCity ? { Ref: initialCity.Ref, Description: initialCity.Description } : null}
                initialWarehouse={initialWarehouse ? { Ref: initialWarehouse.Ref, Description: initialWarehouse.Description } : null}
              />
            </Tab.Pane>
            <Tab.Pane eventKey="map">
              {selectedCity ? (
                <NovaPoshtaMap
                  city={selectedCity}
                  warehouse={selectedWarehouse}
                  onSelectWarehouse={handleMapSelection}
                />
              ) : (
                <div className="no-city-selected text-center py-4">
                  <p>Сначала выберите город во вкладке "Список отделений"</p>
                </div>
              )}
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Modal.Body>
      <Modal.Footer>
        <div className="selected-delivery">
          {selectedCity && (
            <div className="selected-city">
              <i className="bi bi-geo-alt me-1"></i>
              {selectedCity.Description}
            </div>
          )}
          {selectedWarehouse && (
            <div className="selected-warehouse">
              <i className="bi bi-building me-1"></i>
              {selectedWarehouse.Description}
            </div>
          )}
        </div>
        <div>
          <Button variant="secondary" onClick={onHide} className="me-2">
            Отмена
          </Button>
          <Button 
            variant="primary" 
            onClick={handleConfirm}
            disabled={!selectedCity || !selectedWarehouse}
          >
            Подтвердить
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default NovaPoshtaMapModal;