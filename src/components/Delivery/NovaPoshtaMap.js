import React, { useState, useEffect, useRef } from 'react';
import { Spinner, Alert, Button } from 'react-bootstrap';
import './NovaPoshtaMap.css';

const NovaPoshtaMap = ({ city, warehouse, onSelectWarehouse }) => {
  const mapRef = useRef(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  
  // Подключение Google Maps API
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapInitialized(true);
      script.onerror = () => setError('Не удалось загрузить карту Google Maps');
      document.head.appendChild(script);
      
      return () => {
        document.head.removeChild(script);
      };
    } else {
      setMapInitialized(true);
    }
  }, []);
  
  // Инициализация карты и загрузка отделений
  useEffect(() => {
    if (!mapInitialized) return;
    
    setLoading(true);
    
    // Создаем карту
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 50.4501, lng: 30.5234 }, // Киев по умолчанию
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });
    
    // Функция для получения отделений Новой почты
    const fetchWarehouses = async () => {
      try {
        // В реальном приложении здесь будет API-запрос к Новой почте
        // Для примера используем имитацию данных отделений
        
        // Имитация задержки запроса
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Пример данных отделений (в реальности получаемых от API Новой почты)
        const warehousesData = [
          {
            ref: 'warehouse1',
            number: '1',
            description: 'Отделение №1',
            address: 'ул. Крещатик, 1',
            lat: 50.4501,
            lng: 30.5234,
            type: 'warehouse'
          },
          {
            ref: 'warehouse2',
            number: '2',
            description: 'Отделение №2',
            address: 'бул. Шевченко, 10',
            lat: 50.4471,
            lng: 30.5180,
            type: 'warehouse'
          },
          {
            ref: 'warehouse3',
            number: '3',
            description: 'Отделение №3',
            address: 'ул. Большая Васильковская, 72',
            lat: 50.4321,
            lng: 30.5157,
            type: 'warehouse'
          },
          {
            ref: 'poshtomat1',
            number: '101',
            description: 'Почтомат №101',
            address: 'ТЦ "Гулливер", пл. Спортивная, 1',
            lat: 50.4392,
            lng: 30.5223,
            type: 'poshtomat'
          }
        ];
        
        setWarehouses(warehousesData);
        
        // Добавляем маркеры на карту
        const bounds = new window.google.maps.LatLngBounds();
        const markers = warehousesData.map(warehouse => {
          const position = { lat: warehouse.lat, lng: warehouse.lng };
          bounds.extend(position);
          
          // Создаем иконку в зависимости от типа отделения
          const icon = {
            url: warehouse.type === 'warehouse' 
              ? '/images/novaposhta-marker.png' // Путь к изображению маркера для отделения
              : '/images/novaposhta-poshtomat-marker.png', // Путь к изображению маркера для почтомата
            scaledSize: new window.google.maps.Size(32, 32),
            origin: new window.google.maps.Point(0, 0),
            anchor: new window.google.maps.Point(16, 32)
          };
          
          // Создаем маркер
          const marker = new window.google.maps.Marker({
            position,
            map,
            title: `${warehouse.description} - ${warehouse.address}`,
            icon,
            animation: window.google.maps.Animation.DROP
          });
          
          // Создаем информационное окно
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div class="nova-poshta-infowindow">
                <h6>${warehouse.description}</h6>
                <p>${warehouse.address}</p>
                <button class="select-warehouse-btn" data-ref="${warehouse.ref}">Выбрать</button>
              </div>
            `
          });
          
          // Добавляем обработчик клика по маркеру
          marker.addListener('click', () => {
            // Закрываем предыдущее инфо-окно, если оно открыто
            if (selectedMarker && selectedMarker.infoWindow) {
              selectedMarker.infoWindow.close();
            }
            
            // Открываем новое инфо-окно
            infoWindow.open(map, marker);
            setSelectedMarker({ marker, infoWindow, warehouse });
            
            // Добавляем обработчик клика на кнопку "Выбрать"
            setTimeout(() => {
              const selectBtn = document.querySelector(`.select-warehouse-btn[data-ref="${warehouse.ref}"]`);
              if (selectBtn) {
                selectBtn.addEventListener('click', () => {
                  onSelectWarehouse && onSelectWarehouse(warehouse);
                  infoWindow.close();
                });
              }
            }, 100);
          });
          
          return { marker, infoWindow, warehouse };
        });
        
        // Автоматически центрируем карту на всех маркерах
        map.fitBounds(bounds);
        
        // Если маркеров мало, увеличиваем зум
        if (warehousesData.length < 2) {
          map.setZoom(15);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching warehouses:', err);
        setError('Не удалось загрузить отделения Новой почты');
        setLoading(false);
      }
    };
    
    fetchWarehouses();
    
    return () => {
      // Очистка маркеров, если компонент размонтируется
      warehouses.forEach(warehouse => {
        if (warehouse.marker) {
          warehouse.marker.setMap(null);
        }
      });
    };
  }, [mapInitialized, onSelectWarehouse]);
  
  return (
    <div className="nova-poshta-map-container">
      {loading && (
        <div className="map-loading">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </Spinner>
          <p>Загрузка отделений Новой почты...</p>
        </div>
      )}
      
      {error && (
        <Alert variant="danger">
          <Alert.Heading>Ошибка</Alert.Heading>
          <p>{error}</p>
        </Alert>
      )}
      
      <div 
        ref={mapRef} 
        className="nova-poshta-map"
        style={{ display: loading || error ? 'none' : 'block' }}
      ></div>
      
      {!loading && !error && (
        <div className="map-footer">
          <div>
            <small className="text-muted">
              Найдено отделений: {warehouses.length}
            </small>
          </div>
          <div className="map-legend">
            <div className="legend-item">
              <div className="legend-icon warehouse"></div>
              <div className="legend-text">Отделение</div>
            </div>
            <div className="legend-item">
              <div className="legend-icon poshtomat"></div>
              <div className="legend-text">Почтомат</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NovaPoshtaMap;