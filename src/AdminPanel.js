import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AdminPanel() {
    const navigate = useNavigate();
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        
        try {
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            if (decodedToken.role !== 'admin') {
                navigate('/');
            } else {
                setUserRole('admin');
            }
        } catch (error) {
            console.error('Error decoding token:', error);
            navigate('/login');
        }
    }, [navigate]);

    if (userRole !== 'admin') {
        return null;
    }

    return (
        <div>
            <h1>Admin Panel</h1>
            <p>Welcome, Admin!</p>
            <button onClick={() => {
                localStorage.removeItem('token');
                navigate('/login');
            }}>Logout</button>
        </div>
    );
}

export default AdminPanel;
