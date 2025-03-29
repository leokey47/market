import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ProductsPage from './ProductsPage';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Главная страница перенаправляет на страницу товаров */}
        <Route path="/" element={<ProductsPage />} />
      </Routes>
    </Router>
  );
};

export default App;
