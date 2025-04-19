import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import OAuthLogin from './OAuthLogin';
import './Login.css';

function Register() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [reason, setReason] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        // Client-side validation
        if (!email || !username || !password || !confirmPassword || !reason) {
            setMessage("All fields are required");
            return;
        }

        if (!validateEmail(email)) {
            setMessage("Invalid email format");
            return;
        }

        if (/\s/.test(username) || /\s/.test(password) || /\s/.test(confirmPassword)) {
            setMessage("Spaces are not allowed in username or password");
            return;
        }

        if (password.length < 8) {
            setMessage("Password must be at least 8 characters long");
            return;
        }

        if (password !== confirmPassword) {
            setMessage("Passwords do not match");
            return;
        }

        try {
            const response = await fetch('https://localhost:7209/api/Authentication/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password,
                    reason: reason,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setMessage("Registration error: " + errorData.message);
            } else {
                const data = await response.json();
                setMessage("Registration successful!");
                navigate('/login');
            }
        } catch (error) {
            setMessage("An error occurred: " + error.message);
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
                        <h2>Register</h2>
                        <form onSubmit={handleRegister}>
                            <div className="form-group">
                                <label htmlFor="email">
                                    Email <span className="required">*</span>
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="E-mail"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
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
                            <div className="form-group">
                                <label htmlFor="confirmPassword">
                                    Confirm Password <span className="required">*</span>
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="reason">
                                    Reason for Registration <span className="required">*</span>
                                </label>
                                <textarea
                                    id="reason"
                                    placeholder="Reason for registration"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit">Register</button>
                        </form>
                        
                        {/* OAuth Login Component */}
                        <OAuthLogin />
                        
                        {message && <p className={message.includes("successful") ? "success-message" : "error-message"}>
                            {message}
                        </p>}
                        <Link to="/login" className="register-link">
                            Already have an account? Log in
                        </Link>
                    </div>
                </div>
                <div className="creativity-message">
                    <p className="undertext">Express your respect for creativity by posting reviews, analyses, and critiques</p>
                    <img src="/images/lzt_logo.png" alt="LZT Logo" />
                </div>
            </div>
        </div>
    );
}

export default Register;