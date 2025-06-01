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
                console.log('Обновленные данные пользователя:', response.data);
                setUser(response.data);
                setFormData({
                    username: response.data.username || '',
                    email: response.data.email || ''
                });
                setAvatarUrl(response.data.profileImageUrl || '');
                syncUserDataToLocalStorage(response.data);
                setError(null);
                return true;
            }
        } catch (error) {
            console.error('Ошибка обновления данных:', error);
            return false;
        }
    };

    const handleBusinessProfileUpdate = async (e) => {
        e.preventDefault();
        const userId = localStorage.getItem('userId');
        setUploadStatus('Обновление бизнес-информации...');
        
        try {
            let companyAvatarUrl = user.companyAvatar; // Сохраняем текущий, если не меняем
            
            if (businessData.companyAvatar) {
                setUploadStatus('Загрузка логотипа компании...');
                const logoFormData = new FormData();
                logoFormData.append('file', businessData.companyAvatar);
                
                const uploadResponse = await CloudinaryService.uploadImage(businessData.companyAvatar);
                
                if (uploadResponse && uploadResponse.imageUrl) {
                    companyAvatarUrl = uploadResponse.imageUrl;
                }
            }
            
            // *** ИСПРАВЛЕНО: Используем новый маршрут для обновления бизнес-информации ***
            const response = await UserService.updateBusinessInfo(userId, {
                companyName: businessData.companyName || user.companyName,
                companyAvatar: companyAvatarUrl,
                companyDescription: businessData.companyDescription || user.companyDescription
            });
            
            // Обновляем локальное состояние
            const updatedUserData = {
                ...user,
                companyName: businessData.companyName || user.companyName,
                companyAvatar: companyAvatarUrl,
                companyDescription: businessData.companyDescription || user.companyDescription
            };
            
            setUser(updatedUserData);
            syncUserDataToLocalStorage(updatedUserData);
            
            setUploadStatus('');
            alert('Бизнес-информация успешно обновлена!');
            
        } catch (error) {
            console.error('Ошибка при обновлении бизнес-информации:', error);
            setUploadStatus('');
            alert('Не удалось обновить бизнес-информацию: ' + (error.response?.data?.message || error.message));
        }
    };

    useEffect(() => {
        const fetchUserProfile = async () => {
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('userId');
            
            if (!token || !userId) {
                console.log('Нет токена или userId, перенаправление на страницу входа');
                navigate('/login');
                return;
            }
            
            try {
                const response = await apiClient.get(`/api/User/${userId}`);
                
                if (response.data) {
                    console.log('Получены данные пользователя:', response.data);
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
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('profileImage');
        localStorage.removeItem('cartCount');
        localStorage.removeItem('wishlistCount');
        localStorage.removeItem('isBusiness');
        localStorage.removeItem('companyName');
        localStorage.removeItem('companyAvatar');
        localStorage.removeItem('companyDescription');
        
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
                setUploadStatus('Ошибка: выбранный файл не является изображением');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                setUploadStatus('Ошибка: размер файла не должен превышать 5MB');
                return;
            }
            
            setImageFile(file);
            setAvatarUrl(URL.createObjectURL(file));
            setUploadStatus('Изображение выбрано и готово к загрузке');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const userId = localStorage.getItem('userId');
        setUploadStatus('Обновление профиля...');
        
        try {
            console.log('Отправка данных для обновления:', formData);
            const updateResponse = await apiClient.put(`/api/User/${userId}`, {
                username: formData.username,
                email: formData.email
            });
            
            console.log('Ответ при обновлении профиля:', updateResponse.data);
            
            setUser(prev => ({
                ...prev,
                username: formData.username,
                email: formData.email
            }));
            
            if (imageFile) {
                setUploadStatus('Загрузка изображения...');
                const imageFormData = new FormData();
                imageFormData.append('file', imageFile);
                
                console.log('Отправка файла на загрузку');
                const uploadResponse = await apiClient.post('/api/Cloudinary/upload', imageFormData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                
                console.log('Ответ после загрузки изображения:', uploadResponse.data);
                
                if (uploadResponse.data && uploadResponse.data.imageUrl) {
                    console.log('Обновление URL аватара:', uploadResponse.data.imageUrl);
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
            alert('Профиль успешно обновлен');
        } catch (error) {
            console.error('Ошибка при обновлении профиля:', error);
            setUploadStatus('');
            alert('Не удалось обновить профиль: ' + (error.response?.data?.message || error.message));
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
                setUploadStatus('Ошибка: выбранный файл не является изображением');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                setUploadStatus('Ошибка: размер файла не должен превышать 5MB');
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
                const logoFormData = new FormData();
                logoFormData.append('file', businessData.companyAvatar);
                
                const uploadResponse = await CloudinaryService.uploadImage(businessData.companyAvatar);
                
                if (uploadResponse && uploadResponse.imageUrl) {
                    companyLogoUrl = uploadResponse.imageUrl;
                }
            }
            
            // *** ИСПРАВЛЕНО: Используем BusinessService вместо UserService ***
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
            alert('Бизнес аккаунт успешно создан!');
            
        } catch (error) {
            console.error('Ошибка при создании бизнес аккаунта:', error);
            setUploadStatus('');
            alert('Не удалось создать бизнес аккаунт: ' + (error.response?.data?.message || error.message));
        }
    };

    const navigateToBusinessPanel = () => {
        console.log('Переход в бизнес-панель...');
        console.log('isBusiness:', localStorage.getItem('isBusiness'));
        console.log('Token:', localStorage.getItem('token') ? 'Существует' : 'Отсутствует');
        
        const isBusiness = localStorage.getItem('isBusiness') === 'true';
        const isAuthenticated = localStorage.getItem('token') !== null;
        
        if (!isAuthenticated) {
            console.error('Пользователь не аутентифицирован');
            alert('Вы не аутентифицированы');
            navigate('/login');
            return;
        }
        
        if (!isBusiness) {
            console.error('Пользователь не имеет бизнес-аккаунта');
            alert('У вас нет бизнес-аккаунта');
            return;
        }
        
        navigate('/business-panel');
    };

    if (isLoading) {
        return (
            <div className="user-profile-loading">
                <div className="spinner"></div>
                <p>Загрузка профиля...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="user-profile-error">
                <p>Не удалось загрузить данные пользователя. Пожалуйста, попробуйте позже.</p>
                <button onClick={() => navigate('/login')} className="button primary">
                    Вернуться к входу
                </button>
            </div>
        );
    }

    return (
        <div className="user-profile-container">
            <div className="profile-header">
                <h1>Профиль пользователя</h1>
                <button onClick={handleLogout} className="logout-button">
                    Выйти
                </button>
            </div>

            <div className="profile-content">
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
                                    Изменить аватар
                                </label>
                                {uploadStatus && <p className="upload-status">{uploadStatus}</p>}
                            </div>
                        )}
                    </div>
                </div>

                <div className="profile-details">
                    {isEditing ? (
                        <form onSubmit={handleSubmit} className="edit-form">
                            <div className="form-group">
                                <label htmlFor="username">Имя пользователя</label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            
                            <div className="form-actions">
                                <button type="submit" className="button primary">
                                    Сохранить изменения
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleEditToggle}
                                    className="button secondary"
                                >
                                    Отмена
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="user-info">
                            <div className="info-row">
                                <span className="info-label">Имя пользователя:</span>
                                <span className="info-value">{user.username}</span>
                            </div>
                            
                            <div className="info-row">
                                <span className="info-label">Email:</span>
                                <span className="info-value">{user.email}</span>
                            </div>
                            
                            <div className="info-row">
                                <span className="info-label">Роль:</span>
                                <span className="info-value">{user.role}</span>
                            </div>
                            
                            <div className="info-row">
                                <span className="info-label">Участник с:</span>
                                <span className="info-value">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            
                            {error && (
                                <div className="note-box warning">
                                    <p>{error}</p>
                                </div>
                            )}
                            
                            <div className="profile-actions">
                                <button onClick={handleEditToggle} className="edit-button">
                                    Редактировать профиль
                                </button>
                                
                                {!user.isBusiness ? (
                                    <>
                                        {!showBusinessForm ? (
                                            <button onClick={handleBusinessFormToggle} className="business-button">
                                                Стать бизнес пользователем
                                            </button>
                                        ) : (
                                            <button onClick={handleBusinessFormToggle} className="cancel-business-button">
                                                Отмена
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <button onClick={refreshUserData} className="refresh-button">
                                            Обновить данные
                                        </button>
                                        <button onClick={navigateToBusinessPanel} className="business-panel-button">
                                            Управление бизнесом
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {showBusinessForm && !user.isBusiness && (
                    <div className="business-form-container">
                        <h2>Создание бизнес аккаунта</h2>
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
                                        {companyAvatarUrl ? 'Изменить логотип' : 'Загрузить логотип'}
                                    </label>
                                </div>
                            </div>
                            
                            <div className="form-actions">
                                <button type="submit" className="button primary">
                                    Создать бизнес аккаунт
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {user.isBusiness && (
                    <div className="business-info">
                        <h2>Информация о бизнесе</h2>
                        <div className="business-avatar">
                            {user.companyAvatar ? (
                                <img 
                                    src={user.companyAvatar} 
                                    alt={`Логотип ${user.companyName}`} 
                                    className="company-avatar-large"
                                />
                            ) : (
                                <div className="company-placeholder">
                                    {user.companyName?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="business-details">
                            <h3>{user.companyName}</h3>
                            <p>{user.companyDescription}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserProfile;