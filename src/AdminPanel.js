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
        additionalPhotos: ['', '', '', ''], 
        specifications: [{ name: '', value: '' }], 
    });
    const [isUploading, setIsUploading] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(null);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    
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

    
    useEffect(() => {
        const uniqueCategories = [...new Set(products.map(product => product.category))];
        setCategories(uniqueCategories);
    }, [products]);

    
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

    
    const handleApiError = (error, prefix = 'Ошибка') => {
        if (error.response) {
            console.error("Error data:", error.response.data);
            console.error("Error status:", error.response.status);
            const errorMessage = error.response.data?.message || JSON.stringify(error.response.data) || error.message;
            setError(`${prefix}: ${error.response.status} - ${errorMessage}`);
        } else if (error.request) {
            console.error("No response received:", error.request);
            setError(`${prefix}: Сервер не отвечает`);
        } else {
            console.error('Error message:', error.message);
            setError(`${prefix}: ${error.message}`);
        }
    };

    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormProduct((prevProduct) => ({
            ...prevProduct,
            [name]: name === 'price' ? parseFloat(value) || 0 : value,
        }));
    };

    
    const handleAdditionalPhotoChange = (index, url) => {
        const newAdditionalPhotos = [...formProduct.additionalPhotos];
        newAdditionalPhotos[index] = url;
        setFormProduct(prev => ({
            ...prev,
            additionalPhotos: newAdditionalPhotos
        }));
    };

    
    const handleSpecificationChange = (index, field, value) => {
        const newSpecs = [...formProduct.specifications];
        newSpecs[index] = { ...newSpecs[index], [field]: value };
        setFormProduct(prev => ({
            ...prev,
            specifications: newSpecs
        }));
    };

    
    const handleAddSpecification = () => {
        setFormProduct(prev => ({
            ...prev,
            specifications: [...prev.specifications, { name: '', value: '' }]
        }));
    };

    
    const handleRemoveSpecification = (index) => {
        const newSpecs = [...formProduct.specifications];
        newSpecs.splice(index, 1);
        setFormProduct(prev => ({
            ...prev,
            specifications: newSpecs
        }));
    };

    
    const handleFileUpload = async (event, photoIndex = null) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setCurrentPhotoIndex(photoIndex);

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

            if (photoIndex === null) {
                
                setFormProduct(prev => ({
                    ...prev,
                    imageUrl: response.data.imageUrl
                }));
            } else {
                
                handleAdditionalPhotoChange(photoIndex, response.data.imageUrl);
            }
        } catch (error) {
            handleApiError(error, 'Ошибка загрузки изображения');
        } finally {
            setIsUploading(false);
            setCurrentPhotoIndex(null);
        }
    };

    
    const handleEditProduct = (product) => {
        setIsEditing(true);
        setCurrentProductId(product.id);
        
        
        const mainImageUrl = product.imageUrl;
        const additionalPhotos = product.photos
            .filter(photo => photo.displayOrder > 1)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map(photo => photo.imageUrl);
        
        
        const paddedAdditionalPhotos = [...additionalPhotos];
        while (paddedAdditionalPhotos.length < 4) {
            paddedAdditionalPhotos.push('');
        }
        
        setFormProduct({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            imageUrl: mainImageUrl,
            category: product.category,
            additionalPhotos: paddedAdditionalPhotos,
            specifications: product.specifications.length > 0 
                ? product.specifications.map(spec => ({ name: spec.name, value: spec.value }))
                : [{ name: '', value: '' }]
        });
        
     
        const formElement = document.getElementById('productForm');
        if (formElement) {
            formElement.scrollIntoView({ behavior: 'smooth' });
        }
    };

   
    const handleCancelEdit = () => {
        setIsEditing(false);
        setCurrentProductId(null);
        setFormProduct({
            name: '',
            description: '',
            price: 0,
            imageUrl: '',
            category: '',
            additionalPhotos: ['', '', '', ''],
            specifications: [{ name: '', value: '' }]
        });
    };

    
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
            setError("Необходимо загрузить главное изображение");
            return false;
        }
        
       
        for (const spec of formProduct.specifications) {
            if ((spec.name && !spec.value) || (!spec.name && spec.value)) {
                setError("Для каждой характеристики должны быть заполнены и название, и значение");
                return false;
            }
        }
        
        return true;
    };

    
    const handleSaveProduct = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!validateForm()) {
            return;
        }

        const token = localStorage.getItem("token");
        
        
        const validSpecs = formProduct.specifications.filter(
            spec => spec.name.trim() && spec.value.trim()
        );
        
        
        const validAdditionalPhotos = formProduct.additionalPhotos.filter(url => url.trim());
        
       
        const productData = {
            ...formProduct,
            specifications: validSpecs,
            additionalPhotos: validAdditionalPhotos
        };
        
        if (isEditing) {
            productData.id = currentProductId;
        }
        
        try {
            let response;
            
            if (isEditing) {
                
                console.log("Updating product with data:", productData);
                
                response = await axios.put(
                    `https://localhost:7209/api/Product/${currentProductId}`, 
                    productData, 
                    {
                        headers: { 
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                    }
                );
                
                
                const updatedProductResponse = await axios.get(
                    `https://localhost:7209/api/Product/${currentProductId}`,
                    {
                        headers: { 
                            "Authorization": `Bearer ${token}`
                        }
                    }
                );
                
                
                setProducts(prevProducts => 
                    prevProducts.map(product => {
                        if (product.id === currentProductId) {
                            return updatedProductResponse.data;
                        }
                        return product;
                    })
                );
                
                setSuccessMessage('Товар успешно обновлен!');
            } else {
               
                response = await axios.post(
                    'https://localhost:7209/api/Product', 
                    productData, 
                    {
                        headers: { 
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                    }
                );
                
                // Add the new product to the state
                setProducts(prevProducts => [...prevProducts, response.data]);
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

    // Фильтрация продуктов по поиску и категории
    const filteredProducts = products.filter(product => {
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
                                Главное изображение
                            </label>
                            <div className="file-upload">
                                <input
                                    type="file"
                                    onChange={(e) => handleFileUpload(e, null)}
                                    accept="image/*"
                                />
                                {isUploading && currentPhotoIndex === null && 
                                    <span className="upload-status">Загрузка...</span>
                                }
                            </div>
                        </div>
                    </div>
                    
                    {formProduct.imageUrl && (
                        <div className="form-group">
                            <label>
                                Предпросмотр главного изображения
                            </label>
                            <div className="image-preview">
                                <img 
                                    src={formProduct.imageUrl} 
                                    alt="Предпросмотр" 
                                />
                            </div>
                        </div>
                    )}

                    {/* Дополнительные фотографии */}
                    <div className="additional-photos-section">
                        <h3>Дополнительные фотографии (максимум 4)</h3>
                        <div className="additional-photos-grid">
                            {formProduct.additionalPhotos.map((photoUrl, index) => (
                                <div key={index} className="additional-photo-item">
                                    <div className="form-group">
                                        <label>Фото {index + 1}</label>
                                        <div className="file-upload">
                                            <input
                                                type="file"
                                                onChange={(e) => handleFileUpload(e, index)}
                                                accept="image/*"
                                            />
                                            {isUploading && currentPhotoIndex === index && 
                                                <span className="upload-status">Загрузка...</span>
                                            }
                                        </div>
                                        
                                        {photoUrl && (
                                            <div className="image-preview small">
                                                <img src={photoUrl} alt={`Фото ${index + 1}`} />
                                                <button 
                                                    type="button" 
                                                    className="remove-photo" 
                                                    onClick={() => handleAdditionalPhotoChange(index, '')}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Характеристики товара */}
                    <div className="specifications-section">
                        <h3>Характеристики товара</h3>
                        {formProduct.specifications.map((spec, index) => (
                            <div key={index} className="specification-item">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Название характеристики</label>
                                        <input
                                            type="text"
                                            value={spec.name}
                                            onChange={(e) => handleSpecificationChange(index, 'name', e.target.value)}
                                            placeholder="Например: Размер, Цвет, Материал..."
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Значение</label>
                                        <input
                                            type="text"
                                            value={spec.value}
                                            onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                                            placeholder="Например: XL, Красный, Хлопок..."
                                        />
                                    </div>
                                    <div className="form-group action-buttons">
                                        <button 
                                            type="button" 
                                            className="remove-spec" 
                                            onClick={() => handleRemoveSpecification(index)}
                                            disabled={formProduct.specifications.length <= 1}
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button 
                            type="button" 
                            className="add-spec-button" 
                            onClick={handleAddSpecification}
                        >
                            + Добавить характеристику
                        </button>
                    </div>
                    
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
                                    {product.photos && product.photos.length > 1 && (
                                        <div className="photo-count">+{product.photos.length - 1} фото</div>
                                    )}
                                </div>
                                <div className="product-info">
                                    <h3>{product.name}</h3>
                                    <p className="product-category">{product.category}</p>
                                    <p className="product-price">{product.price.toFixed(2)} $</p>
                                    <div className="product-description">{product.description}</div>
                                    
                                    {product.specifications && product.specifications.length > 0 && (
                                        <div className="product-specs">
                                            <h4>Характеристики:</h4>
                                            <ul>
                                                {product.specifications.map((spec, index) => (
                                                    <li key={index}>
                                                        <strong>{spec.name}:</strong> {spec.value}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
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