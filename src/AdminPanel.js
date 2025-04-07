import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminPanel.css';

function AdminPanel() {
    const navigate = useNavigate();
    const [userRole, setUserRole] = useState(null);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentProductId, setCurrentProductId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [formProduct, setFormProduct] = useState({
        name: '',
        description: '',
        price: 0,
        imageUrl: '',
        category: '',
    });
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Проверка роли пользователя при загрузке страницы
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedRole = localStorage.getItem('role');

        if (!token || storedRole !== 'admin') {
            navigate('/login');
            return;
        }

        setUserRole(storedRole);
        fetchProducts();
    }, [navigate]);

    // Извлечение уникальных категорий из списка продуктов
    useEffect(() => {
        const uniqueCategories = [...new Set(products.map(product => product.category))];
        setCategories(uniqueCategories);
    }, [products]);

    // Получение списка продуктов
    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('https://localhost:7209/api/Product');
            setProducts(response.data);
        } catch (error) {
            handleApiError(error, 'Ошибка при загрузке товаров');
        } finally {
            setIsLoading(false);
        }
    };

    // Обработчик ошибок API
    const handleApiError = (error, prefix = 'Ошибка') => {
        if (error.response) {
            // Сервер ответил с кодом статуса вне диапазона 2xx
            console.error("Error data:", error.response.data);
            console.error("Error status:", error.response.status);
            const errorMessage = error.response.data?.message || JSON.stringify(error.response.data) || error.message;
            setError(`${prefix}: ${error.response.status} - ${errorMessage}`);
        } else if (error.request) {
            // Запрос был сделан, но ответ не получен
            console.error("No response received:", error.request);
            setError(`${prefix}: Сервер не отвечает`);
        } else {
            // Что-то произошло при настройке запроса
            console.error('Error message:', error.message);
            setError(`${prefix}: ${error.message}`);
        }
    };

    // Обработчик изменения значений в форме
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormProduct((prevProduct) => ({
            ...prevProduct,
            [name]: name === 'price' ? parseFloat(value) || 0 : value,
        }));
    };

    // Обработчик загрузки изображения
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        const token = localStorage.getItem("token");

        try {
            const response = await axios.post("https://localhost:7209/api/Cloudinary/upload", formData, {
                headers: { 
                    "Content-Type": "multipart/form-data",
                    "Authorization": `Bearer ${token}`
                },
            });

            setFormProduct((prevProduct) => ({
                ...prevProduct,
                imageUrl: response.data.imageUrl,
            }));
        } catch (error) {
            handleApiError(error, 'Ошибка загрузки изображения');
        } finally {
            setIsUploading(false);
        }
    };

    // Начало редактирования товара
    const handleEditProduct = (product) => {
        setIsEditing(true);
        setCurrentProductId(product.id);
        setFormProduct({
            id: product.id, // Обязательно добавляем id в formProduct для редактирования
            name: product.name,
            description: product.description,
            price: product.price,
            imageUrl: product.imageUrl,
            category: product.category,
        });
        
        // Прокрутка к форме
        const formElement = document.getElementById('productForm');
        if (formElement) {
            formElement.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Отмена редактирования
    const handleCancelEdit = () => {
        setIsEditing(false);
        setCurrentProductId(null);
        setFormProduct({
            name: '',
            description: '',
            price: 0,
            imageUrl: '',
            category: '',
        });
    };

    // Проверка данных формы перед отправкой
    const validateForm = () => {
        if (!formProduct.name.trim()) {
            setError("Название товара не может быть пустым");
            return false;
        }
        
        if (!formProduct.category.trim()) {
            setError("Категория не может быть пустой");
            return false;
        }
        
        if (!formProduct.description.trim()) {
            setError("Описание не может быть пустым");
            return false;
        }
        
        if (formProduct.price <= 0) {
            setError("Цена должна быть больше нуля");
            return false;
        }
        
        if (!formProduct.imageUrl) {
            setError("Необходимо загрузить изображение");
            return false;
        }
        
        return true;
    };

    // Сохранение товара (добавление или обновление)
    const handleSaveProduct = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!validateForm()) {
            return;
        }

        const token = localStorage.getItem("token");
        
        try {
            let response;
            
            if (isEditing) {
                // Обновление существующего товара
                // Убедимся, что id включен в отправляемые данные
                const productToUpdate = {
                    ...formProduct,
                    id: currentProductId // Явно устанавливаем id
                };
                
                console.log("Updating product with data:", productToUpdate);
                
                response = await axios.put(
                    `https://localhost:7209/api/Product/${currentProductId}`, 
                    productToUpdate, 
                    {
                        headers: { 
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                    }
                );
                
                console.log("API response for updated product:", response.data);
                
                // Более безопасное обновление состояния
                setProducts(prevProducts => 
                    prevProducts.map(product => {
                        if (product.id === currentProductId) {
                            const updatedProduct = {
                                ...product, // Сохраняем существующие свойства как резервные
                                ...response.data, // Добавляем обновленные свойства
                                // Явно обеспечиваем наличие необходимых полей
                                id: response.data.id || currentProductId,
                                name: response.data.name || formProduct.name,
                                description: response.data.description || formProduct.description,
                                price: response.data.price || formProduct.price,
                                imageUrl: response.data.imageUrl || formProduct.imageUrl,
                                category: response.data.category || formProduct.category
                            };
                            return updatedProduct;
                        }
                        return product;
                    })
                );
                setSuccessMessage('Товар успешно обновлен!');
            } else {
                // Добавление нового товара
                response = await axios.post(
                    'https://localhost:7209/api/Product', 
                    formProduct, 
                    {
                        headers: { 
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                    }
                );
                
                console.log("API response for new product:", response.data);
                
                // Убедимся, что у нового продукта есть все необходимые поля
                const newProduct = {
                    ...formProduct,
                    id: response.data.id, // Получаем ID от сервера
                    name: response.data.name || formProduct.name,
                    description: response.data.description || formProduct.description,
                    price: response.data.price || formProduct.price,
                    imageUrl: response.data.imageUrl || formProduct.imageUrl,
                    category: response.data.category || formProduct.category
                };
                
                setProducts(prevProducts => [...prevProducts, newProduct]);
                setSuccessMessage('Товар успешно добавлен!');
            }
            
            // Сброс формы
            handleCancelEdit();
            
            // Очистка сообщения об успехе через 3 секунды
            setTimeout(() => setSuccessMessage(''), 3000);
            
        } catch (error) {
            handleApiError(error, 'Ошибка при сохранении товара');
        }
    };

    // Удаление продукта
    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) {
            return;
        }
        
        const token = localStorage.getItem('token');
    
        try {
            await axios.delete(`https://localhost:7209/api/Product/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
    
            setProducts((prevProducts) => prevProducts.filter((product) => product.id !== id));
            setSuccessMessage('Товар успешно удален!');
            
            // Очистка сообщения об успехе через 3 секунды
            setTimeout(() => setSuccessMessage(''), 3000);
            
        } catch (error) {
            handleApiError(error, 'Ошибка при удалении товара');
        }
    };

    // Логика выхода из панели администратора
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    // Фильтрация продуктов по поиску и категории с проверкой на наличие полей
    const filteredProducts = products.filter(product => {
        // Проверка наличия необходимых полей
        if (!product || !product.name || !product.description) {
            console.error("Invalid product in list:", product);
            return false; // Пропускаем этот продукт
        }
        
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            product.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === '' || product.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    // Если роль не 'admin', возвращаем null
    if (userRole !== 'admin') {
        return null;
    }

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>Market Admin$</h1>
                <button onClick={handleLogout} className="logout-button">
                    Выйти
                </button>
            </header>

            {error && (
                <div className="error-message">
                    {error}
                    <button 
                        className="close-error" 
                        onClick={() => setError('')}
                        style={{ marginLeft: '10px', cursor: 'pointer' }}
                    >
                        ✕
                    </button>
                </div>
            )}
            
            {successMessage && (
                <div className="success-message">
                    {successMessage}
                </div>
            )}

            <div className="form-container" id="productForm">
                <h2>
                    {isEditing ? "Редактирование товара" : "Добавление нового товара"}
                </h2>
                <form onSubmit={handleSaveProduct}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>
                                Название товара
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formProduct.name}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>
                                Категория
                            </label>
                            <input
                                type="text"
                                name="category"
                                list="categories"
                                value={formProduct.category}
                                onChange={handleInputChange}
                                required
                            />
                            <datalist id="categories">
                                {categories.map((category, index) => (
                                    <option key={index} value={category} />
                                ))}
                            </datalist>
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label>
                            Описание
                        </label>
                        <textarea
                            name="description"
                            value={formProduct.description}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    
                    <div className="form-grid">
                        <div className="form-group">
                            <label>
                                Цена
                            </label>
                            <input
                                type="number"
                                name="price"
                                value={formProduct.price}
                                onChange={handleInputChange}
                                step="0.01"
                                min="0"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>
                                Изображение
                            </label>
                            <div className="file-upload">
                                <input
                                    type="file"
                                    onChange={handleFileUpload}
                                    accept="image/*"
                                />
                                {isUploading && <span className="upload-status">Загрузка...</span>}
                            </div>
                        </div>
                    </div>
                    
                    {formProduct.imageUrl && (
                        <div className="form-group">
                            <label>
                                Предпросмотр изображения
                            </label>
                            <div className="image-preview">
                                <img 
                                    src={formProduct.imageUrl} 
                                    alt="Предпросмотр" 
                                />
                            </div>
                        </div>
                    )}
                    
                    <div className="form-actions">
                        {isEditing && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="cancel-button"
                            >
                                Отмена
                            </button>
                        )}
                        <button
                            type="submit"
                            className="save-button"
                        >
                            {isEditing ? "Сохранить изменения" : "Добавить товар"}
                        </button>
                    </div>
                </form>
            </div>

            <div className="products-container">
                <h2>Управление товарами</h2>
                
                <div className="filters">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Поиск товаров..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="category-filter">
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            <option value="">Все категории</option>
                            {categories.map((category, index) => (
                                <option key={index} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="loading">Загрузка товаров...</div>
                ) : filteredProducts.length === 0 ? (
                    <div className="no-products">Товары не найдены</div>
                ) : (
                    <div className="products-grid">
                        {filteredProducts.map((product) => (
                            <div key={product.id} className="product-card">
                                <div className="product-image">
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} />
                                    ) : (
                                        <div className="no-image">Нет изображения</div>
                                    )}
                                </div>
                                <div className="product-info">
                                    <h3>{product.name}</h3>
                                    <p className="product-category">{product.category}</p>
                                    <p className="product-price">{product.price.toFixed(2)} $</p>
                                    <div className="product-description">{product.description}</div>
                                </div>
                                <div className="product-actions">
                                    <button 
                                        onClick={() => handleEditProduct(product)}
                                        className="edit-button"
                                    >
                                        Редактировать
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteProduct(product.id)}
                                        className="delete-button"
                                    >
                                        Удалить
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminPanel;