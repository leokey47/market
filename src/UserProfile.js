import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './UserProfile.css'; // Don't forget to create this CSS file

function UserProfile() {
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = () => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
       
        if (!token || !userId) {
            navigate('/login');
            return;
        }

        setIsLoading(true);
        axios.get(`https://localhost:7209/api/User/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            setUser(response.data);
            setFormData({
                username: response.data.username,
                email: response.data.email
            });
            setIsLoading(false);
        })
        .catch(error => {
            console.error('Error fetching user data:', error);
            setIsLoading(false);
            navigate('/login');
        });
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        navigate('/login');
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        try {
            const response = await axios.put(
                `https://localhost:7209/api/User/${userId}`,
                formData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            
            setUser({
                ...user,
                username: formData.username,
                email: formData.email
            });
            
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        
        // Create a FormData instance
        const formData = new FormData();
        formData.append('file', file);
        
        setUploadingAvatar(true);
        
        try {
            // First, upload to Cloudinary through our API
            const uploadResponse = await axios.post(
                'https://localhost:7209/api/Cloudinary/upload',
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            const imageUrl = uploadResponse.data.imageUrl;
            
            // Then update user profile with the new image URL
            const userId = localStorage.getItem('userId');
            const updateResponse = await axios.put(
                `https://localhost:7209/api/User/${userId}/avatar`,
                { profileImageUrl: imageUrl },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            
            // Update local user data with new avatar
            setUser({
                ...user,
                profileImageUrl: imageUrl
            });
            
            alert('Avatar updated successfully!');
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Failed to upload avatar. Please try again.');
        } finally {
            setUploadingAvatar(false);
        }
    };

    if (isLoading) {
        return (
            <div className="user-profile-loading">
                <div className="spinner"></div>
                <p>Loading your profile...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="user-profile-error">
                <p>Could not load user data. Please try again later.</p>
                <button onClick={() => navigate('/login')} className="button primary">
                    Back to Login
                </button>
            </div>
        );
    }

    return (
        <div className="user-profile-container">
            <div className="profile-header">
                <h1>My Profile</h1>
                <button onClick={handleLogout} className="logout-button">
                    Logout
                </button>
            </div>

            <div className="profile-content">
                <div className="avatar-section">
                    <div className="avatar-container">
                        {user.profileImageUrl ? (
                            <img 
                                src={user.profileImageUrl} 
                                alt={`${user.username}'s avatar`} 
                                className="user-avatar" 
                            />
                        ) : (
                            <div className="avatar-placeholder">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                        
                        <label htmlFor="avatar-upload" className="avatar-upload-label">
                            {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                        </label>
                        <input 
                            type="file" 
                            id="avatar-upload" 
                            accept="image/*" 
                            onChange={handleAvatarChange}
                            disabled={uploadingAvatar}
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>

                <div className="profile-details">
                    {isEditing ? (
                        <form onSubmit={handleSubmit} className="edit-form">
                            <div className="form-group">
                                <label htmlFor="username">Username</label>
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
                                    Save Changes
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleEditToggle}
                                    className="button secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="user-info">
                            <div className="info-row">
                                <span className="info-label">Username:</span>
                                <span className="info-value">{user.username}</span>
                            </div>
                            
                            <div className="info-row">
                                <span className="info-label">Email:</span>
                                <span className="info-value">{user.email}</span>
                            </div>
                            
                            <div className="info-row">
                                <span className="info-label">Role:</span>
                                <span className="info-value">{user.role}</span>
                            </div>
                            
                            <div className="info-row">
                                <span className="info-label">Member Since:</span>
                                <span className="info-value">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            
                            <button onClick={handleEditToggle} className="edit-button">
                                Edit Profile
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserProfile;