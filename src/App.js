import React, { useEffect, useState } from 'react';
import axios from 'axios';
import logo from './logo.svg';
import './App.css';

function App() {
  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // useEffect для запроса данных о погоде
  useEffect(() => {
    axios.get('https://localhost:7209/WeatherForecast')  // Замените на ваш реальный URL
      .then(response => {
        setWeatherData(response.data);  // Сохраняем данные в состояние
        setLoading(false);               // Останавливаем индикатор загрузки
      })
      .catch(err => {
        setError(err);                   // Обрабатываем ошибку
        setLoading(false);
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>Weather Forecast</h1>
        
        {loading && <p>Loading weather data...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}

        {/* Отображение данных о погоде */}
        <div>
          {weatherData.length > 0 && (
            <ul>
              {weatherData.map((forecast, index) => (
                <li key={index}>
                  <strong>{forecast.date}</strong>: {forecast.temperatureC}°C ({forecast.temperatureF}°F) - {forecast.summary}
                </li>
              ))}
            </ul>
          )}
        </div>

        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
