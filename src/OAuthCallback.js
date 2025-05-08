import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { apiClient } from './ApiService';
import 'bootstrap/dist/css/bootstrap.min.css';

function OAuthCallback() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const processOAuthRedirect = async () => {
            try {
                console.log("Обработка OAuth-перенаправления. Параметры URL:", location.search);
                
                const params = new URLSearchParams(location.search);
                const errorMsg = params.get('error');
                
                if (errorMsg) {
                    console.error("Ошибка аутентификации:", errorMsg);
                    setError(errorMsg);
                    setLoading(false);
                    return;
                }
                
                const token = params.get('token');
                
                if (!token) {
                    console.error("Токен не найден в параметрах URL");
                    setError('Токен аутентификации не получен');
                    setLoading(false);
                    return;
                }
                
                console.log("Токен получен, декодирование...");
                setMessage('Aутентификация успешна, получение данных профиля...');
                
                const decodedToken = jwtDecode(token);
                console.log("Декодированный токен:", decodedToken);
                
                // Поиск userId в токене
                let userId = null;
                if (decodedToken.userId) {
                    userId = decodedToken.userId;
                } else if (decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']) {
                    userId = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
                } else {
                    for (const key in decodedToken) {
                        if (key.toLowerCase().includes('userid') || key.toLowerCase() === 'id') {
                            userId = decodedToken[key];
                            break;
                        }
                    }
                }
                
                // Поиск имени пользователя
                let userName = null;
                if (decodedToken.name) {
                    userName = decodedToken.name;
                } else if (decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']) {
                    userName = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
                } else {
                    for (const key in decodedToken) {
                        if (key.toLowerCase().includes('name') && typeof decodedToken[key] === 'string') {
                            userName = decodedToken[key];
                            break;
                        }
                    }
                }
                
                // Поиск роли пользователя
                let userRole = 'user';
                if (decodedToken.role) {
                    userRole = decodedToken.role;
                } else if (decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']) {
                    userRole = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
                }
                
                if (!userId) {
                    console.error("UserId не найден в токене", decodedToken);
                    setError('Недопустимые данные токена');
                    setLoading(false);
                    return;
                }
                
                console.log(`Данные пользователя: ID=${userId}, Имя=${userName}, Роль=${userRole}`);
                
                // Сохраняем токен
                localStorage.setItem('token', token);
                
                try {
                    // Получаем полные данные пользователя
                    apiClient.defaults.headers.Authorization = `Bearer ${token}`;
                    const userResponse = await apiClient.get(`/api/User/${userId}`);
                    const userData = userResponse.data;
                    
                    // Сохраняем все данные пользователя
                    localStorage.setItem('userId', userData.userId.toString());
                    localStorage.setItem('username', userData.username);
                    localStorage.setItem('userEmail', userData.email);
                    localStorage.setItem('role', userData.role);
                    localStorage.setItem('isBusiness', userData.isBusiness.toString());
                    
                    if (userData.profileImageUrl) {
                        localStorage.setItem('profileImage', userData.profileImageUrl);
                    }
                    
                    // Если бизнес аккаунт, сохраняем дополнительную информацию
                    if (userData.isBusiness) {
                        localStorage.setItem('companyName', userData.companyName || '');
                        localStorage.setItem('companyAvatar', userData.companyAvatar || '');
                        localStorage.setItem('companyDescription', userData.companyDescription || '');
                    }
                    
                    // Создаем и отправляем событие для уведомления приложения об изменении состояния аутентификации
                    const authStateChangeEvent = new Event('authStateChange');
                    window.dispatchEvent(authStateChangeEvent);
                    
                    // Получаем данные корзины
                    try {
                        const cartResponse = await apiClient.get('/api/Cart');
                        localStorage.setItem('cartCount', cartResponse.data.length.toString());
                        const cartUpdateEvent = new Event('cartUpdate');
                        window.dispatchEvent(cartUpdateEvent);
                    } catch (error) {
                        console.warn("Не удалось загрузить данные корзины", error);
                        localStorage.setItem('cartCount', '0');
                    }
                    
                    // Получаем данные списка желаемого
                    try {
                        const wishlistResponse = await apiClient.get('/api/Wishlist');
                        localStorage.setItem('wishlistCount', wishlistResponse.data.length.toString());
                        const wishlistUpdateEvent = new Event('wishlistUpdate');
                        window.dispatchEvent(wishlistUpdateEvent);
                    } catch (error) {
                        console.warn("Не удалось загрузить данные списка желаемого", error);
                        localStorage.setItem('wishlistCount', '0');
                    }
                    
                    setMessage('Вход выполнен успешно! Перенаправление...');
                    
                    // Перенаправляем через секунду
                    setTimeout(() => {
                        if (userRole === 'admin') {
                            navigate('/admin');
                        } else {
                            navigate('/');
                        }
                    }, 1000);
                    
                } catch (error) {
                    console.error('Ошибка получения данных пользователя:', error);
                    // Все еще позволяем вход, используя данные из токена
                    localStorage.setItem('userId', userId);
                    localStorage.setItem('username', userName || 'Пользователь');
                    localStorage.setItem('role', userRole);
                    localStorage.setItem('isBusiness', 'false');
                    localStorage.setItem('cartCount', '0');
                    localStorage.setItem('wishlistCount', '0');
                    
                    const authStateChangeEvent = new Event('authStateChange');
                    window.dispatchEvent(authStateChangeEvent);
                    
                    setMessage('Вход выполнен, но некоторые данные профиля недоступны');
                    setTimeout(() => navigate('/'), 1000);
                }
                
            } catch (error) {
                console.error('Ошибка при обработке OAuth-перенаправления:', error);
                setError(`Ошибка аутентификации: ${error.message || 'Неизвестная ошибка'}`);
                setLoading(false);
            }
        };
        
        processOAuthRedirect();
    }, [location, navigate]);

    if (loading) {
        return (
            <div className="container mt-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Загрузка...</span>
                </div>
                <p className="mt-3">{message || 'Завершение процесса аутентификации...'}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-5 text-center">
                <div className="alert alert-danger">
                    <h4>Ошибка аутентификации</h4>
                    <p>{error}</p>
                </div>
                <div className="mt-3">
                    <p>Возможные решения:</p>
                    <ul className="list-group text-start">
                        <li className="list-group-item">Убедитесь, что вы используете действительный аккаунт Google</li>
                        <li className="list-group-item">Попробуйте очистить куки и кэш браузера</li>
                        <li className="list-group-item">Проверьте, правильно ли настроено приложение</li>
                    </ul>
                </div>
                <button 
                    className="btn btn-primary mt-3" 
                    onClick={() => navigate('/login')}
                >
                    Вернуться к входу
                </button>
            </div>
        );
    }

    return null;
}

export default OAuthCallback;