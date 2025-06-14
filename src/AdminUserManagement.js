import React, { useState, useEffect } from 'react';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'edit', 'delete', 'business'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'user',
    isBusiness: false,
    companyName: '',
    companyDescription: ''
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://localhost:7209';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Токен авторизации не найден');
        setLoading(false);
        return;
      }

      console.log('Fetching users from:', `${API_BASE_URL}/api/User/all`);
      console.log('Token:', token);

      const response = await fetch(`${API_BASE_URL}/api/User/all`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const data = await response.json();
        console.log('Users data:', data);
        setUsers(data);
      } else {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        if (response.status === 403) {
          setError('У вас нет прав для просмотра пользователей');
        } else if (response.status === 401) {
          setError('Требуется авторизация');
        } else {
          setError(`Ошибка при загрузке пользователей: ${response.status}`);
        }
      }
    } catch (err) {
      console.error('Network error:', err);
      setError(`Ошибка сети: ${err.message}. Проверьте, что API доступен по адресу ${API_BASE_URL}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      role: user.role,
      isBusiness: user.isBusiness || false,
      companyName: user.companyName || '',
      companyDescription: user.companyDescription || ''
    });
    setModalType('edit');
    setShowModal(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setModalType('delete');
    setShowModal(true);
  };

  const handleBusinessToggle = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      role: user.role,
      isBusiness: !user.isBusiness,
      companyName: user.companyName || '',
      companyDescription: user.companyDescription || ''
    });
    setModalType('business');
    setShowModal(true);
  };

  const handleSaveUser = async () => {
    try {
      const token = localStorage.getItem('token');
      let response;

      if (modalType === 'edit') {
        // Обновление основной информации пользователя
        response = await fetch(`${API_BASE_URL}/api/User/${selectedUser.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            role: formData.role
          })
        });

        if (response.ok) {
          // Если изменился статус бизнес-аккаунта
          if (formData.isBusiness !== selectedUser.isBusiness) {
            if (formData.isBusiness) {
              // Создать бизнес-аккаунт
              await fetch(`${API_BASE_URL}/api/Business/create/${selectedUser.id}`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  companyName: formData.companyName,
                  companyAvatar: '',
                  companyDescription: formData.companyDescription
                })
              });
            } else {
              // Убрать статус бизнес-аккаунта (потребуется добавить эндпоинт)
              await fetch(`${API_BASE_URL}/api/Business/remove/${selectedUser.id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
            }
          } else if (formData.isBusiness) {
            // Обновить бизнес-информацию
            await fetch(`${API_BASE_URL}/api/Business/update/${selectedUser.id}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                companyName: formData.companyName,
                companyAvatar: selectedUser.companyAvatar || '',
                companyDescription: formData.companyDescription
              })
            });
          }
        }
      } else if (modalType === 'business') {
        if (formData.isBusiness) {
          // Создать бизнес-аккаунт
          response = await fetch(`${API_BASE_URL}/api/Business/create/${selectedUser.id}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              companyName: formData.companyName,
              companyAvatar: '',
              companyDescription: formData.companyDescription
            })
          });
        } else {
          // Убрать статус бизнес-аккаунта
          response = await fetch(`${API_BASE_URL}/api/Business/remove/${selectedUser.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        }
      }

      if (response && response.ok) {
        setSuccess(`Пользователь ${formData.username} успешно обновлен`);
        fetchUsers();
        setShowModal(false);
      } else {
        setError('Ошибка при обновлении пользователя');
      }
    } catch (err) {
      setError('Ошибка сети при обновлении пользователя');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/User/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess(`Пользователь ${selectedUser.username} успешно удален`);
        fetchUsers();
        setShowModal(false);
      } else {
        setError('Ошибка при удалении пользователя');
      }
    } catch (err) {
      setError('Ошибка сети при удалении пользователя');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || 
                       (filterRole === 'admin' && user.role === 'admin') ||
                       (filterRole === 'business' && user.isBusiness) ||
                       (filterRole === 'user' && user.role === 'user' && !user.isBusiness);
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (user) => {
    if (user.role === 'admin') {
      return <span className="badge badge-admin">Администратор</span>;
    } else if (user.isBusiness) {
      return <span className="badge badge-business">Бизнес</span>;
    } else {
      return <span className="badge badge-user">Пользователь</span>;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '30px',
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '1px solid #e5e5e5'
        }}>
          <h2 style={{
            margin: '0 0 10px 0',
            color: '#1a1a1a',
            display: 'flex',
            alignItems: 'center',
            fontSize: '28px',
            fontWeight: '600'
          }}>
            <i className="bi bi-people-fill" style={{ marginRight: '15px', color: '#333' }}></i>
            Управление пользователями
          </h2>
          <p style={{
            color: '#666',
            margin: 0,
            fontSize: '16px'
          }}>
            Просмотр, редактирование и управление всеми пользователями системы
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{
            background: 'linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: '10px' }}></i>
              {error}
            </div>
            <button 
              onClick={() => setError('')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: 'white'
              }}
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div style={{
            background: 'linear-gradient(135deg, #666 0%, #4a4a4a 100%)',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #666',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <i className="bi bi-check-circle-fill" style={{ marginRight: '10px' }}></i>
              {success}
            </div>
            <button 
              onClick={() => setSuccess('')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: 'white'
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Filters and Search */}
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '12px',
          marginBottom: '25px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '1px solid #e5e5e5'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            alignItems: 'end'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#1a1a1a'
              }}>
                Поиск пользователей
              </label>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-search" style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#666',
                  zIndex: 1
                }}></i>
                <input
                  type="text"
                  placeholder="Поиск по имени или email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    border: '2px solid #e5e5e5',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'all 0.3s',
                    outline: 'none',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#333';
                    e.target.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e5e5';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#1a1a1a'
              }}>
                Фильтр по роли
              </label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e5e5',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  color: '#1a1a1a'
                }}
              >
                <option value="all">Все роли</option>
                <option value="admin">Администраторы</option>
                <option value="business">Бизнес-аккаунты</option>
                <option value="user">Обычные пользователи</option>
              </select>
            </div>
            <div>
              <button
                onClick={fetchUsers}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #333 0%, #1a1a1a 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #1a1a1a 0%, #000 100%)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #333 0%, #1a1a1a 100%)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <i className="bi bi-arrow-clockwise" style={{ marginRight: '8px' }}></i>
                Обновить
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '25px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            border: '1px solid #333',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
          }}>
            <i className="bi bi-people" style={{
              fontSize: '40px',
              color: '#333',
              marginBottom: '15px'
            }}></i>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '32px', fontWeight: '700', color: '#1a1a1a' }}>
              {users.length}
            </h3>
            <p style={{ margin: 0, color: '#666', fontWeight: '500' }}>Всего пользователей</p>
          </div>
          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            border: '1px solid #666',
            background: 'linear-gradient(135deg, #666 0%, #333 100%)',
            color: 'white'
          }}>
            <i className="bi bi-shield-check" style={{
              fontSize: '40px',
              color: 'white',
              marginBottom: '15px'
            }}></i>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '32px', fontWeight: '700', color: 'white' }}>
              {users.filter(u => u.role === 'admin').length}
            </h3>
            <p style={{ margin: 0, color: '#e5e5e5', fontWeight: '500' }}>Администраторов</p>
          </div>
          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            border: '1px solid #999',
            background: 'linear-gradient(135deg, #999 0%, #666 100%)',
            color: 'white'
          }}>
            <i className="bi bi-building" style={{
              fontSize: '40px',
              color: 'white',
              marginBottom: '15px'
            }}></i>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '32px', fontWeight: '700', color: 'white' }}>
              {users.filter(u => u.isBusiness).length}
            </h3>
            <p style={{ margin: 0, color: '#e5e5e5', fontWeight: '500' }}>Бизнес-аккаунтов</p>
          </div>
          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            border: '1px solid #ccc',
            background: 'linear-gradient(135deg, #ccc 0%, #999 100%)'
          }}>
            <i className="bi bi-person" style={{
              fontSize: '40px',
              color: '#333',
              marginBottom: '15px'
            }}></i>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '32px', fontWeight: '700', color: '#1a1a1a' }}>
              {users.filter(u => u.role === 'user' && !u.isBusiness).length}
            </h3>
            <p style={{ margin: 0, color: '#333', fontWeight: '500' }}>Обычных пользователей</p>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div style={{
            backgroundColor: 'white',
            padding: '60px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            border: '1px solid #e5e5e5'
          }}>
            <div style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #333',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '20px'
            }}></div>
            <p style={{ color: '#666', fontSize: '16px' }}>Загрузка пользователей...</p>
          </div>
        ) : users.length === 0 && !error ? (
          <div style={{
            backgroundColor: 'white',
            padding: '60px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            border: '1px solid #e5e5e5'
          }}>
            <i className="bi bi-people" style={{
              fontSize: '60px',
              color: '#666',
              marginBottom: '20px'
            }}></i>
            <h3 style={{ color: '#666', marginBottom: '15px' }}>Пользователи не найдены</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Возможно, эндпоинт не настроен или у вас нет прав доступа
            </p>
            <button
              onClick={fetchUsers}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #333 0%, #1a1a1a 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Попробовать снова
            </button>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            border: '1px solid #e5e5e5'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{ 
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #000 100%)'
                  }}>
                    <th style={{
                      padding: '20px',
                      textAlign: 'left',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '14px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>Пользователь</th>
                    <th style={{
                      padding: '20px',
                      textAlign: 'left',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '14px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>Email</th>
                    <th style={{
                      padding: '20px',
                      textAlign: 'left',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '14px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>Роль</th>
                    <th style={{
                      padding: '20px',
                      textAlign: 'left',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '14px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>Дата регистрации</th>
                    <th style={{
                      padding: '20px',
                      textAlign: 'left',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '14px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>Компания</th>
                    <th style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '14px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <tr key={user.id} style={{
                      borderBottom: '1px solid #e5e5e5',
                      backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                      transition: 'background-color 0.3s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : 'white'}
                    >
                      <td style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ marginRight: '15px' }}>
                            {user.profileImageUrl ? (
                              <img 
                                src={user.profileImageUrl} 
                                alt={user.username}
                                style={{
                                  width: '50px',
                                  height: '50px',
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  border: '2px solid #e5e5e5'
                                }}
                              />
                            ) : (
                              <div style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #333 0%, #666 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: '600',
                                fontSize: '18px'
                              }}>
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <div style={{
                              fontWeight: '600',
                              color: '#1a1a1a',
                              fontSize: '16px',
                              marginBottom: '4px'
                            }}>
                              {user.username}
                            </div>
                            <small style={{
                              color: '#666',
                              fontSize: '12px'
                            }}>
                              ID: {user.id}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td style={{
                        padding: '20px',
                        color: '#1a1a1a',
                        fontSize: '14px'
                      }}>
                        {user.email}
                      </td>
                      <td style={{ padding: '20px' }}>
                        {getRoleBadge(user)}
                      </td>
                      <td style={{
                        padding: '20px',
                        color: '#666',
                        fontSize: '14px'
                      }}>
                        {formatDate(user.createdAt)}
                      </td>
                      <td style={{ padding: '20px' }}>
                        {user.isBusiness && user.companyName ? (
                          <div>
                            <div style={{
                              fontWeight: '600',
                              color: '#1a1a1a',
                              fontSize: '14px',
                              marginBottom: '4px'
                            }}>
                              {user.companyName}
                            </div>
                            <small style={{
                              color: '#666',
                              fontSize: '12px'
                            }}>
                              {user.companyDescription?.substring(0, 30)}
                              {user.companyDescription?.length > 30 ? '...' : ''}
                            </small>
                          </div>
                        ) : (
                          <span style={{ color: '#666' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '20px', textAlign: 'center' }}>
                        <div style={{
                          display: 'flex',
                          gap: '8px',
                          justifyContent: 'center'
                        }}>
                          <button
                            onClick={() => handleEditUser(user)}
                            title="Редактировать"
                            style={{
                              padding: '8px 12px',
                              background: 'linear-gradient(135deg, #333 0%, #666 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background = 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)';
                              e.target.style.transform = 'translateY(-1px)';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = 'linear-gradient(135deg, #333 0%, #666 100%)';
                              e.target.style.transform = 'translateY(0)';
                            }}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            onClick={() => handleBusinessToggle(user)}
                            title={user.isBusiness ? "Убрать бизнес-статус" : "Сделать бизнес-аккаунтом"}
                            style={{
                              padding: '8px 12px',
                              background: user.isBusiness 
                                ? 'linear-gradient(135deg, #666 0%, #999 100%)' 
                                : 'linear-gradient(135deg, #999 0%, #ccc 100%)',
                              color: user.isBusiness ? 'white' : '#333',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => {
                              if (user.isBusiness) {
                                e.target.style.background = 'linear-gradient(135deg, #333 0%, #666 100%)';
                              } else {
                                e.target.style.background = 'linear-gradient(135deg, #666 0%, #999 100%)';
                                e.target.style.color = 'white';
                              }
                              e.target.style.transform = 'translateY(-1px)';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = user.isBusiness 
                                ? 'linear-gradient(135deg, #666 0%, #999 100%)' 
                                : 'linear-gradient(135deg, #999 0%, #ccc 100%)';
                              e.target.style.color = user.isBusiness ? 'white' : '#333';
                              e.target.style.transform = 'translateY(0)';
                            }}
                          >
                            <i className={user.isBusiness ? "bi bi-building-dash" : "bi bi-building-add"}></i>
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            title="Удалить"
                            disabled={user.role === 'admin'}
                            style={{
                              padding: '8px 12px',
                              background: user.role === 'admin' 
                                ? 'linear-gradient(135deg, #e5e5e5 0%, #ccc 100%)' 
                                : 'linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)',
                              color: user.role === 'admin' ? '#999' : 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: user.role === 'admin' ? 'not-allowed' : 'pointer',
                              fontSize: '14px',
                              transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => {
                              if (user.role !== 'admin') {
                                e.target.style.background = 'linear-gradient(135deg, #1a1a1a 0%, #000 100%)';
                                e.target.style.transform = 'translateY(-1px)';
                              }
                            }}
                            onMouseOut={(e) => {
                              if (user.role !== 'admin') {
                                e.target.style.background = 'linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)';
                                e.target.style.transform = 'translateY(0)';
                              }
                            }}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '60px',
                  color: '#666'
                }}>
                  <i className="bi bi-search" style={{
                    fontSize: '60px',
                    marginBottom: '20px'
                  }}></i>
                  <p style={{
                    fontSize: '18px',
                    margin: 0
                  }}>
                    Пользователи не найдены
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
          >
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              border: '1px solid #333'
            }}>
              {/* Modal Header */}
              <div style={{
                padding: '25px',
                borderBottom: '1px solid #e5e5e5',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
              }}>
                <h3 style={{
                  margin: 0,
                  color: '#1a1a1a',
                  fontSize: '20px',
                  fontWeight: '600'
                }}>
                  {modalType === 'edit' && 'Редактирование пользователя'}
                  {modalType === 'delete' && 'Подтверждение удаления'}
                  {modalType === 'business' && (formData.isBusiness ? 'Создание бизнес-аккаунта' : 'Удаление бизнес-статуса')}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#666',
                    padding: '0',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#e5e5e5';
                    e.target.style.color = '#333';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#666';
                  }}
                >
                  ×
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '25px' }}>
                {modalType === 'delete' ? (
                  <div style={{ textAlign: 'center' }}>
                    <i className="bi bi-exclamation-triangle" style={{
                      fontSize: '80px',
                      color: '#333',
                      marginBottom: '20px'
                    }}></i>
                    <h4 style={{
                      margin: '0 0 15px 0',
                      color: '#1a1a1a'
                    }}>
                      Удалить пользователя?
                    </h4>
                    <p style={{
                      color: '#666',
                      fontSize: '16px',
                      lineHeight: '1.5'
                    }}>
                      Вы действительно хотите удалить пользователя <strong>{selectedUser?.username}</strong>?
                      Это действие нельзя отменить.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '20px',
                      marginBottom: '20px'
                    }}>
                      <div>
                        <label style={{
                          display: 'block',
                          marginBottom: '8px',
                          fontWeight: '500',
                          color: '#1a1a1a'
                        }}>
                          Имя пользователя
                        </label>
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData({...formData, username: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid #e5e5e5',
                            borderRadius: '8px',
                            fontSize: '14px',
                            outline: 'none',
                            transition: 'all 0.3s'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#333';
                            e.target.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e5e5e5';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          marginBottom: '8px',
                          fontWeight: '500',
                          color: '#1a1a1a'
                        }}>
                          Email
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid #e5e5e5',
                            borderRadius: '8px',
                            fontSize: '14px',
                            outline: 'none',
                            transition: 'all 0.3s'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#333';
                            e.target.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e5e5e5';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '20px',
                      marginBottom: '20px'
                    }}>
                      <div>
                        <label style={{
                          display: 'block',
                          marginBottom: '8px',
                          fontWeight: '500',
                          color: '#1a1a1a'
                        }}>
                          Роль
                        </label>
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData({...formData, role: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid #e5e5e5',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            color: '#1a1a1a'
                          }}
                        >
                          <option value="user">Пользователь</option>
                          <option value="admin">Администратор</option>
                        </select>
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          marginBottom: '8px',
                          fontWeight: '500',
                          color: '#1a1a1a'
                        }}>
                          Бизнес-аккаунт
                        </label>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          height: '44px'
                        }}>
                          <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#1a1a1a'
                          }}>
                            <input
                              type="checkbox"
                              checked={formData.isBusiness}
                              onChange={(e) => setFormData({...formData, isBusiness: e.target.checked})}
                              style={{
                                marginRight: '10px',
                                transform: 'scale(1.2)'
                              }}
                            />
                            {formData.isBusiness ? "Да" : "Нет"}
                          </label>
                        </div>
                      </div>
                    </div>

                    {formData.isBusiness && (
                      <>
                        <div style={{ marginBottom: '20px' }}>
                          <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: '500',
                            color: '#1a1a1a'
                          }}>
                            Название компании
                          </label>
                          <input
                            type="text"
                            value={formData.companyName}
                            onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                            placeholder="Введите название компании"
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: '2px solid #e5e5e5',
                              borderRadius: '8px',
                              fontSize: '14px',
                              outline: 'none',
                              transition: 'all 0.3s'
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = '#333';
                              e.target.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.1)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = '#e5e5e5';
                              e.target.style.boxShadow = 'none';
                            }}
                          />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                          <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: '500',
                            color: '#1a1a1a'
                          }}>
                            Описание компании
                          </label>
                          <textarea
                            rows={3}
                            value={formData.companyDescription}
                            onChange={(e) => setFormData({...formData, companyDescription: e.target.value})}
                            placeholder="Введите описание компании"
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: '2px solid #e5e5e5',
                              borderRadius: '8px',
                              fontSize: '14px',
                              resize: 'vertical',
                              outline: 'none',
                              fontFamily: 'inherit',
                              transition: 'all 0.3s'
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = '#333';
                              e.target.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.1)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = '#e5e5e5';
                              e.target.style.boxShadow = 'none';
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '25px',
                borderTop: '1px solid #e5e5e5',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '15px',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
              }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #ccc 0%, #999 100%)',
                    color: '#333',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #999 0%, #666 100%)';
                    e.target.style.color = 'white';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #ccc 0%, #999 100%)';
                    e.target.style.color = '#333';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Отмена
                </button>
                {modalType === 'delete' ? (
                  <button
                    onClick={handleDeleteConfirm}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 0.3s'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, #1a1a1a 0%, #000 100%)';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <i className="bi bi-trash" style={{ marginRight: '8px' }}></i>
                    Удалить
                  </button>
                ) : (
                  <button
                    onClick={handleSaveUser}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #666 0%, #333 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 0.3s'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, #333 0%, #1a1a1a 100%)';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, #666 0%, #333 100%)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <i className="bi bi-check-lg" style={{ marginRight: '8px' }}></i>
                    Сохранить
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add CSS for animations and badges */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .badge-admin {
          background: linear-gradient(135deg, #1a1a1a 0%, #000 100%);
          color: white;
        }
        
        .badge-business {
          background: linear-gradient(135deg, #666 0%, #333 100%);
          color: white;
        }
        
        .badge-user {
          background: linear-gradient(135deg, #ccc 0%, #999 100%);
          color: #333;
        }
        
        @media (max-width: 768px) {
          .user-management-container {
            padding: 10px !important;
          }
          
          table {
            font-size: 12px;
          }
          
          td, th {
            padding: 10px !important;
          }
          
          .modal {
            padding: 10px;
          }
          
          .modal-content {
            width: 95% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminUserManagement;