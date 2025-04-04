import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import ProductsPage from './ProductsPage';

import LoginPage from './Login';
import RegisterPage from './Register';
import AdminPanel from './AdminPanel';
import UserProfile from './UserProfile'; // исправленный импорт
import CustomNavbar from './CustomNavbar'; // импорт Navbar

const App = () => {
  return (
    <Router>
      <CustomNavbar /> {/* Добавляем Navbar */}
      <Routes>
        <Route path="/" element={<ProductsPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<UserProfile />} /> {/* Путь совпадает с Navbar */}
      </Routes>
    </Router>
  );
};

export default App;
