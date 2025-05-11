import React, { useState } from 'react';
import { Button, ProgressBar, Alert, Card } from 'react-bootstrap';
import { PaymentService } from './ApiService';

const PaymentSimulator = ({ orderId, onComplete }) => {
  const [simulating, setSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('waiting');
  const [error, setError] = useState(null);

  const simulatePayment = async () => {
    setSimulating(true);
    setError(null);
    
    // Симуляция процесса оплаты
    const stages = [
      { status: 'waiting', progress: 25, delay: 1000, message: 'Initiating payment...' },
      { status: 'confirming', progress: 50, delay: 2000, message: 'Confirming payment...' },
      { status: 'confirmed', progress: 75, delay: 1000, message: 'Payment confirmed!' },
      { status: 'completed', progress: 100, delay: 500, message: 'Payment completed!' }
    ];

    try {
      for (const stage of stages) {
        setProgress(stage.progress);
        setStatus(stage.status);
        
        // Обновляем статус на сервере
        await PaymentService.testUpdateOrderStatus(orderId, stage.status);
        
        // Ждем перед следующим этапом
        await new Promise(resolve => setTimeout(resolve, stage.delay));
      }

      // Финальное обновление статуса
      await PaymentService.testUpdateOrderStatus(orderId, 'Completed');
      
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('Error during payment simulation:', err);
      setError('Failed to simulate payment: ' + err.message);
    } finally {
      setSimulating(false);
    }
  };

  const quickStatusUpdate = async (newStatus) => {
    try {
      setError(null);
      await PaymentService.testUpdateOrderStatus(orderId, newStatus);
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status: ' + err.message);
    }
  };

  return (
    <Card className="mt-4">
      <Card.Header className="bg-warning text-dark">
        <h5 className="mb-0">🧪 Payment Simulator (Dev Only)</h5>
      </Card.Header>
      <Card.Body>
        <p>Current Status: <strong>{status}</strong></p>
        
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        <div className="mb-3">
          <ProgressBar 
            now={progress} 
            label={`${progress}%`} 
            animated={simulating}
            variant={progress === 100 ? 'success' : 'primary'}
          />
        </div>
        
        <div className="d-grid gap-2">
          <Button 
            onClick={simulatePayment}
            disabled={simulating}
            variant="primary"
            size="lg"
          >
            {simulating ? 'Simulating Payment...' : 'Start Payment Simulation'}
          </Button>
          
          <hr />
          
          <h6>Quick Status Update:</h6>
          <div className="d-flex gap-2 flex-wrap">
            <Button 
              variant="outline-warning" 
              size="sm"
              onClick={() => quickStatusUpdate('Waiting')}
              disabled={simulating}
            >
              Waiting
            </Button>
            <Button 
              variant="outline-info" 
              size="sm"
              onClick={() => quickStatusUpdate('Confirming')}
              disabled={simulating}
            >
              Confirming
            </Button>
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => quickStatusUpdate('Confirmed')}
              disabled={simulating}
            >
              Confirmed
            </Button>
            <Button 
              variant="outline-success" 
              size="sm"
              onClick={() => quickStatusUpdate('Completed')}
              disabled={simulating}
            >
              Completed
            </Button>
            <Button 
              variant="outline-danger" 
              size="sm"
              onClick={() => quickStatusUpdate('Failed')}
              disabled={simulating}
            >
              Failed
            </Button>
          </div>
        </div>
        
        {progress === 100 && (
          <Alert variant="success" className="mt-3">
            Payment successfully simulated! Order is now marked as completed.
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

export default PaymentSimulator;