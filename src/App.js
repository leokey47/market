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
import BusinessPanel from './BusinessPanel';
import CustomNavbar from './CustomNavbar';
import CompareFloatingButton from './CompareFloatingButton';
import { CompareProvider } from './CompareContext';
import { DeliveryProvider } from './contexts/DeliveryContext';
import AdminPaymentManager from './AdminPaymentManager';

// Тестовые компоненты для разработки
import OrderDetailsPage from './OrderDetailsPage';
import PaymentSimulator from './PaymentSimulator';
import TestPayment from './PaymentTest';

// Компоненты доставки
import NovaPoshtaMap from './components/Delivery/NovaPoshtaMap';
import TrackingHistory from './components/Delivery/TrackingHistory';
import NovaPoshtaSelector from './components/Delivery/NovaPoshtaSelector';

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

// Business Guard
const BusinessRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  const isBusiness = localStorage.getItem('isBusiness') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (!isBusiness) {
    return <Navigate to="/profile" />;
  }
  
  return element;
};

// Development Guard - только для разработки
const DevRoute = ({ element }) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (!isDevelopment) {
    return <Navigate to="/" />;
  }
  
  return element;
};

// Простые страницы для маршрутизации Новой почты
const DeliveryMapPage = () => (
  <div className="container py-5">
    <h1 className="mb-4">Карта отделений Новой Почты</h1>
    <div style={{ height: '600px' }}>
      <NovaPoshtaMap />
    </div>
  </div>
);

const DeliveryTrackingPage = () => (
  <div className="container py-5">
    <h1 className="mb-4">Отслеживание посылки</h1>
    <TrackingHistory 
      trackingInfo={{
        status: 'InTransit',
        statusDescription: 'В пути',
        currentCity: 'Киев',
        currentWarehouse: 'Отделение №1',
        statusHistory: []
      }}
    />
  </div>
);

const DeliverySettingsPage = () => (
  <div className="container py-5">
    <h1 className="mb-4">Настройки доставки</h1>
    <NovaPoshtaSelector />
  </div>
);

// Страница тестирования платежей
const PaymentTestPage = () => (
  <div className="container py-5">
    <h1 className="mb-4">Payment Testing Tools</h1>
    <div className="alert alert-warning">
      <i className="bi bi-exclamation-triangle-fill me-2"></i>
      This page is only available in development mode
    </div>
    <div className="row">
      <div className="col-md-6">
        <PaymentSimulator orderId={1} />
      </div>
      <div className="col-md-6">
        <TestPayment orderId={1} />
      </div>
    </div>
  </div>
);

// Страница тестирования заказов
const OrderTestPage = () => {
  const [orderId, setOrderId] = React.useState('');
  
  return (
    <div className="container py-5">
      <h1 className="mb-4">Order Testing Tools</h1>
      <div className="mb-4">
        <input 
          type="text" 
          className="form-control" 
          placeholder="Enter Order ID to test" 
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
        />
      </div>
      {orderId && (
        <>
          <OrderDetailsPage />
          <div className="mt-4">
            <PaymentSimulator orderId={orderId} />
          </div>
        </>
      )}
    </div>
  );
};

const App = () => {
  return (
    <DeliveryProvider>
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
              <Route path="/admin/payments" element={<AdminRoute element={<AdminPaymentManager />} />} />
              <Route path="/profile" element={<PrivateRoute element={<UserProfile />} />} />
              <Route path="/cart" element={<PrivateRoute element={<CartPage />} />} />
              <Route path="/wishlist" element={<PrivateRoute element={<WishlistPage />} />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/checkout" element={<PrivateRoute element={<CheckoutPage />} />} />
              <Route path="/orders" element={<PrivateRoute element={<OrdersPage />} />} />
              <Route path="/orders/:orderId" element={<PrivateRoute element={<OrderDetailsPage />} />} />
              <Route path="/order/:orderId" element={<PrivateRoute element={<OrderDetailsPage />} />} />
              <Route path="/payment/success" element={<PaymentSuccessPage />} />
              <Route path="/payment-success" element={<PaymentSuccessPage />} />
              <Route path="/payment/cancel" element={<PaymentCancelPage />} />
              <Route path="/payment-cancel" element={<PaymentCancelPage />} />
              <Route path="/business-panel" element={<BusinessRoute element={<BusinessPanel />} />} />
              
              {/* Маршруты для функционала Новой почты */}
              <Route path="/delivery/map" element={<PrivateRoute element={<DeliveryMapPage />} />} />
              <Route path="/delivery/tracking/:trackingNumber?" element={<DeliveryTrackingPage />} />
              <Route path="/delivery/settings" element={<PrivateRoute element={<DeliverySettingsPage />} />} />
              
              {/* Тестовые маршруты - только для разработки */}
              <Route 
                path="/test/payment" 
                element={<DevRoute element={<PaymentTestPage />} />} 
              />
              <Route 
                path="/test/order" 
                element={<DevRoute element={<OrderTestPage />} />} 
              />
              <Route 
                path="/test/payment-simulator" 
                element={<DevRoute element={<PaymentTestPage />} />} 
              />
              <Route 
                path="/test/order/:orderId" 
                element={<DevRoute element={<OrderDetailsPage />} />} 
              />
            </Routes>
          </div>
          <CompareFloatingButton />
        </Router>
      </CompareProvider>
    </DeliveryProvider>
  );
};

export default App;