import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { apiClient } from './ApiService';
import './Login.css';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const navigate = useNavigate();

    // Show demo hint on component mount
    useEffect(() => {
        showDemoHint();
    }, []);

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
            localStorage.setItem('isBusiness', userData.isBusiness ? userData.isBusiness.toString() : 'false');
            
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

    // Show loading state
    const showLoading = (isGoogle = false) => {
        if (isGoogle) {
            setGoogleLoading(true);
        } else {
            setLoading(true);
        }
    };

    // Hide loading state
    const hideLoading = (isGoogle = false) => {
        if (isGoogle) {
            setGoogleLoading(false);
        } else {
            setLoading(false);
        }
    };

    // Show error message
    const showError = (errorMessage) => {
        setMessage(errorMessage);
        setTimeout(() => {
            setMessage('');
        }, 5000);
    };

    // Show demo hint
    const showDemoHint = () => {
        setTimeout(() => {
            const hint = document.createElement('div');
            
            document.body.appendChild(hint);
            
            setTimeout(() => {
                hint.classList.add('show');
            }, 100);

            setTimeout(() => {
                hint.classList.remove('show');
                setTimeout(() => hint.remove(), 300);
            }, 5000);
        }, 2000);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        showLoading();
        setMessage('');
        
        try {
            const response = await axios.post('https://localhost:7209/api/Authentication/login', {
                username,
                password,
            });
            
            const token = response.data.token;
            localStorage.setItem('token', token);
            
            // Проверяем статус пользователя
            await checkUserStatus(token);
            
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
                showError('Login failed: ' + error.response.data.message);
            } else if (error.message) {
                showError('Login failed: ' + error.message);
            } else {
                showError('Login failed: Server error');
            }
        } finally {
            hideLoading();
        }
    };
    
    // Direct Google login - avoid CORS issues
    const handleGoogleLogin = () => {
        showLoading(true);
        // Direct browser navigation to Google auth endpoint
        window.location.href = 'https://localhost:7209/api/GoogleAuth/login';
    };

    // Handle input validation
    const handleInputChange = (e, setter) => {
        setter(e.target.value);
        // Clear error border if exists
        if (e.target.style.borderColor === 'rgb(211, 47, 47)') {
            e.target.style.borderColor = '';
        }
    };

    const handleInputBlur = (e) => {
        if (e.target.value.trim() === '') {
            e.target.style.borderColor = '#d32f2f';
        }
    };

    return (
        <div className="app-container">
            <div className="login-container">
                {/* Decorative Left Panel */}
                <div className="decorative-panel">
                    <div className="geometric-shape shape-1"></div>
                    <div className="geometric-shape shape-2"></div>
                    <div className="geometric-shape shape-3"></div>
                    
                    <div className="brand-section">
                        <h1 className="brand-title">OG</h1>
                        <p className="brand-subtitle">
                            marketplace
                        </p>
                    </div>
                </div>

                {/* Form Panel */}
                <div className="login-content">
                    <div className="login-form">
                        <div className="form-header">
                            <h2 className="form-title">Welcome Back</h2>
                            <p className="form-subtitle">Sign in to your account</p>
                        </div>

                        <form onSubmit={handleLogin}>
                            <div className="form-group">
                                <label htmlFor="username">
                                    Username <span className="required">*</span>
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => handleInputChange(e, setUsername)}
                                    onBlur={handleInputBlur}
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
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => handleInputChange(e, setPassword)}
                                    onBlur={handleInputBlur}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group remember-me">
                                <input type="checkbox" id="remember" />
                                <label htmlFor="remember">Remember me</label>
                            </div>

                            <button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <span className="loading-spinner"></span>
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        <div className="oauth-section">
                            <div className="divider">
                                <span className="divider-text">or continue with</span>
                            </div>

                            <button 
                                className="google-button" 
                                onClick={handleGoogleLogin}
                                disabled={googleLoading}
                            >
                                {googleLoading ? (
                                    <>
                                        <span className="loading-spinner" style={{borderTopColor: '#333'}}></span>
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <div className="google-icon"></div>
                                        Continue with Google
                                    </>
                                )}
                            </button>
                        </div>

                        {message && <div className="error-message">{message}</div>}
                        
                        <Link to="/register" className="register-link">
                            Create new account
                        </Link>
                        
                        <p className="forgot-password">Forgot your password?</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;