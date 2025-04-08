import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './Login.css';

// Custom event for auth state changes
const authStateChangeEvent = new Event('authStateChange');

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    // Helper function to update auth state and dispatch event
    const updateAuthState = (token, userId, userName, userRole) => {
        localStorage.setItem('token', token);
        localStorage.setItem('userId', userId);
        localStorage.setItem('username', userName);
        localStorage.setItem('role', userRole);
        
        // Dispatch custom event to notify Navbar about auth state change
        window.dispatchEvent(authStateChangeEvent);
        
        // Also fetch and update cart and wishlist counts if applicable
        fetchUserCounts(token);
    };
    
    // Function to fetch cart and wishlist counts after login
    const fetchUserCounts = async (token) => {
        try {
            // Fetch cart count
            const cartResponse = await axios.get('https://localhost:7209/api/Cart/count', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (cartResponse.data) {
                localStorage.setItem('cartCount', cartResponse.data.toString());
                // Dispatch cart update event if it exists
                if (window.cartUpdateEvent) {
                    window.dispatchEvent(window.cartUpdateEvent);
                }
            }
            
            // Fetch wishlist count
            const wishlistResponse = await axios.get('https://localhost:7209/api/Wishlist/count', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (wishlistResponse.data) {
                localStorage.setItem('wishlistCount', wishlistResponse.data.toString());
                // Dispatch wishlist update event if it exists
                if (window.wishlistUpdateEvent) {
                    window.dispatchEvent(window.wishlistUpdateEvent);
                }
            }
        } catch (error) {
            console.error('Error fetching user counts:', error);
            // Set default counts to 0 if fetch fails
            localStorage.setItem('cartCount', '0');
            localStorage.setItem('wishlistCount', '0');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('https://localhost:7209/api/Authentication/login', {
                username,
                password,
            });
            const token = response.data.token;
            
            const decodedToken = jwtDecode(token);
            const userId = decodedToken.userId; 
            const userName = decodedToken.name; 
            const userRole = decodedToken.role;

            if (userId && userName) {
                // Update auth state and trigger Navbar update
                updateAuthState(token, userId, userName, userRole);
                
                if (userRole === 'admin') {
                    navigate('/admin'); // Перенаправление в админку
                } else {
                    navigate('/');
                }
            } else {
                console.error('userId or username not found in token');
                setMessage('Login failed: Invalid token data');
            }
        } catch (error) {
            setMessage('Login failed: ' + (error.response ? error.response.data.message : error.message));
        }
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
                                />
                            </div>
                            <div className="form-group remember-me">
                                <input type="checkbox" id="remember" />
                                <label htmlFor="remember">Remember me</label>
                            </div>

                            <button type="submit">Login</button>
                        </form>
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