import React, { useState, useEffect } from 'react';


// Компонент для проверки и устранения проблем с API соединением
const ApiConnector = () => {
  const [apiStatus, setApiStatus] = useState('checking');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [httpResult, setHttpResult] = useState(null);
  const [httpsResult, setHttpsResult] = useState(null);

  // При монтировании компонента проверяем соединение
  useEffect(() => {
    checkConnections();
  }, []);

  const checkConnections = async () => {
    setApiStatus('checking');
    await testHttpsConnection();
    await testHttpConnection();

    // Определяем общий статус на основе результатов тестов
    if (httpsResult?.success) {
      setApiStatus('https-success');
    } else if (httpResult?.success) {
      setApiStatus('http-success');
    } else {
      setApiStatus('both-fail');
    }
  };

  const testHttpsConnection = async () => {
    try {
      const response = await fetch('https://localhost:7209/api/Product', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setHttpsResult({
          success: true,
          status: response.status,
          dataCount: data.length
        });
        return true;
      } else {
        setHttpsResult({
          success: false,
          status: response.status,
          error: response.statusText
        });
        return false;
      }
    } catch (error) {
      setHttpsResult({
        success: false,
        error: error.message
      });
      return false;
    }
  };

  const testHttpConnection = async () => {
    try {
      const response = await fetch('https://localhost:7209/api/Product', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setHttpResult({
          success: true,
          status: response.status,
          dataCount: data.length
        });
        return true;
      } else {
        setHttpResult({
          success: false,
          status: response.status,
          error: response.statusText
        });
        return false;
      }
    } catch (error) {
      setHttpResult({
        success: false,
        error: error.message
      });
      return false;
    }
  };

  const openHttpsCertificate = () => {
    window.open('https://localhost:7209/api/Product', '_blank');
  };

  // Определяем текст и класс сообщения в зависимости от статуса
  let messageText = 'Проверка соединения с API...';
  let messageClass = 'checking';

  if (apiStatus === 'https-success') {
    messageText = 'Соединение с API установлено через HTTPS';
    messageClass = 'success';
  } else if (apiStatus === 'http-success') {
    messageText = 'Соединение с API установлено через HTTP (незащищенное)';
    messageClass = 'warning';
  } else if (apiStatus === 'both-fail') {
    messageText = 'Не удалось подключиться к API. Проверьте, запущен ли сервер.';
    messageClass = 'error';
  }

  return (
    <div className="api-connector">
      <div className={`api-status-message ${messageClass}`}>
        <span className="status-icon"></span>
        <span className="status-text">{messageText}</span>
        <button 
          className="details-toggle" 
          onClick={() => setDetailsOpen(!detailsOpen)}
        >
          {detailsOpen ? 'Скрыть детали' : 'Показать детали'}
        </button>
      </div>

      {detailsOpen && (
        <div className="connector-details">
          <div className="connection-tests">
            <div className="test-group">
              <h4>HTTPS Соединение</h4>
              <div className={`test-result ${httpsResult?.success ? 'success' : 'error'}`}>
                {httpsResult === null ? (
                  <p>Проверка не выполнена</p>
                ) : httpsResult.success ? (
                  <>
                    <p>✅ Успешно</p>
                    <p>Статус: {httpsResult.status}</p>
                    <p>Получено товаров: {httpsResult.dataCount}</p>
                  </>
                ) : (
                  <>
                    <p>❌ Ошибка</p>
                    <p>Детали: {httpsResult.error}</p>
                    {httpsResult.error?.includes('certificate') && (
                      <div className="certificate-warning">
                        <p>Проблема с сертификатом разработки. Нажмите кнопку ниже, чтобы открыть API в новой вкладке и принять сертификат:</p>
                        <button onClick={openHttpsCertificate}>Открыть API и принять сертификат</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="test-group">
              <h4>HTTP Соединение</h4>
              <div className={`test-result ${httpResult?.success ? 'success' : 'error'}`}>
                {httpResult === null ? (
                  <p>Проверка не выполнена</p>
                ) : httpResult.success ? (
                  <>
                    <p>✅ Успешно</p>
                    <p>Статус: {httpResult.status}</p>
                    <p>Получено товаров: {httpResult.dataCount}</p>
                  </>
                ) : (
                  <>
                    <p>❌ Ошибка</p>
                    <p>Детали: {httpResult.error}</p>
                    <p>Убедитесь, что сервер настроен для работы без HTTPS и порт 7209 доступен.</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="solutions">
            <h4>Решение проблем</h4>
            {apiStatus === 'both-fail' && (
              <ul>
                <li>Убедитесь, что сервер API запущен</li>
                <li>Проверьте правильность настройки CORS в Program.cs</li>
                <li>Убедитесь, что порт 7209 не занят другим приложением</li>
                <li>Попробуйте перезапустить сервер API</li>
              </ul>
            )}
            
            {apiStatus === 'http-success' && (
              <div className="certificate-steps">
                <p>Для использования безопасного HTTPS соединения:</p>
                <ol>
                  <li>Откройте <a href="https://localhost:7209/api/Product" target="_blank">https://localhost:7209/api/Product</a> напрямую в браузере</li>
                  <li>Нажмите "Дополнительно" и затем "Перейти на сайт"</li>
                  <li>После того, как вы увидите ответ API в браузере, вернитесь в приложение</li>
                  <li>Нажмите на кнопку "Проверить снова" ниже</li>
                </ol>
              </div>
            )}
            
            <button className="retry-button" onClick={checkConnections}>
              Проверить снова
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiConnector;