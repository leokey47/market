import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

function Register() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [reason, setReason] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('error');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const navigate = useNavigate();

    // ИСПРАВЛЕНО: Более безопасное добавление класса
    useEffect(() => {
        // Добавляем класс только к body, не влияя на другие элементы
        const originalClass = document.body.className;
        document.body.classList.add('register-page');
        showDemoHint();
        
        return () => {
            // Восстанавливаем оригинальные классы при размонтировании
            document.body.className = originalClass;
        };
    }, []);

    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const validateForm = () => {
        const errors = {};

        if (!email) {
            errors.email = 'Email is required';
        } else if (!validateEmail(email)) {
            errors.email = 'Invalid email format';
        }

        if (!username) {
            errors.username = 'Username is required';
        } else if (/\s/.test(username)) {
            errors.username = 'Username cannot contain spaces';
        } else if (username.length < 3) {
            errors.username = 'Username must be at least 3 characters long';
        }

        if (!password) {
            errors.password = 'Password is required';
        } else if (password.length < 8) {
            errors.password = 'Password must be at least 8 characters long';
        } else if (/\s/.test(password)) {
            errors.password = 'Password cannot contain spaces';
        }

        if (!confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        if (!reason) {
            errors.reason = 'Reason for registration is required';
        } else if (reason.length < 10) {
            errors.reason = 'Please provide a more detailed reason (at least 10 characters)';
        }

        return errors;
    };

    const showMessage = (text, type = 'error') => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
        }, 5000);
    };

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
            }, 7000);
        }, 1500);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        setValidationErrors({});
        
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            showMessage("Please fix the errors below");
            return;
        }

        setLoading(true);
        showMessage('');

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
                showMessage("Registration error: " + errorData.message);
            } else {
                const data = await response.json();
                showMessage("Registration successful! Redirecting to login...", 'success');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        } catch (error) {
            showMessage("An error occurred: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        setGoogleLoading(true);
        window.location.href = 'https://localhost:7209/api/GoogleAuth/login';
    };

    const handleInputChange = (e, setter, fieldName) => {
        setter(e.target.value);
        if (validationErrors[fieldName]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }
        if (e.target.style.borderColor === 'rgb(211, 47, 47)') {
            e.target.style.borderColor = '';
        }
    };

    const handleInputBlur = (e, fieldName) => {
        const errors = validateForm();
        if (errors[fieldName]) {
            setValidationErrors(prev => ({ ...prev, [fieldName]: errors[fieldName] }));
            e.target.style.borderColor = '#d32f2f';
        }
    };

    return (
        <div className="app-container">
            <div className="login-container">
                <div className="decorative-panel">
                    <div className="geometric-shape shape-1"></div>
                    <div className="geometric-shape shape-2"></div>
                    <div className="geometric-shape shape-3"></div>
                    
                    <div className="brand-section">
                        <h1 className="brand-title">Join Us</h1>
                        <p className="brand-subtitle">
                            Create your account and become part of our creative marketplace community
                        </p>
                    </div>
                </div>

                <div className="login-content">
                    <div className="login-form">
                        <div className="form-header">
                            <h2 className="form-title">Create Account</h2>
                            <p className="form-subtitle">Join our exclusive marketplace</p>
                        </div>

                        <form onSubmit={handleRegister}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="email">
                                        Email <span className="required">*</span>
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => handleInputChange(e, setEmail, 'email')}
                                        onBlur={(e) => handleInputBlur(e, 'email')}
                                        required
                                        disabled={loading}
                                        style={validationErrors.email ? {borderColor: '#d32f2f'} : {}}
                                    />
                                    {validationErrors.email && (
                                        <div className="field-error">{validationErrors.email}</div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="username">
                                        Username <span className="required">*</span>
                                    </label>
                                    <input
                                        id="username"
                                        type="text"
                                        placeholder="Choose a username"
                                        value={username}
                                        onChange={(e) => handleInputChange(e, setUsername, 'username')}
                                        onBlur={(e) => handleInputBlur(e, 'username')}
                                        required
                                        disabled={loading}
                                        style={validationErrors.username ? {borderColor: '#d32f2f'} : {}}
                                    />
                                    {validationErrors.username && (
                                        <div className="field-error">{validationErrors.username}</div>
                                    )}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="password">
                                        Password <span className="required">*</span>
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        placeholder="Create a password"
                                        value={password}
                                        onChange={(e) => handleInputChange(e, setPassword, 'password')}
                                        onBlur={(e) => handleInputBlur(e, 'password')}
                                        required
                                        disabled={loading}
                                        style={validationErrors.password ? {borderColor: '#d32f2f'} : {}}
                                    />
                                    {validationErrors.password && (
                                        <div className="field-error">{validationErrors.password}</div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmPassword">
                                        Confirm Password <span className="required">*</span>
                                    </label>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Confirm your password"
                                        value={confirmPassword}
                                        onChange={(e) => handleInputChange(e, setConfirmPassword, 'confirmPassword')}
                                        onBlur={(e) => handleInputBlur(e, 'confirmPassword')}
                                        required
                                        disabled={loading}
                                        style={validationErrors.confirmPassword ? {borderColor: '#d32f2f'} : {}}
                                    />
                                    {validationErrors.confirmPassword && (
                                        <div className="field-error">{validationErrors.confirmPassword}</div>
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="reason">
                                    Reason for Registration <span className="required">*</span>
                                </label>
                                <textarea
                                    id="reason"
                                    placeholder="Tell us why you want to join our marketplace..."
                                    value={reason}
                                    onChange={(e) => handleInputChange(e, setReason, 'reason')}
                                    onBlur={(e) => handleInputBlur(e, 'reason')}
                                    required
                                    disabled={loading}
                                    rows="4"
                                    style={validationErrors.reason ? {borderColor: '#d32f2f'} : {}}
                                />
                                {validationErrors.reason && (
                                    <div className="field-error">{validationErrors.reason}</div>
                                )}
                            </div>

                            <button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <span className="loading-spinner"></span>
                                        Creating Account...
                                    </>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </form>

                        <div className="oauth-section">
                            <div className="divider">
                                <span className="divider-text">or sign up with</span>
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
                                        Sign up with Google
                                    </>
                                )}
                            </button>
                        </div>

                        {message && (
                            <div className={messageType === 'success' ? 'success-message' : 'error-message'}>
                                {message}
                            </div>
                        )}
                        
                        <Link to="/login" className="register-link">
                            Already have an account? Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;