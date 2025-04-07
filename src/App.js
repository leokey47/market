import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';  
import ProductsPage from './ProductsPage';
import ProductDetailPage from './ProductDetailPage';
import LoginPage from './Login';
import RegisterPage from './Register';
import AdminPanel from './AdminPanel';
import UserProfile from './UserProfile';
import CartPage from './CartPage';
import WishlistPage from './WishlistPage';
import CustomNavbar from './CustomNavbar';
import './App.css';

const App = () => {
  return (
    <Router>
      <CustomNavbar />
      <div className="content-wrapper">
        <Routes>
          <Route path="/" element={<ProductsPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;