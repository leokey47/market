import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductService, CloudinaryService, UserService, apiClient } from './ApiService';
import './BusinessPanel.css';

function BusinessPanel() {
    const [businessData, setBusinessData] = useState(null);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddProductForm, setShowAddProductForm] = useState(false);
    const [productForm, setProductForm] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        imageUrl: '',
        additionalPhotos: [],
        specifications: []
    });
    const [mainImage, setMainImage] = useState(null);
    const [additionalImages, setAdditionalImages] = useState([]);
    const [uploadStatus, setUploadStatus] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBusinessData = async () => {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                navigate('/login');
                return;
            }

            try {
                // Получаем данные пользователя для проверки статуса бизнеса
                const response = await UserService.getUserProfile(userId);
                
                if (!response.isBusiness) {
                    alert('У вас нет бизнес аккаунта');
                    navigate('/profile');
                    return;
                }
                
                setBusinessData(response);
                
                // Получаем список продуктов бизнеса
                const productsResponse = await UserService.getBusinessProducts(userId);
                setProducts(productsResponse || []);
                
                setIsLoading(false);
            } catch (error) {
                console.error('Ошибка загрузки данных бизнеса:', error);
                setError('Ошибка загрузки данных бизнеса');
                setIsLoading(false);
            }
        };

        fetchBusinessData();
    }, [navigate]);

    const handleInputChange = (e) => {
        setProductForm({
            ...productForm,
            [e.target.name]: e.target.value
        });
    };

    const handleMainImageChange = (e) => {
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
            
            setMainImage(file);
            setUploadStatus('Основное изображение выбрано');
        }
    };

    const handleAdditionalImagesChange = (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files).slice(0, 4); // Ограничиваем 4 изображениями
            
            for (const file of files) {
                if (!file.type.startsWith('image/')) {
                    setUploadStatus('Ошибка: выбранный файл не является изображением');
                    return;
                }
                
                if (file.size > 5 * 1024 * 1024) {
                    setUploadStatus('Ошибка: размер файла не должен превышать 5MB');
                    return;
                }
            }
            
            setAdditionalImages(files);
            setUploadStatus(`Дополнительных изображений выбрано: ${files.length}`);
        }
    };

    const addSpecification = () => {
        setProductForm({
            ...productForm,
            specifications: [...productForm.specifications, { name: '', value: '' }]
        });
    };

    const removeSpecification = (index) => {
        const updatedSpecs = productForm.specifications.filter((_, i) => i !== index);
        setProductForm({
            ...productForm,
            specifications: updatedSpecs
        });
    };

    const handleSpecificationChange = (index, field, value) => {
        const updatedSpecs = [...productForm.specifications];
        updatedSpecs[index][field] = value;
        setProductForm({
            ...productForm,
            specifications: updatedSpecs
        });
    };

    const handleSubmitProduct = async (e) => {
        e.preventDefault();
        setUploadStatus('Создание товара...');

        try {
            let mainImageUrl = '';
            let additionalPhotoUrls = [];

            // Загружаем основное изображение
            if (mainImage) {
                setUploadStatus('Загрузка основного изображения...');
                const mainImageResponse = await CloudinaryService.uploadImage(mainImage);
                if (mainImageResponse && mainImageResponse.imageUrl) {
                    mainImageUrl = mainImageResponse.imageUrl;
                }
            }

            // Загружаем дополнительные изображения
            if (additionalImages.length > 0) {
                setUploadStatus('Загрузка дополнительных изображений...');
                for (const image of additionalImages) {
                    const imageResponse = await CloudinaryService.uploadImage(image);
                    if (imageResponse && imageResponse.imageUrl) {
                        additionalPhotoUrls.push(imageResponse.imageUrl);
                    }
                }
            }

            // Создаем товар
            const productData = {
                name: productForm.name,
                description: productForm.description,
                price: parseFloat(productForm.price),
                category: productForm.category,
                imageUrl: mainImageUrl,
                additionalPhotos: additionalPhotoUrls,
                specifications: productForm.specifications.filter(spec => spec.name && spec.value)
            };

            await ProductService.createProduct(productData);
            
            setShowAddProductForm(false);
            setUploadStatus('');
            alert('Товар успешно создан!');
            
            // Обновляем список товаров
            const userId = localStorage.getItem('userId');
            const productsResponse = await UserService.getBusinessProducts(userId);
            setProducts(productsResponse || []);
            
            // Сбрасываем форму
            setProductForm({
                name: '',
                description: '',
                price: '',
                category: '',
                imageUrl: '',
                additionalPhotos: [],
                specifications: []
            });
            setMainImage(null);
            setAdditionalImages([]);
            
        } catch (error) {
            console.error('Ошибка создания товара:', error);
            setUploadStatus('');
            alert('Не удалось создать товар: ' + (error.response?.data?.message || error.message));
        }
    };

    const deleteProduct = async (productId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) {
            return;
        }

        try {
            await ProductService.deleteProduct(productId);
            
            // Обновляем список товаров
            const userId = localStorage.getItem('userId');
            const productsResponse = await UserService.getBusinessProducts(userId);
            setProducts(productsResponse || []);
            
            alert('Товар успешно удален');
        } catch (error) {
            console.error('Ошибка удаления товара:', error);
            alert('Не удалось удалить товар');
        }
    };

    if (isLoading) {
        return (
            <div className="business-panel-loading">
                <div className="spinner"></div>
                <p>Загрузка данных бизнеса...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="business-panel-error">
                <p>{error}</p>
                <button onClick={() => navigate('/profile')} className="button primary">
                    Вернуться в профиль
                </button>
            </div>
        );
    }

    if (!businessData) {
        return (
            <div className="business-panel-error">
                <p>Ошибка загрузки данных</p>
                <button onClick={() => navigate('/profile')} className="button primary">
                    Вернуться в профиль
                </button>
            </div>
        );
    }

    return (
        <div className="business-panel-container">
            <div className="business-header">
                <div className="business-info-header">
                    <div className="business-logo">
                        {businessData.companyAvatar ? (
                            <img 
                                src={businessData.companyAvatar} 
                                alt={businessData.companyName} 
                                className="business-logo-img"
                            />
                        ) : (
                            <div className="business-logo-placeholder">
                                {businessData.companyName?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="business-title">
                        <h1>{businessData.companyName}</h1>
                        <p>{businessData.companyDescription}</p>
                    </div>
                </div>
                <button onClick={() => navigate('/profile')} className="back-button">
                    Вернуться в профиль
                </button>
            </div>

            <div className="business-content">
                <div className="products-section">
                    <div className="products-header">
                        <h2>Мои товары</h2>
                        <button 
                            onClick={() => setShowAddProductForm(!showAddProductForm)}
                            className="add-product-button"
                        >
                            {showAddProductForm ? 'Отмена' : 'Добавить товар'}
                        </button>
                    </div>

                    {showAddProductForm && (
                        <div className="add-product-form">
                            <h3>Добавить новый товар</h3>
                            <form onSubmit={handleSubmitProduct}>
                                <div className="form-group">
                                    <label htmlFor="name">Название товара</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={productForm.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="description">Описание</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={productForm.description}
                                        onChange={handleInputChange}
                                        rows="4"
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="price">Цена</label>
                                        <input
                                            type="number"
                                            id="price"
                                            name="price"
                                            value={productForm.price}
                                            onChange={handleInputChange}
                                            step="0.01"
                                            min="0"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="category">Категория</label>
                                        <select
                                            id="category"
                                            name="category"
                                            value={productForm.category}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">Выберите категорию</option>
                                            <option value="Техника">Техника</option>
                                            <option value="Инструменты">Инструменты</option>
                                            <option value="Одежда">Одежда</option>
                                            <option value="Книги">Книги</option>
                                            <option value="Игрушки">Игрушки</option>
                                            <option value="Спорт">Спорт</option>
                                            <option value="Другое">Другое</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="mainImage">Основное изображение</label>
                                    <input
                                        type="file"
                                        id="mainImage"
                                        accept="image/*"
                                        onChange={handleMainImageChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="additionalImages">Дополнительные изображения (до 4)</label>
                                    <input
                                        type="file"
                                        id="additionalImages"
                                        accept="image/*"
                                        multiple
                                        onChange={handleAdditionalImagesChange}
                                    />
                                </div>

                                <div className="specifications-section">
                                    <div className="specs-header">
                                        <h4>Характеристики</h4>
                                        <button 
                                            type="button" 
                                            onClick={addSpecification}
                                            className="add-spec-button"
                                        >
                                            Добавить характеристику
                                        </button>
                                    </div>
                                    
                                    {productForm.specifications.map((spec, index) => (
                                        <div key={index} className="specification-row">
                                            <input
                                                type="text"
                                                placeholder="Название"
                                                value={spec.name}
                                                onChange={(e) => handleSpecificationChange(index, 'name', e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Значение"
                                                value={spec.value}
                                                onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => removeSpecification(index)}
                                                className="remove-spec-button"
                                            >
                                                Удалить
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {uploadStatus && <p className="upload-status">{uploadStatus}</p>}

                                <div className="form-actions">
                                    <button type="submit" className="submit-button">
                                        Создать товар
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="products-grid">
                        {products.length === 0 ? (
                            <p className="no-products">У вас пока нет товаров</p>
                        ) : (
                            products.map((product) => (
                                <div key={product.id} className="product-card">
                                    <div className="product-image">
                                        {product.imageUrl ? (
                                            <img src={product.imageUrl} alt={product.name} />
                                        ) : (
                                            <div className="no-image">Нет изображения</div>
                                        )}
                                    </div>
                                    <div className="product-info">
                                        <h4>{product.name}</h4>
                                        <p className="product-price">${product.price}</p>
                                        <p className="product-category">{product.category}</p>
                                    </div>
                                    <div className="product-actions">
                                        <button 
                                            onClick={() => navigate(`/product/${product.id}`)}
                                            className="view-button"
                                        >
                                            Просмотр
                                        </button>
                                        <button 
                                            onClick={() => deleteProduct(product.id)}
                                            className="delete-button"
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BusinessPanel;