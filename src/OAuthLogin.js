import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function OAuthLogin() {
    // Используем HTTPS для базового URL API
    const apiBaseUrl = 'https://localhost:7209/api';
   
    return (
        <div className="oauth-container">
            <div className="d-flex align-items-center my-3">
                <hr className="flex-grow-1" />
                <span className="mx-2 text-muted">ИЛИ</span>
                <hr className="flex-grow-1" />
            </div>
           
            <div className="d-grid gap-2">
                {/*
                  ВАЖНО: Используем обычный тег <a> с атрибутом href вместо кнопки с обработчиком onClick.
                  Это обеспечивает прямую навигацию браузера, а не AJAX/XHR запрос, что помогает избежать проблем с CORS.
                */}
                <a
                    className="btn btn-outline-danger"
                    href={`${apiBaseUrl}/GoogleAuth/login`}
                    role="button"
                >
                    <i className="bi bi-google me-2"></i>
                    Войти через Google
                </a>
            </div>
        </div>
    );
}

export default OAuthLogin;