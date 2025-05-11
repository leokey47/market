import React from 'react';
import { Card } from 'react-bootstrap';
import './CartSummary.css';

const CartSummary = ({ cartItems, totalAmount, deliveryCost }) => {
  // Рассчитываем финальную стоимость с учетом доставки
  const finalTotal = totalAmount + (parseFloat(deliveryCost) || 0);

  return (
    <Card className="cart-summary shadow-sm sticky-top">
      <Card.Header className="bg-white">
        <h5 className="mb-0">Сводка заказа</h5>
      </Card.Header>
      <Card.Body>
        <div className="summary-detail d-flex justify-content-between mb-2">
          <span>Товаров ({cartItems.length}):</span>
          <span className="text-end">{totalAmount.toLocaleString()} $</span>
        </div>
        
        <div className="summary-detail d-flex justify-content-between mb-2">
          <span>Стоимость доставки:</span>
          <span className="text-end">
            {deliveryCost > 0 ? `${deliveryCost} грн` : 'Не указана'}
          </span>
        </div>
        
        <hr />
        
        <div className="summary-total d-flex justify-content-between">
          <span>Итого к оплате:</span>
          <span className="total-price">{totalAmount.toLocaleString()} $ + {deliveryCost > 0 ? `${deliveryCost} грн` : '0 грн'}</span>
        </div>
      </Card.Body>
    </Card>
  );
};

export default CartSummary;