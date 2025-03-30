import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode"; // ИСПРАВЛЕННЫЙ ИМПОРТ

import './Login.css';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('https://localhost:7209/api/Authentication/login', {
                username,
                password,
            });
            const token = response.data.token;
            localStorage.setItem('token', token);

            // Decode the token
            const decodedToken = jwtDecode(token); // ИСПРАВЛЕННЫЙ ВЫЗОВ
            console.log('Decoded token:', decodedToken); // Debugging token structure

            const userId = decodedToken.userId; // Get userId from token
            const userName = decodedToken.unique_name; // Get username from token

            if (userId && userName) {
                localStorage.setItem('userId', userId); // Save userId in localStorage
                localStorage.setItem('username', userName); // Save username in localStorage
            } else {
                console.error('userId or username not found in token');
            }

            // Redirect based on user role
            const userRole = decodedToken.role;
            if (userRole === 'admin') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch (error) {
            setMessage('Login failed: ' + (error.response ? error.response.data : error.message));
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
