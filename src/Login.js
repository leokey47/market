import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { apiClient } from './ApiService';
import OAuthLogin from './OAuthLogin';
import './Login.css';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Helper function to check user status and save all data
    const checkUserStatus = async (token) => {
        try {
            apiClient.defaults.headers.Authorization = `Bearer ${token}`;
            const userId = jwtDecode(token).userId;
            
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
            
            // Обновляем состояние аутентификации
            const authStateChangeEvent = new Event('authStateChange');
            window.dispatchEvent(authStateChangeEvent);
            
            // Получаем счетчики
            await fetchUserCounts(token);
            
            return true;
        } catch (error) {
            console.error('Error checking user status:', error);
            // Все еще позволяем вход, используя данные из токена
            const decodedToken = jwtDecode(token);
            localStorage.setItem('userId', decodedToken.userId);
            localStorage.setItem('username', decodedToken.name || 'Пользователь');
            localStorage.setItem('role', decodedToken.role || 'user');
            localStorage.setItem('isBusiness', 'false');
            return false;
        }
    };
    
    // Function to fetch cart and wishlist counts after login
    const fetchUserCounts = async (token) => {
        try {
            const api = axios.create({
                baseURL: 'https://localhost:7209/api',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            // Fetch cart count
            const cartResponse = await api.get('/Cart');
            if (cartResponse.data) {
                localStorage.setItem('cartCount', cartResponse.data.length.toString());
                const cartUpdateEvent = new Event('cartUpdate');
                window.dispatchEvent(cartUpdateEvent);
            }
            
            // Fetch wishlist count
            const wishlistResponse = await api.get('/Wishlist');
            if (wishlistResponse.data) {
                localStorage.setItem('wishlistCount', wishlistResponse.data.length.toString());
                const wishlistUpdateEvent = new Event('wishlistUpdate');
                window.dispatchEvent(wishlistUpdateEvent);
            }
        } catch (error) {
            console.error('Error fetching user counts:', error);
            localStorage.setItem('cartCount', '0');
            localStorage.setItem('wishlistCount', '0');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        
        try {
            const response = await axios.post('https://localhost:7209/api/Authentication/login', {
                username,
                password,
            });
            
            const token = response.data.token;
            localStorage.setItem('token', token);
            
            // Проверяем статус пользователя
            const statusChecked = await checkUserStatus(token);
            
            // Перенаправляем
            const redirectPath = localStorage.getItem('loginRedirect') || '/';
            localStorage.removeItem('loginRedirect');
            
            const role = localStorage.getItem('role');
            if (role === 'admin') {
                navigate('/admin');
            } else {
                navigate(redirectPath);
            }
            
        } catch (error) {
            console.error('Login error:', error);
            
            if (error.response && error.response.data && error.response.data.message) {
                setMessage('Login failed: ' + error.response.data.message);
            } else if (error.message) {
                setMessage('Login failed: ' + error.message);
            } else {
                setMessage('Login failed: Server error');
            }
        } finally {
            setLoading(false);
        }
    };
    
    // Direct Google login - avoid CORS issues
    const handleGoogleLogin = () => {
        // Direct browser navigation to Google auth endpoint
        window.location.href = 'https://localhost:7209/api/GoogleAuth/login';
    };

    return (
        <div className="app-container">
            <div className="login-container">
                <div className="login-content">
                    <div className="scrolling-albums">
                        <div className="albums">
                            <img src="/images/auth-thumbs.png" alt="Cover" />
                        </div>
                        <div className="albums">
                            <img src="/images/auth-thumbs.png" alt="Cover" />
                        </div>
                    </div>
                    <div className="login-form">
                        <form onSubmit={handleLogin}>
                            <div className="form-group">
                                <label htmlFor="username">
                                    Username <span className="required">*</span>
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="password">
                                    Password <span className="required">*</span>
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group remember-me">
                                <input type="checkbox" id="remember" />
                                <label htmlFor="remember">Remember me</label>
                            </div>

                            <button type="submit" disabled={loading}>
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                        </form>
                        
                        {/* OAuth Login Component */}
                        <OAuthLogin />
                        
                        {message && <p className="error-message">{message}</p>}
                        <Link to="/register" className="register-link">Register</Link>
                        <p className="forgot-password">Forgot password?</p>
                    </div>
                </div>
                <div className="creativity-message">
                    <p className="undertext">
                        Express your respect for creativity by posting reviews, analyses, and critiques
                    </p>
                    <img src="/images/lzt_logo.png" alt="LZT Logo" />
                </div>
            </div>
        </div>
    );
}

export default Login;