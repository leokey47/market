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
      return <span className="badge badge-danger">Администратор</span>;
    } else if (user.isBusiness) {
      return <span className="badge badge-primary">Бизнес</span>;
    } else {
      return <span className="badge badge-secondary">Пользователь</span>;
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
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            margin: '0 0 10px 0',
            color: '#2c3e50',
            display: 'flex',
            alignItems: 'center',
            fontSize: '28px',
            fontWeight: '600'
          }}>
            <i className="bi bi-people-fill" style={{ marginRight: '15px', color: '#3498db' }}></i>
            Управление пользователями
          </h2>
          <p style={{
            color: '#6c757d',
            margin: 0,
            fontSize: '16px'
          }}>
            Просмотр, редактирование и управление всеми пользователями системы
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb',
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
                color: '#721c24'
              }}
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: '#d1edff',
            color: '#155724',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #c3e6cb',
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
                color: '#155724'
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
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
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
                color: '#2c3e50'
              }}>
                Поиск пользователей
              </label>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-search" style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6c757d',
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
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3498db'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                />
              </div>
            </div>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#2c3e50'
              }}>
                Фильтр по роли
              </label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
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
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
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
            border: '3px solid #3498db'
          }}>
            <i className="bi bi-people" style={{
              fontSize: '40px',
              color: '#3498db',
              marginBottom: '15px'
            }}></i>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '32px', fontWeight: '700', color: '#2c3e50' }}>
              {users.length}
            </h3>
            <p style={{ margin: 0, color: '#6c757d', fontWeight: '500' }}>Всего пользователей</p>
          </div>
          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            border: '3px solid #e74c3c'
          }}>
            <i className="bi bi-shield-check" style={{
              fontSize: '40px',
              color: '#e74c3c',
              marginBottom: '15px'
            }}></i>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '32px', fontWeight: '700', color: '#2c3e50' }}>
              {users.filter(u => u.role === 'admin').length}
            </h3>
            <p style={{ margin: 0, color: '#6c757d', fontWeight: '500' }}>Администраторов</p>
          </div>
          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            border: '3px solid #9b59b6'
          }}>
            <i className="bi bi-building" style={{
              fontSize: '40px',
              color: '#9b59b6',
              marginBottom: '15px'
            }}></i>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '32px', fontWeight: '700', color: '#2c3e50' }}>
              {users.filter(u => u.isBusiness).length}
            </h3>
            <p style={{ margin: 0, color: '#6c757d', fontWeight: '500' }}>Бизнес-аккаунтов</p>
          </div>
          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            border: '3px solid #95a5a6'
          }}>
            <i className="bi bi-person" style={{
              fontSize: '40px',
              color: '#95a5a6',
              marginBottom: '15px'
            }}></i>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '32px', fontWeight: '700', color: '#2c3e50' }}>
              {users.filter(u => u.role === 'user' && !u.isBusiness).length}
            </h3>
            <p style={{ margin: 0, color: '#6c757d', fontWeight: '500' }}>Обычных пользователей</p>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div style={{
            backgroundColor: 'white',
            padding: '60px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '20px'
            }}></div>
            <p style={{ color: '#6c757d', fontSize: '16px' }}>Загрузка пользователей...</p>
          </div>
        ) : users.length === 0 && !error ? (
          <div style={{
            backgroundColor: 'white',
            padding: '60px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <i className="bi bi-people" style={{
              fontSize: '60px',
              color: '#6c757d',
              marginBottom: '20px'
            }}></i>
            <h3 style={{ color: '#6c757d', marginBottom: '15px' }}>Пользователи не найдены</h3>
            <p style={{ color: '#6c757d', marginBottom: '20px' }}>
              Возможно, эндпоинт не настроен или у вас нет прав доступа
            </p>
            <button
              onClick={fetchUsers}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3498db',
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
            overflow: 'hidden'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#2c3e50' }}>
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
                      borderBottom: '1px solid #e9ecef',
                      backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                      transition: 'background-color 0.3s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e3f2fd'}
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
                                  border: '2px solid #e9ecef'
                                }}
                              />
                            ) : (
                              <div style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                backgroundColor: '#3498db',
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
                              color: '#2c3e50',
                              fontSize: '16px',
                              marginBottom: '4px'
                            }}>
                              {user.username}
                            </div>
                            <small style={{
                              color: '#6c757d',
                              fontSize: '12px'
                            }}>
                              ID: {user.id}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td style={{
                        padding: '20px',
                        color: '#2c3e50',
                        fontSize: '14px'
                      }}>
                        {user.email}
                      </td>
                      <td style={{ padding: '20px' }}>
                        {getRoleBadge(user)}
                      </td>
                      <td style={{
                        padding: '20px',
                        color: '#6c757d',
                        fontSize: '14px'
                      }}>
                        {formatDate(user.createdAt)}
                      </td>
                      <td style={{ padding: '20px' }}>
                        {user.isBusiness && user.companyName ? (
                          <div>
                            <div style={{
                              fontWeight: '600',
                              color: '#2c3e50',
                              fontSize: '14px',
                              marginBottom: '4px'
                            }}>
                              {user.companyName}
                            </div>
                            <small style={{
                              color: '#6c757d',
                              fontSize: '12px'
                            }}>
                              {user.companyDescription?.substring(0, 30)}
                              {user.companyDescription?.length > 30 ? '...' : ''}
                            </small>
                          </div>
                        ) : (
                          <span style={{ color: '#6c757d' }}>—</span>
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
                              backgroundColor: '#3498db',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              transition: 'background-color 0.3s'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            onClick={() => handleBusinessToggle(user)}
                            title={user.isBusiness ? "Убрать бизнес-статус" : "Сделать бизнес-аккаунтом"}
                            style={{
                              padding: '8px 12px',
                              backgroundColor: user.isBusiness ? '#f39c12' : '#27ae60',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              transition: 'background-color 0.3s'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = user.isBusiness ? '#e67e22' : '#229954'}
                            onMouseOut={(e) => e.target.style.backgroundColor = user.isBusiness ? '#f39c12' : '#27ae60'}
                          >
                            <i className={user.isBusiness ? "bi bi-building-dash" : "bi bi-building-add"}></i>
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            title="Удалить"
                            disabled={user.role === 'admin'}
                            style={{
                              padding: '8px 12px',
                              backgroundColor: user.role === 'admin' ? '#bdc3c7' : '#e74c3c',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: user.role === 'admin' ? 'not-allowed' : 'pointer',
                              fontSize: '14px',
                              transition: 'background-color 0.3s'
                            }}
                            onMouseOver={(e) => {
                              if (user.role !== 'admin') {
                                e.target.style.backgroundColor = '#c0392b';
                              }
                            }}
                            onMouseOut={(e) => {
                              if (user.role !== 'admin') {
                                e.target.style.backgroundColor = '#e74c3c';
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
                  color: '#6c757d'
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
            backgroundColor: 'rgba(0,0,0,0.5)',
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
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}>
              {/* Modal Header */}
              <div style={{
                padding: '25px',
                borderBottom: '1px solid #e9ecef',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{
                  margin: 0,
                  color: '#2c3e50',
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
                    color: '#6c757d',
                    padding: '0',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
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
                      color: '#e74c3c',
                      marginBottom: '20px'
                    }}></i>
                    <h4 style={{
                      margin: '0 0 15px 0',
                      color: '#2c3e50'
                    }}>
                      Удалить пользователя?
                    </h4>
                    <p style={{
                      color: '#6c757d',
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
                          color: '#2c3e50'
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
                            border: '2px solid #e9ecef',
                            borderRadius: '8px',
                            fontSize: '14px',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block',
                          marginBottom: '8px',
                          fontWeight: '500',
                          color: '#2c3e50'
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
                            border: '2px solid #e9ecef',
                            borderRadius: '8px',
                            fontSize: '14px',
                            outline: 'none'
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
                          color: '#2c3e50'
                        }}>
                          Роль
                        </label>
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData({...formData, role: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid #e9ecef',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: 'white',
                            cursor: 'pointer'
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
                          color: '#2c3e50'
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
                            color: '#2c3e50'
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
                            color: '#2c3e50'
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
                              border: '2px solid #e9ecef',
                              borderRadius: '8px',
                              fontSize: '14px',
                              outline: 'none'
                            }}
                          />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                          <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: '500',
                            color: '#2c3e50'
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
                              border: '2px solid #e9ecef',
                              borderRadius: '8px',
                              fontSize: '14px',
                              resize: 'vertical',
                              outline: 'none',
                              fontFamily: 'inherit'
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
                borderTop: '1px solid #e9ecef',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '15px'
              }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
                >
                  Отмена
                </button>
                {modalType === 'delete' ? (
                  <button
                    onClick={handleDeleteConfirm}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'background-color 0.3s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#c0392b'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#e74c3c'}
                  >
                    <i className="bi bi-trash" style={{ marginRight: '8px' }}></i>
                    Удалить
                  </button>
                ) : (
                  <button
                    onClick={handleSaveUser}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'background-color 0.3s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#229954'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#27ae60'}
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

      {/* Add CSS for animations */}
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
        
        .badge-danger {
          background-color: #e74c3c;
          color: white;
        }
        
        .badge-primary {
          background-color: #3498db;
          color: white;
        }
        
        .badge-secondary {
          background-color: #95a5a6;
          color: white;
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