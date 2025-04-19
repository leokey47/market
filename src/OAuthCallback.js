import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import 'bootstrap/dist/css/bootstrap.min.css';

function OAuthCallback() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const processOAuthRedirect = async () => {
            try {
                console.log("Обработка OAuth-перенаправления. Параметры URL:", location.search);
                
                // Проверяем наличие параметра error
                const params = new URLSearchParams(location.search);
                const errorMsg = params.get('error');
                
                if (errorMsg) {
                    console.error("Ошибка аутентификации:", errorMsg);
                    setError(errorMsg);
                    setLoading(false);
                    return;
                }
                
                // Получаем токен из параметров URL
                const token = params.get('token');
                
                if (!token) {
                    console.error("Токен не найден в параметрах URL");
                    setError('Токен аутентификации не получен');
                    setLoading(false);
                    return;
                }
                
                console.log("Токен получен, декодирование...");
                
                // Декодируем токен для получения информации о пользователе
                const decodedToken = jwtDecode(token);
                console.log("Декодированный токен:", decodedToken);
                
                // Поиск userId в токене
                let userId = null;
                
                // Ищем userId в различных возможных форматах
                if (decodedToken.userId) {
                    userId = decodedToken.userId;
                } else if (decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']) {
                    userId = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
                } else {
                    // Ищем любое поле, содержащее userId или id
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
                    // Ищем любое поле, содержащее name
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
                
                // Поиск email пользователя
                let userEmail = null;
                if (decodedToken.email) {
                    userEmail = decodedToken.email;
                } else if (decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']) {
                    userEmail = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
                } else {
                    // Ищем любое поле, содержащее email
                    for (const key in decodedToken) {
                        if (key.toLowerCase().includes('email') && typeof decodedToken[key] === 'string') {
                            userEmail = decodedToken[key];
                            break;
                        }
                    }
                }
                
                // Поиск URL изображения профиля
                let profileImage = null;
                if (decodedToken.picture) {
                    profileImage = decodedToken.picture;
                } else if (decodedToken['urn:google:image']) {
                    profileImage = decodedToken['urn:google:image'];
                } else if (decodedToken.profileImageUrl) {
                    profileImage = decodedToken.profileImageUrl;
                }
                
                if (!userId) {
                    console.error("UserId не найден в токене", decodedToken);
                    setError('Недопустимые данные токена');
                    setLoading(false);
                    return;
                }
                
                console.log(`Данные пользователя: ID=${userId}, Имя=${userName}, Роль=${userRole}, Email=${userEmail}, Изображение=${profileImage}`);
                
                // Сохраняем данные аутентификации в localStorage
                localStorage.setItem('token', token);
                localStorage.setItem('userId', userId);
                localStorage.setItem('username', userName || 'Пользователь');
                localStorage.setItem('role', userRole);
                
                // Сохраняем дополнительную информацию, если она доступна
                if (userEmail) {
                    localStorage.setItem('userEmail', userEmail);
                }
                
                if (profileImage) {
                    localStorage.setItem('profileImage', profileImage);
                }
                
                // Создаем и отправляем событие для уведомления приложения об изменении состояния аутентификации
                const authStateChangeEvent = new Event('authStateChange');
                window.dispatchEvent(authStateChangeEvent);
                
                // Пробуем получить данные корзины для инициализации счетчиков
                try {
                    const response = await fetch('https://localhost:7209/api/Cart', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (response.ok) {
                        const cartItems = await response.json();
                        console.log("Получены данные корзины", cartItems.length, "товаров");
                        localStorage.setItem('cartCount', cartItems.length.toString());
                        
                        // Отправляем событие обновления корзины, если оно существует
                        if (window.cartUpdateEvent) {
                            window.dispatchEvent(window.cartUpdateEvent);
                        }
                    }
                } catch (error) {
                    console.warn("Не удалось загрузить данные корзины", error);
                    localStorage.setItem('cartCount', '0');
                }
                
                // Также получаем количество товаров в списке желаемого
                try {
                    const response = await fetch('https://localhost:7209/api/Wishlist', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (response.ok) {
                        const wishlistItems = await response.json();
                        localStorage.setItem('wishlistCount', wishlistItems.length.toString());
                        
                        // Отправляем событие обновления списка желаемого, если оно существует
                        if (window.wishlistUpdateEvent) {
                            window.dispatchEvent(window.wishlistUpdateEvent);
                        }
                    }
                } catch (error) {
                    console.warn("Не удалось загрузить данные списка желаемого", error);
                    localStorage.setItem('wishlistCount', '0');
                }
                
                // Перенаправляем на административную или домашнюю страницу в зависимости от роли
                console.log("Перенаправление пользователя...");
                if (userRole === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/');
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
                <p className="mt-3">Завершение процесса аутентификации...</p>
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

    return null; // Не рендерится, так как будет перенаправление
}

export default OAuthCallback;