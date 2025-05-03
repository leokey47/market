import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompare } from './CompareContext';
import './CompareFloatingButton.css';

const CompareFloatingButton = () => {
  const navigate = useNavigate();
  const { getCompareCount } = useCompare();
  
  const compareCount = getCompareCount();
  
  // Если нет товаров в сравнении, не показываем кнопку
  if (compareCount === 0) {
    return null;
  }
  
  return (
    <div className="compare-floating-container">
      <button 
        className="compare-floating-button" 
        onClick={() => navigate('/compare')}
        aria-label="Перейти к сравнению товаров"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 16L10 12L6 8M14 8L18 12L14 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="compare-floating-counter">{compareCount}</span>
        <span className="compare-floating-text">Сравнить</span>
      </button>
    </div>
  );
};

export default CompareFloatingButton;