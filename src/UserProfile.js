import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserProfile.css';
import { apiClient, UserService, CloudinaryService, BusinessService } from './ApiService';

function UserProfile() {
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        email: ''
    });
    const [avatarUrl, setAvatarUrl] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');
    const [showBusinessForm, setShowBusinessForm] = useState(false);
    const [businessData, setBusinessData] = useState({
        companyName: '',
        companyAvatar: null,
        companyDescription: ''
    });
    const [companyAvatarUrl, setCompanyAvatarUrl] = useState('');
    const [statusMessage, setStatusMessage] = useState(null);
    const navigate = useNavigate();

    // Синхронизация данных пользователя с localStorage
    const syncUserDataToLocalStorage = (userData) => {
        localStorage.setItem('userId', userData.userId.toString());
        localStorage.setItem('username', userData.username);
        localStorage.setItem('userEmail', userData.email);
        localStorage.setItem('role', userData.role);
        localStorage.setItem('isBusiness', userData.isBusiness ? 'true' : 'false');
       
        if (userData.profileImageUrl) {
            localStorage.setItem('profileImage', userData.profileImageUrl);
        }
       
        if (userData.isBusiness) {
            localStorage.setItem('companyName', userData.companyName || '');
            localStorage.setItem('companyAvatar', userData.companyAvatar || '');
            localStorage.setItem('companyDescription', userData.companyDescription || '');
        }
       
        const authStateChangeEvent = new Event('authStateChange');
        window.dispatchEvent(authStateChangeEvent);
    };

    // Обновление данных пользователя
    const refreshUserData = async () => {
        const userId = localStorage.getItem('userId');
        if (!userId) return;
       
        try {
            const response = await apiClient.get(`/api/User/${userId}`);
            if (response.data) {
                setUser(response.data);
                setFormData({
                    username: response.data.username || '',
                    email: response.data.email || ''
                });
                setAvatarUrl(response.data.profileImageUrl || '');
                syncUserDataToLocalStorage(response.data);
                setError(null);
                setStatusMessage({ type: 'success', text: 'Данные обновлены' });
                setTimeout(() => setStatusMessage(null), 3000);
                return true;
            }
        } catch (error) {
            console.error('Ошибка обновления данных:', error);
            setStatusMessage({ type: 'error', text: 'Ошибка обновления данных' });
            setTimeout(() => setStatusMessage(null), 3000);
            return false;
        }
    };

    const handleBusinessProfileUpdate = async (e) => {
        e.preventDefault();
        const userId = localStorage.getItem('userId');
        setUploadStatus('Обновление бизнес-информации...');
       
        try {
            let companyAvatarUrl = user.companyAvatar;
           
            if (businessData.companyAvatar) {
                setUploadStatus('Загрузка логотипа компании...');
                const uploadResponse = await CloudinaryService.uploadImage(businessData.companyAvatar);
               
                if (uploadResponse && uploadResponse.imageUrl) {
                    companyAvatarUrl = uploadResponse.imageUrl;
                }
            }
           
            await UserService.updateBusinessInfo(userId, {
                companyName: businessData.companyName || user.companyName,
                companyAvatar: companyAvatarUrl,
                companyDescription: businessData.companyDescription || user.companyDescription
            });
           
            const updatedUserData = {
                ...user,
                companyName: businessData.companyName || user.companyName,
                companyAvatar: companyAvatarUrl,
                companyDescription: businessData.companyDescription || user.companyDescription
            };
           
            setUser(updatedUserData);
            syncUserDataToLocalStorage(updatedUserData);
           
            setUploadStatus('');
            setStatusMessage({ type: 'success', text: 'Бизнес-информация обновлена' });
            setTimeout(() => setStatusMessage(null), 3000);
           
        } catch (error) {
            console.error('Ошибка при обновлении бизнес-информации:', error);
            setUploadStatus('');
            setStatusMessage({ type: 'error', text: 'Ошибка обновления бизнес-информации' });
            setTimeout(() => setStatusMessage(null), 3000);
        }
    };

    useEffect(() => {
        const fetchUserProfile = async () => {
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('userId');
           
            if (!token || !userId) {
                navigate('/login');
                return;
            }
           
            try {
                const response = await apiClient.get(`/api/User/${userId}`);
               
                if (response.data) {
                    setUser(response.data);
                    setFormData({
                        username: response.data.username || '',
                        email: response.data.email || ''
                    });
                    setAvatarUrl(response.data.profileImageUrl || '');
                    syncUserDataToLocalStorage(response.data);
                }
                setIsLoading(false);
            } catch (error) {
                console.error('Ошибка при получении профиля пользователя:', error);
               
                const username = localStorage.getItem('username');
                const email = localStorage.getItem('userEmail') || 'example@example.com';
                const profileImage = localStorage.getItem('profileImage') || '';
                const isBusiness = localStorage.getItem('isBusiness') === 'true';
               
                setUser({
                    userId: userId,
                    username: username || 'Пользователь',
                    email: email,
                    role: localStorage.getItem('role') || 'user',
                    createdAt: new Date().toISOString(),
                    profileImageUrl: profileImage,
                    isBusiness: isBusiness
                });
               
                setFormData({
                    username: username || 'Пользователь',
                    email: email
                });
               
                setAvatarUrl(profileImage);
                setError('Не удалось загрузить профиль из API, используются кэшированные данные');
                setIsLoading(false);
            }
        };
       
        fetchUserProfile();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        const authStateChangeEvent = new Event('authStateChange');
        window.dispatchEvent(authStateChangeEvent);
        navigate('/login');
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
       
        if (isEditing && user) {
            setFormData({
                username: user.username,
                email: user.email
            });
            setAvatarUrl(user.profileImageUrl || '');
            setImageFile(null);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
           
            if (!file.type.startsWith('image/')) {
                setStatusMessage({ type: 'error', text: 'Выбранный файл не является изображением' });
                setTimeout(() => setStatusMessage(null), 3000);
                return;
            }
           
            if (file.size > 5 * 1024 * 1024) {
                setStatusMessage({ type: 'error', text: 'Размер файла не должен превышать 5MB' });
                setTimeout(() => setStatusMessage(null), 3000);
                return;
            }
           
            setImageFile(file);
            setAvatarUrl(URL.createObjectURL(file));
            setUploadStatus('Изображение готово к загрузке');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const userId = localStorage.getItem('userId');
        setUploadStatus('Обновление профиля...');
       
        try {
            const updateResponse = await apiClient.put(`/api/User/${userId}`, {
                username: formData.username,
                email: formData.email
            });
           
            setUser(prev => ({
                ...prev,
                username: formData.username,
                email: formData.email
            }));
           
            if (imageFile) {
                setUploadStatus('Загрузка изображения...');
                const uploadResponse = await apiClient.post('/api/Cloudinary/upload', 
                    (() => {
                        const formData = new FormData();
                        formData.append('file', imageFile);
                        return formData;
                    })(), {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
               
                if (uploadResponse.data && uploadResponse.data.imageUrl) {
                    await apiClient.put(`/api/User/${userId}/avatar`, {
                        profileImageUrl: uploadResponse.data.imageUrl
                    });
                   
                    setUser(prev => ({
                        ...prev,
                        profileImageUrl: uploadResponse.data.imageUrl
                    }));
                    setAvatarUrl(uploadResponse.data.imageUrl);
                    localStorage.setItem('profileImage', uploadResponse.data.imageUrl);
                }
            }
           
            localStorage.setItem('username', formData.username);
            localStorage.setItem('userEmail', formData.email);
           
            const authStateChangeEvent = new Event('authStateChange');
            window.dispatchEvent(authStateChangeEvent);
           
            setIsEditing(false);
            setUploadStatus('');
            setStatusMessage({ type: 'success', text: 'Профиль успешно обновлен' });
            setTimeout(() => setStatusMessage(null), 3000);
        } catch (error) {
            console.error('Ошибка при обновлении профиля:', error);
            setUploadStatus('');
            setStatusMessage({ type: 'error', text: 'Не удалось обновить профиль' });
            setTimeout(() => setStatusMessage(null), 3000);
        }
    };

    const handleBusinessFormToggle = () => {
        setShowBusinessForm(!showBusinessForm);
        if (!showBusinessForm) {
            setBusinessData({
                companyName: '',
                companyAvatar: null,
                companyDescription: ''
            });
            setCompanyAvatarUrl('');
        }
    };

    const handleBusinessInputChange = (e) => {
        setBusinessData({
            ...businessData,
            [e.target.name]: e.target.value
        });
    };

    const handleCompanyAvatarChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
           
            if (!file.type.startsWith('image/')) {
                setStatusMessage({ type: 'error', text: 'Выбранный файл не является изображением' });
                setTimeout(() => setStatusMessage(null), 3000);
                return;
            }
           
            if (file.size > 5 * 1024 * 1024) {
                setStatusMessage({ type: 'error', text: 'Размер файла не должен превышать 5MB' });
                setTimeout(() => setStatusMessage(null), 3000);
                return;
            }
           
            setBusinessData({
                ...businessData,
                companyAvatar: file
            });
            setCompanyAvatarUrl(URL.createObjectURL(file));
            setUploadStatus('Логотип компании выбран');
        }
    };

    const handleBusinessSubmit = async (e) => {
        e.preventDefault();
        const userId = localStorage.getItem('userId');
        setUploadStatus('Создание бизнес аккаунта...');
       
        try {
            let companyLogoUrl = '';
           
            if (businessData.companyAvatar) {
                setUploadStatus('Загрузка логотипа компании...');
                const uploadResponse = await CloudinaryService.uploadImage(businessData.companyAvatar);
               
                if (uploadResponse && uploadResponse.imageUrl) {
                    companyLogoUrl = uploadResponse.imageUrl;
                }
            }
           
            await BusinessService.createBusinessAccount(userId, {
                companyName: businessData.companyName,
                companyAvatar: companyLogoUrl,
                companyDescription: businessData.companyDescription
            });
           
            const updatedUserData = {
                ...user,
                isBusiness: true,
                companyName: businessData.companyName,
                companyAvatar: companyLogoUrl,
                companyDescription: businessData.companyDescription
            };
           
            setUser(updatedUserData);
            syncUserDataToLocalStorage(updatedUserData);
           
            setShowBusinessForm(false);
            setUploadStatus('');
            setStatusMessage({ type: 'success', text: 'Бизнес аккаунт успешно создан!' });
            setTimeout(() => setStatusMessage(null), 3000);
           
        } catch (error) {
            console.error('Ошибка при создании бизнес аккаунта:', error);
            setUploadStatus('');
            setStatusMessage({ type: 'error', text: 'Не удалось создать бизнес аккаунт' });
            setTimeout(() => setStatusMessage(null), 3000);
        }
    };

    const navigateToBusinessPanel = () => {
        const isBusiness = localStorage.getItem('isBusiness') === 'true';
        const isAuthenticated = localStorage.getItem('token') !== null;
       
        if (!isAuthenticated) {
            setStatusMessage({ type: 'error', text: 'Вы не аутентифицированы' });
            setTimeout(() => setStatusMessage(null), 3000);
            navigate('/login');
            return;
        }
       
        if (!isBusiness) {
            setStatusMessage({ type: 'error', text: 'У вас нет бизнес-аккаунта' });
            setTimeout(() => setStatusMessage(null), 3000);
            return;
        }
       
        navigate('/business-panel');
    };

    if (isLoading) {
        return (
            <div className="profile-page">
                <div className="container">
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p className="loading-text">Загружаем профиль...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="profile-page">
                <div className="container">
                    <div className="error-container">
                        <div className="error-icon">⚠</div>
                        <h2 className="error-title">Ошибка загрузки</h2>
                        <p className="error-text">Не удалось загрузить данные пользователя</p>
                        <button onClick={() => navigate('/login')} className="retry-btn">
                            Вернуться к входу
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            {/* Hero Section */}
            <div className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Профиль</h1>
                    <p className="hero-subtitle">Управление аккаунтом и настройками</p>
                </div>
            </div>

            {/* Status Notification */}
            {statusMessage && (
                <div className={`notification notification--${statusMessage.type}`}>
                    <div className="notification__content">
                        <span className="notification__text">{statusMessage.text}</span>
                        <button 
                            className="notification__close"
                            onClick={() => setStatusMessage(null)}
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            <div className="container">
                <div className="profile-layout">
                    {/* Profile Header */}
                    <div className="profile-header">
                        <div className="profile-header__info">
                            <h2 className="profile-header__title">Информация профиля</h2>
                            <p className="profile-header__subtitle">
                                Управляйте своим аккаунтом и персональными данными
                            </p>
                        </div>
                        <button onClick={handleLogout} className="logout-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M9 21H5C4.45 21 4 20.55 4 20V4C4 3.45 4.45 3 5 3H9M16 17L21 12L16 7M21 12H9" 
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>Выйти</span>
                        </button>
                    </div>

                    <div className="profile-content">
                        {/* Avatar Section */}
                        <div className="avatar-section">
                            <div className="avatar-container">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={`Аватар ${user.username}`}
                                        className="user-avatar"
                                    />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                
                                {isEditing && (
                                    <div className="avatar-upload">
                                        <input
                                            type="file"
                                            id="avatar-upload"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="file-input"
                                        />
                                        <label htmlFor="avatar-upload" className="file-label">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M14.828 14.828A4 4 0 1 1 9.172 9.172" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                                                <path d="M16 8L8 16M8 8H16V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            Изменить фото
                                        </label>
                                    </div>
                                )}
                            </div>
                            
                            {uploadStatus && (
                                <div className="upload-status">
                                    {uploadStatus}
                                </div>
                            )}
                        </div>

                        {/* Profile Details */}
                        <div className="profile-details">
                            {isEditing ? (
                                <form onSubmit={handleSubmit} className="profile-form">
                                    <div className="form-group">
                                        <label htmlFor="username">Имя пользователя</label>
                                        <input
                                            type="text"
                                            id="username"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            required
                                            className="form-input"
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="email">Email адрес</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            className="form-input"
                                        />
                                    </div>
                                    
                                    <div className="form-actions">
                                        <button type="submit" className="btn btn--primary">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            Сохранить изменения
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleEditToggle}
                                            className="btn btn--secondary"
                                        >
                                            Отмена
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="user-info">
                                    <div className="info-card">
                                        <div className="info-item">
                                            <span className="info-label">Имя пользователя</span>
                                            <span className="info-value">{user.username}</span>
                                        </div>
                                        
                                        <div className="info-item">
                                            <span className="info-label">Email адрес</span>
                                            <span className="info-value">{user.email}</span>
                                        </div>
                                        
                                        <div className="info-item">
                                            <span className="info-label">Роль</span>
                                            <span className="info-value role-badge">{user.role}</span>
                                        </div>
                                        
                                        <div className="info-item">
                                            <span className="info-label">Участник с</span>
                                            <span className="info-value">
                                                {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {error && (
                                        <div className="warning-notice">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            <span>{error}</span>
                                        </div>
                                    )}
                                    
                                    <div className="profile-actions">
                                        <button onClick={handleEditToggle} className="btn btn--primary">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M11 4H4C3.45 4 3 4.45 3 5V20C3 20.55 3.45 21 4 21H19C19.55 21 20 20.55 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            Редактировать профиль
                                        </button>
                                        
                                        {!user.isBusiness ? (
                                            <button 
                                                onClick={handleBusinessFormToggle} 
                                                className="btn btn--accent"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                    <path d="M21 10C21 16.075 16.075 21 10 21C3.925 21 -1 16.075 -1 10C-1 3.925 3.925 -1 10 -1C16.075 -1 21 3.925 21 10Z" stroke="currentColor" strokeWidth="2"/>
                                                    <path d="M8 12L10 14L14 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                                {showBusinessForm ? 'Отмена' : 'Стать бизнес пользователем'}
                                            </button>
                                        ) : (
                                            <>
                                                <button onClick={refreshUserData} className="btn btn--secondary">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                        <path d="M1 4V10H7M23 20V14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                        <path d="M20.49 9C20.0847 7.57825 19.3093 6.29329 18.24 5.29C17.1707 4.28671 15.8523 3.60328 14.42 3.31C12.9877 3.01672 11.5032 3.12905 10.1256 3.63613C8.74804 4.14321 7.53244 5.02693 6.62 6.18L1 12L6.62 17.82C7.53244 18.9731 8.74804 19.8568 10.1256 20.3639C11.5032 20.871 12.9877 20.9833 14.42 20.69C15.8523 20.3967 17.1707 19.7133 18.24 18.71C19.3093 17.7067 20.0847 16.4218 20.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                    Обновить данные
                                                </button>
                                                <button onClick={navigateToBusinessPanel} className="btn btn--accent">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                        <path d="M3 21H21M5 21V7L12 3L19 7V21M9 9V17M15 9V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                    Управление бизнесом
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Business Form */}
                    {showBusinessForm && !user.isBusiness && (
                        <div className="business-form-section">
                            <div className="business-form-header">
                                <h3 className="business-form-title">Создание бизнес аккаунта</h3>
                                <p className="business-form-subtitle">
                                    Получите доступ к расширенным возможностям для бизнеса
                                </p>
                            </div>
                            
                            <form onSubmit={handleBusinessSubmit} className="business-form">
                                <div className="form-group">
                                    <label htmlFor="companyName">Название компании</label>
                                    <input
                                        type="text"
                                        id="companyName"
                                        name="companyName"
                                        value={businessData.companyName}
                                        onChange={handleBusinessInputChange}
                                        required
                                        placeholder="Введите название вашей компании"
                                        className="form-input"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="companyDescription">Описание компании</label>
                                    <textarea
                                        id="companyDescription"
                                        name="companyDescription"
                                        value={businessData.companyDescription}
                                        onChange={handleBusinessInputChange}
                                        placeholder="Расскажите о вашей компании"
                                        rows="4"
                                        className="form-textarea"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="companyAvatar">Логотип компании</label>
                                    <div className="company-avatar-upload">
                                        {companyAvatarUrl && (
                                            <div className="company-avatar-preview">
                                                <img
                                                    src={companyAvatarUrl}
                                                    alt="Логотип компании"
                                                    className="company-avatar"
                                                />
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            id="companyAvatar"
                                            accept="image/*"
                                            onChange={handleCompanyAvatarChange}
                                            className="file-input"
                                        />
                                        <label htmlFor="companyAvatar" className="file-label">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M14 2H6C5.45 2 5 2.45 5 3V21C5 21.55 5.45 22 6 22H18C18.55 22 19 21.55 19 21V7L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            {companyAvatarUrl ? 'Изменить логотип' : 'Загрузить логотип'}
                                        </label>
                                    </div>
                                </div>
                                
                                <div className="form-actions">
                                    <button type="submit" className="btn btn--primary">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M22 11.08V12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C15.09 2 17.8 3.56 19.58 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Создать бизнес аккаунт
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Business Info */}
                    {user.isBusiness && (
                        <div className="business-info-section">
                            <div className="business-info-header">
                                <h3 className="business-info-title">Бизнес информация</h3>
                                <p className="business-info-subtitle">
                                    Данные вашей компании
                                </p>
                            </div>
                            
                            <div className="business-info-content">
                                <div className="business-avatar-section">
                                    {user.companyAvatar ? (
                                        <img
                                            src={user.companyAvatar}
                                            alt={`Логотип ${user.companyName}`}
                                            className="business-avatar"
                                        />
                                    ) : (
                                        <div className="business-avatar-placeholder">
                                            {user.companyName?.charAt(0).toUpperCase() || 'B'}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="business-details">
                                    <h4 className="business-name">{user.companyName}</h4>
                                    <p className="business-description">{user.companyDescription}</p>
                                    
                                    <div className="business-actions">
                                        <button 
                                            onClick={() => {
                                                setShowBusinessForm(true);
                                                setBusinessData({
                                                    companyName: user.companyName || '',
                                                    companyAvatar: null,
                                                    companyDescription: user.companyDescription || ''
                                                });
                                            }} 
                                            className="btn btn--secondary"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M11 4H4C3.45 4 3 4.45 3 5V20C3 20.55 3.45 21 4 21H19C19.55 21 20 20.55 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            Редактировать бизнес информацию
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Business Edit Form for existing business */}
                    {showBusinessForm && user.isBusiness && (
                        <div className="business-form-section">
                            <div className="business-form-header">
                                <h3 className="business-form-title">Редактирование бизнес информации</h3>
                                <p className="business-form-subtitle">
                                    Обновите данные вашей компании
                                </p>
                            </div>
                            
                            <form onSubmit={handleBusinessProfileUpdate} className="business-form">
                                <div className="form-group">
                                    <label htmlFor="companyNameEdit">Название компании</label>
                                    <input
                                        type="text"
                                        id="companyNameEdit"
                                        name="companyName"
                                        value={businessData.companyName}
                                        onChange={handleBusinessInputChange}
                                        placeholder="Введите название вашей компании"
                                        className="form-input"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="companyDescriptionEdit">Описание компании</label>
                                    <textarea
                                        id="companyDescriptionEdit"
                                        name="companyDescription"
                                        value={businessData.companyDescription}
                                        onChange={handleBusinessInputChange}
                                        placeholder="Расскажите о вашей компании"
                                        rows="4"
                                        className="form-textarea"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="companyAvatarEdit">Логотип компании</label>
                                    <div className="company-avatar-upload">
                                        {(companyAvatarUrl || user.companyAvatar) && (
                                            <div className="company-avatar-preview">
                                                <img
                                                    src={companyAvatarUrl || user.companyAvatar}
                                                    alt="Логотип компании"
                                                    className="company-avatar"
                                                />
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            id="companyAvatarEdit"
                                            accept="image/*"
                                            onChange={handleCompanyAvatarChange}
                                            className="file-input"
                                        />
                                        <label htmlFor="companyAvatarEdit" className="file-label">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M14 2H6C5.45 2 5 2.45 5 3V21C5 21.55 5.45 22 6 22H18C18.55 22 19 21.55 19 21V7L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            Изменить логотип
                                        </label>
                                    </div>
                                </div>
                                
                                <div className="form-actions">
                                    <button type="submit" className="btn btn--primary">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Сохранить изменения
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleBusinessFormToggle}
                                        className="btn btn--secondary"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserProfile;