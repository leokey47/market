import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AdminPanel() {
    const navigate = useNavigate();
    const [userRole, setUserRole] = useState(null);
    const [products, setProducts] = useState([]);
    const [newProduct, setNewProduct] = useState({
        name: '',
        description: '',
        price: 0,
        imageUrl: '',
        category: '',
    });

    // Проверка роли пользователя при загрузке страницы
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedRole = localStorage.getItem('role'); // Роль сохраняем в localStorage

        if (!token || storedRole !== 'admin') {
            navigate('/login');
            return;
        }

        setUserRole(storedRole);
        fetchProducts(); // Получаем список продуктов
    }, [navigate]);

    // Получение списка продуктов
    const fetchProducts = async () => {
        try {
            const response = await axios.get('https://localhost:7209/api/Product');
            setProducts(response.data);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    // Обработчик изменения значений в форме добавления продукта
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewProduct((prevProduct) => ({
            ...prevProduct,
            [name]: value,
        }));
    };

    // Обработчик загрузки изображения
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
    
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
    
            console.log("Cloudinary response:", response.data);
    
            // Обновляем newProduct после загрузки изображения
            setNewProduct((prevProduct) => ({
                ...prevProduct,
                imageUrl: response.data.imageUrl,
            }));
        } catch (error) {
            console.error("Error uploading image:", error);
        }
    };
    

    const handleAddProduct = async (e) => {
        e.preventDefault();
    
        if (!newProduct.imageUrl) {
            alert("Ошибка: изображение еще не загружено!");
            return;
        }
    
        const token = localStorage.getItem("token");
    
        console.log("Product before sending:", newProduct);
    
        try {
            const response = await axios.post('https://localhost:7209/api/Product', newProduct, {
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            });
    
            setProducts((prevProducts) => [...prevProducts, response.data]);
            setNewProduct({ name: '', description: '', price: 0, imageUrl: '', category: '' });
        } catch (error) {
            console.error('Error adding product:', error);
        }
    };

    // Удаление продукта
    const handleDeleteProduct = async (id) => {
        console.log("Deleting product with ID:", id);
        const token = localStorage.getItem('token'); // Получаем токен
    
        try {
            const response = await axios.delete(`https://localhost:7209/api/Product/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`, // Добавляем токен в заголовок
                },
            });
    
            console.log("Delete response:", response);
            setProducts((prevProducts) => prevProducts.filter((product) => product.id !== id));
        } catch (error) {
            console.error('Error deleting product:', error.response?.data || error.message);
        }
    };
    
    

    // Логика выхода из панели администратора
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role'); // Удаляем роль
        navigate('/login');
    };

    // Если роль не 'admin', возвращаем null
    if (userRole !== 'admin') {
        return null;
    }

    return (
        <div>
            <h1>Admin Panel</h1>
            <p>Welcome, Admin!</p>
            <button onClick={handleLogout}>Logout</button>

            <h2>Add Product</h2>
            <form onSubmit={handleAddProduct}>
                <input
                    type="text"
                    name="name"
                    placeholder="Product Name"
                    value={newProduct.name}
                    onChange={handleInputChange}
                    required
                />
                <textarea
                    name="description"
                    placeholder="Description"
                    value={newProduct.description}
                    onChange={handleInputChange}
                    required
                />
                <input
                    type="number"
                    name="price"
                    placeholder="Price"
                    value={newProduct.price}
                    onChange={handleInputChange}
                    required
                />
                <input
                    type="file"
                    onChange={handleFileUpload}
                />
                {newProduct.imageUrl && <img src={newProduct.imageUrl} alt="Uploaded" width="100" />}
                <input
                    type="text"
                    name="category"
                    placeholder="Category"
                    value={newProduct.category}
                    onChange={handleInputChange}
                    required
                />
                <button type="submit">Add Product</button>
            </form>

            <h2>Product List</h2>
            <ul>
                {products.map((product) => (
                    <li key={product.id}>
                        <h3>{product.name}</h3>
                        <p>{product.description}</p>
                        <p>Price: ${product.price}</p>
                        <p>Category: {product.category}</p>
                        {product.imageUrl && <img src={product.imageUrl} alt={product.name} width="100" />}
                        <button onClick={() => handleDeleteProduct(product.id)}>Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default AdminPanel;
