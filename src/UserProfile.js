import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserProfile.css';
import { apiClient } from './ApiService'; // Adjust path as needed

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
    const navigate = useNavigate();

    // Fetch user profile from API
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
                }
                setIsLoading(false);
            } catch (error) {
                console.error('Ошибка при получении профиля пользователя:', error);
                
                // Используем данные из localStorage, если API недоступен
                const username = localStorage.getItem('username');
                const email = localStorage.getItem('userEmail') || 'example@example.com';
                const profileImage = localStorage.getItem('profileImage') || '';
                
                setUser({
                    userId: userId,
                    username: username || 'Пользователь',
                    email: email,
                    role: localStorage.getItem('role') || 'user',
                    createdAt: new Date().toISOString(),
                    profileImageUrl: profileImage
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
            
            // Проверяем, что файл - изображение
            if (!file.type.startsWith('image/')) {
                setUploadStatus('Ошибка: выбранный файл не является изображением');
                return;
            }
            
            // Проверяем размер файла (не более 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setUploadStatus('Ошибка: размер файла не должен превышать 5MB');
                return;
            }
            
            setImageFile(file);
            // Создаем локальный URL для предпросмотра
            setAvatarUrl(URL.createObjectURL(file));
            setUploadStatus('Изображение выбрано и готово к загрузке');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const userId = localStorage.getItem('userId');
        setUploadStatus('Обновление профиля...');
        
        try {
            // Обновляем информацию профиля
            console.log('Отправка данных для обновления:', formData);
            const updateResponse = await apiClient.put(`/api/User/${userId}`, {
                username: formData.username,
                email: formData.email
            });
            
            console.log('Ответ при обновлении профиля:', updateResponse.data);
            
            // Обновляем локальное состояние пользователя
            setUser(prev => ({
                ...prev,
                username: formData.username,
                email: formData.email
            }));
            
            // Обновляем аватар если был выбран файл
            if (imageFile) {
                setUploadStatus('Загрузка изображения...');
                const imageFormData = new FormData();
                imageFormData.append('file', imageFile);
                
                // Загружаем изображение в Cloudinary
                console.log('Отправка файла на загрузку');
                const uploadResponse = await apiClient.post('/api/Cloudinary/upload', imageFormData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                
                console.log('Ответ после загрузки изображения:', uploadResponse.data);
                
                if (uploadResponse.data && uploadResponse.data.imageUrl) {
                    // Обновляем URL аватара в профиле пользователя
                    console.log('Обновление URL аватара:', uploadResponse.data.imageUrl);
                    await apiClient.put(`/api/User/${userId}/avatar`, {
                        profileImageUrl: uploadResponse.data.imageUrl
                    });
                    
                    // Обновляем локальное состояние
                    setUser(prev => ({
                        ...prev,
                        profileImageUrl: uploadResponse.data.imageUrl
                    }));
                    setAvatarUrl(uploadResponse.data.imageUrl);
                    
                    // Сохраняем URL изображения в localStorage
                    localStorage.setItem('profileImage', uploadResponse.data.imageUrl);
                }
            }
            
            // Обновляем localStorage с новым именем пользователя и email
            localStorage.setItem('username', formData.username);
            localStorage.setItem('userEmail', formData.email);
            
            // Уведомляем другие компоненты об изменении
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
                            
                            <button onClick={handleEditToggle} className="edit-button">
                                Редактировать профиль
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserProfile;