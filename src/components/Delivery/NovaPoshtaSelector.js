import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Form, Button, Spinner, InputGroup, ListGroup, Badge } from 'react-bootstrap';
import NovaPoshtaService from '../../services/NovaPoshtaService';
import './NovaPoshtaSelector.css';

const NovaPoshtaSelector = ({ onSelectDelivery, initialCity, initialWarehouse, disabled }) => {
  // Refs для управления фокусом
  const cityInputRef = useRef(null);
  const warehouseInputRef = useRef(null);
  const cityDropdownRef = useRef(null);
  const warehouseDropdownRef = useRef(null);

  // Состояния для выбора города
  const [citySearch, setCitySearch] = useState('');
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(initialCity || null);
  const [loadingCities, setLoadingCities] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  
  // Состояния для выбора отделения
  const [warehouses, setWarehouses] = useState([]);
  const [filteredWarehouses, setFilteredWarehouses] = useState([]);
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState(initialWarehouse || null);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);
  
  // Состояния для фильтров отделений
  const [warehouseType, setWarehouseType] = useState('all');

  // Обработка кликов вне компонента
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(event.target) &&
        cityInputRef.current &&
        !cityInputRef.current.contains(event.target)
      ) {
        setShowCityDropdown(false);
      }
      
      if (
        warehouseDropdownRef.current &&
        !warehouseDropdownRef.current.contains(event.target) &&
        warehouseInputRef.current &&
        !warehouseInputRef.current.contains(event.target)
      ) {
        setShowWarehouseDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Поиск городов с дебаунсом
  const searchCities = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setCities([]);
      return;
    }
    
    setLoadingCities(true);
    try {
      const response = await NovaPoshtaService.getCities(query);
      if (response && response.success && response.data) {
        setCities(response.data);
      } else {
        setCities([]);
      }
    } catch (error) {
      console.error('Error searching cities:', error);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  }, []);

  // Загрузка отделений по выбранному городу
  const loadWarehouses = useCallback(async (cityRef) => {
    if (!cityRef) return;
    
    setLoadingWarehouses(true);
    try {
      const response = await NovaPoshtaService.getWarehouses(cityRef);
      if (response && response.success && response.data) {
        setWarehouses(response.data);
        setFilteredWarehouses(response.data);
      } else {
        setWarehouses([]);
        setFilteredWarehouses([]);
      }
    } catch (error) {
      console.error('Error loading warehouses:', error);
      setWarehouses([]);
      setFilteredWarehouses([]);
    } finally {
      setLoadingWarehouses(false);
    }
  }, []);

  // Эффект для поиска городов
  useEffect(() => {
    const timer = setTimeout(() => {
      if (citySearch) {
        searchCities(citySearch);
        setShowCityDropdown(true);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [citySearch, searchCities]);

  // Эффект для загрузки отделений при выборе города
  useEffect(() => {
    if (selectedCity && selectedCity.Ref) {
      loadWarehouses(selectedCity.Ref);
      setSelectedWarehouse(null);
      setWarehouseSearch('');
    }
  }, [selectedCity, loadWarehouses]);

  // Эффект для фильтрации отделений
  useEffect(() => {
    if (warehouses.length === 0) return;
    
    let filtered = [...warehouses];
    
    // Фильтр по типу отделения
    if (warehouseType !== 'all') {
      filtered = NovaPoshtaService.filterWarehouses(filtered, warehouseType);
    }
    
    // Фильтр по поисковому запросу
    if (warehouseSearch && warehouseSearch.length > 0) {
      filtered = filtered.filter(w => 
        w.Description.toLowerCase().includes(warehouseSearch.toLowerCase()) ||
        (w.ShortAddress && w.ShortAddress.toLowerCase().includes(warehouseSearch.toLowerCase()))
      );
    }
    
    setFilteredWarehouses(filtered);
  }, [warehouses, warehouseType, warehouseSearch]);

  // Обработчик выбора города
  const handleSelectCity = (city) => {
    setSelectedCity(city);
    setCitySearch(city.Description + ', ' + city.AreaDescription);
    setShowCityDropdown(false);
    setSelectedWarehouse(null);
    
    // Фокусируемся на поле отделения
    setTimeout(() => {
      if (warehouseInputRef.current) {
        warehouseInputRef.current.focus();
      }
    }, 100);
  };

  // Обработчик выбора отделения
  const handleSelectWarehouse = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setWarehouseSearch(NovaPoshtaService.formatWarehouseAddress(warehouse));
    setShowWarehouseDropdown(false);
    
    // Вызываем колбэк для родительского компонента с информацией о доставке
    if (onSelectDelivery && selectedCity) {
      onSelectDelivery({
        cityRef: selectedCity.Ref,
        cityName: selectedCity.Description,
        warehouseRef: warehouse.Ref,
        warehouseAddress: NovaPoshtaService.formatWarehouseAddress(warehouse)
      });
    }
  };

  // Обработчик изменения фильтра типа отделения
  const handleWarehouseTypeChange = (e) => {
    setWarehouseType(e.target.value);
  };

  // Обработчик очистки города
  const handleClearCity = () => {
    setSelectedCity(null);
    setCitySearch('');
    setSelectedWarehouse(null);
    setWarehouseSearch('');
    setWarehouses([]);
    setFilteredWarehouses([]);
    
    if (cityInputRef.current) {
      cityInputRef.current.focus();
    }
  };

  // Обработчик очистки отделения
  const handleClearWarehouse = () => {
    setSelectedWarehouse(null);
    setWarehouseSearch('');
    
    if (warehouseInputRef.current) {
      warehouseInputRef.current.focus();
    }
  };

  return (
    <div className="nova-poshta-selector">
      {/* Выбор города */}
      <Form.Group className="mb-3 city-selector">
        <Form.Label>Город</Form.Label>
        <div className="input-container">
          <InputGroup>
            <Form.Control
              ref={cityInputRef}
              type="text"
              placeholder="Введите название города"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              onFocus={() => {
                if (cities.length > 0) setShowCityDropdown(true);
              }}
              disabled={disabled}
              autoComplete="off"
            />
            {loadingCities && (
              <InputGroup.Text>
                <Spinner animation="border" size="sm" />
              </InputGroup.Text>
            )}
          </InputGroup>
          
          {/* УБРАНО ОТОБРАЖЕНИЕ selectedCity */}
          
          {showCityDropdown && cities.length > 0 && (
            <ListGroup ref={cityDropdownRef} className="search-dropdown city-dropdown">
              {cities.map(city => (
                <ListGroup.Item 
                  key={city.Ref} 
                  action 
                  onClick={() => handleSelectCity(city)}
                >
                  <span className="city-name">{city.Description}</span>
                  <span className="city-area">, {city.AreaDescription}</span>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </div>
      </Form.Group>

      {/* Выбор отделения */}
      {selectedCity && (
        <Form.Group className="mb-3 warehouse-selector">
          <Form.Label>Отделение</Form.Label>
          
          {/* Фильтры отделений */}
          <Form.Select 
            className="mb-2"
            value={warehouseType}
            onChange={handleWarehouseTypeChange}
            disabled={disabled || warehouses.length === 0}
          >
            <option value="all">Все отделения</option>
            <option value="post">Почтовые отделения</option>
            <option value="cargo">Грузовые отделения</option>
            <option value="poshtomat">Почтоматы</option>
          </Form.Select>
          
          <div className="input-container">
            <InputGroup>
              <Form.Control
                ref={warehouseInputRef}
                type="text"
                placeholder="Поиск отделения"
                value={warehouseSearch}
                onChange={(e) => {
                  setWarehouseSearch(e.target.value);
                  setShowWarehouseDropdown(true);
                }}
                onFocus={() => setShowWarehouseDropdown(true)}
                disabled={disabled || warehouses.length === 0}
                autoComplete="off"
              />
              {loadingWarehouses && (
                <InputGroup.Text>
                  <Spinner animation="border" size="sm" />
                </InputGroup.Text>
              )}
            </InputGroup>
            
            {/* УБРАНО ОТОБРАЖЕНИЕ selectedWarehouse */}
            
            {showWarehouseDropdown && filteredWarehouses.length > 0 && (
              <ListGroup ref={warehouseDropdownRef} className="search-dropdown warehouse-dropdown">
                {filteredWarehouses.map(warehouse => (
                  <ListGroup.Item 
                    key={warehouse.Ref} 
                    action 
                    onClick={() => handleSelectWarehouse(warehouse)}
                    disabled={!NovaPoshtaService.isWarehouseWorking(warehouse)}
                    className={!NovaPoshtaService.isWarehouseWorking(warehouse) ? 'warehouse-not-working' : ''}
                  >
                    <div className="warehouse-item">
                      <div className="warehouse-name">
                        {warehouse.Description}
                      </div>
                      <div className="warehouse-address">
                        {warehouse.ShortAddress}
                      </div>
                      {!NovaPoshtaService.isWarehouseWorking(warehouse) && (
                        <Badge bg="danger" className="not-working-badge">Не работает</Badge>
                      )}
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
            
            {warehouses.length === 0 && !loadingWarehouses && selectedCity && (
              <div className="no-warehouses mt-2">
                <Badge bg="warning" text="dark">Не найдено отделений в выбранном городе</Badge>
              </div>
            )}
          </div>
        </Form.Group>
      )}
    </div>
  );
};

export default NovaPoshtaSelector;