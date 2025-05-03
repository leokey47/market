import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
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
import ComparePage from './ComparePage';
import CheckoutPage from './CheckoutPage';
import OrdersPage from './OrdersPage';
import OrderStatusPage from './OrderStatusPage';
import PaymentSuccessPage from './PaymentSuccessPage';
import PaymentCancelPage from './PaymentCancelPage';
import OAuthCallback from './OAuthCallback';
import CustomNavbar from './CustomNavbar';
import CompareFloatingButton from './CompareFloatingButton';
import { CompareProvider } from './CompareContext';
import './App.css';

// Authentication Guard
const PrivateRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  return isAuthenticated ? element : <Navigate to="/login" />;
};

// Admin Guard
const AdminRoute = ({ element }) => {
  const isAdmin = localStorage.getItem('role') === 'admin';
  const isAuthenticated = localStorage.getItem('token') !== null;
 
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
 
  return isAdmin ? element : <Navigate to="/" />;
};

const App = () => {
  return (
    <CompareProvider>
      <Router>
        <CustomNavbar />
        <div className="content-wrapper">
          <Routes>
            <Route path="/" element={<ProductsPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/oauth-callback" element={<OAuthCallback />} />
            <Route path="/admin" element={<AdminRoute element={<AdminPanel />} />} />
            <Route path="/profile" element={<PrivateRoute element={<UserProfile />} />} />
            <Route path="/cart" element={<PrivateRoute element={<CartPage />} />} />
            <Route path="/wishlist" element={<PrivateRoute element={<WishlistPage />} />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/checkout" element={<PrivateRoute element={<CheckoutPage />} />} />
            <Route path="/orders" element={<PrivateRoute element={<OrdersPage />} />} />
            <Route path="/orders/:orderId" element={<PrivateRoute element={<OrderStatusPage />} />} />
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
            <Route path="/payment/cancel" element={<PaymentCancelPage />} />
          </Routes>
        </div>
        <CompareFloatingButton />
      </Router>
    </CompareProvider>
  );
};

export default App;