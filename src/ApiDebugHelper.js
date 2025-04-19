// Add this file to your project to help debug API issues

import { apiClient } from './ApiService';

// Function to test API connectivity and identify issues
export const testApiConnection = async () => {
  const results = {};
  
  try {
    // 1. Test basic connectivity with a GET request
    console.log('Testing API connectivity...');
    results.basic = { status: 'pending', message: 'Testing...' };
    
    try {
      const response = await apiClient.get('/api/Product');
      results.basic = { 
        status: 'success', 
        message: `Connected to API: Status ${response.status}`,
        data: { status: response.status, headers: response.headers } 
      };
    } catch (error) {
      results.basic = { 
        status: 'error', 
        message: 'Failed to connect to API',
        error: getErrorDetails(error)
      };
    }
    
    // 2. Test authentication
    console.log('Testing authentication...');
    results.auth = { status: 'pending', message: 'Testing...' };
    
    const token = localStorage.getItem('token');
    if (!token) {
      results.auth = { 
        status: 'warning', 
        message: 'No authentication token found. Login required.' 
      };
    } else {
      try {
        const response = await apiClient.get('/api/Cart');
        results.auth = { 
          status: 'success', 
          message: 'Authentication successful',
          data: { status: response.status }
        };
      } catch (error) {
        results.auth = { 
          status: 'error', 
          message: 'Authentication failed',
          error: getErrorDetails(error)
        };
      }
    }
    
    // 3. Test POST request (cart add)
    console.log('Testing cart add functionality...');
    results.post = { status: 'pending', message: 'Testing...' };
    
    if (token) {
      try {
        // Get random product ID to test with
        const productsResponse = await apiClient.get('/api/Product');
        if (productsResponse.data && productsResponse.data.length > 0) {
          const randomProduct = productsResponse.data[Math.floor(Math.random() * productsResponse.data.length)];
          
          // Try to add it to cart
          const response = await apiClient.post('/api/Cart', { 
            productId: randomProduct.id, 
            quantity: 1 
          });
          
          results.post = { 
            status: 'success', 
            message: 'Cart add functionality working correctly',
            data: { 
              status: response.status,
              product: randomProduct.id,
              response: response.data
            }
          };
        } else {
          results.post = { 
            status: 'warning', 
            message: 'No products available to test cart functionality' 
          };
        }
      } catch (error) {
        results.post = { 
          status: 'error', 
          message: 'Cart add functionality failed',
          error: getErrorDetails(error)
        };
      }
    } else {
      results.post = { 
        status: 'warning', 
        message: 'Authentication required to test cart functionality' 
      };
    }
    
    // 4. Test browser certificate trust
    console.log('Testing browser certificate trust...');
    results.cert = { status: 'pending', message: 'Testing...' };
    
    try {
      const response = await fetch('https://localhost:7209/api/Product', {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
      });
      
      if (response.ok) {
        results.cert = { 
          status: 'success', 
          message: 'Browser certificate trust is valid' 
        };
      } else {
        results.cert = { 
          status: 'warning', 
          message: `Certificate validation issue: ${response.status} ${response.statusText}` 
        };
      }
    } catch (error) {
      results.cert = { 
        status: 'error', 
        message: 'Certificate trust issue detected',
        error: error.message
      };
    }
    
    // Log overall results
    console.log('API Diagnostics Results:', results);
    
    // Determine overall status
    if (results.basic.status === 'error') {
      return {
        status: 'error',
        message: 'Cannot connect to API server. Check if the backend is running and accessible.',
        details: results
      };
    } else if (results.auth.status === 'error') {
      return {
        status: 'auth_error',
        message: 'Authentication issues detected. Try logging in again.',
        details: results
      };
    } else if (results.post.status === 'error') {
      return {
        status: 'functionality_error',
        message: 'API is connected but cart/wishlist functionality is not working.',
        details: results
      };
    } else if (results.cert.status === 'error' || results.cert.status === 'warning') {
      return {
        status: 'cert_error',
        message: 'Certificate trust issues detected. You may need to accept the development certificate.',
        details: results
      };
    } else {
      return {
        status: 'success',
        message: 'API connection is working correctly.',
        details: results
      };
    }
  } catch (error) {
    console.error('Error during API diagnostics:', error);
    return {
      status: 'error',
      message: 'Error occurred during API diagnostics',
      error: error.message,
      details: results
    };
  }
};

// Helper function to extract useful error details
function getErrorDetails(error) {
  const details = {};
  
  if (error.response) {
    // Server responded with a status code outside of 2xx range
    details.type = 'response_error';
    details.status = error.response.status;
    details.statusText = error.response.statusText;
    details.data = error.response.data;
    details.headers = error.response.headers;
  } else if (error.request) {
    // Request was made but no response received
    details.type = 'request_error';
    details.request = {
      readyState: error.request.readyState,
      status: error.request.status,
      statusText: error.request.statusText
    };
  } else {
    // Error in setting up the request
    details.type = 'setup_error';
    details.message = error.message;
  }
  
  details.config = error.config ? {
    url: error.config.url,
    method: error.config.method,
    headers: error.config.headers,
    withCredentials: error.config.withCredentials
  } : null;
  
  return details;
}

// Function to check browser's trust of the development certificate
export const checkDevelopmentCertificate = async () => {
  try {
    const response = await fetch('https://localhost:7209/api/Product');
    return {
      status: response.ok ? 'trusted' : 'untrusted',
      statusCode: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.message
    };
  }
};

// Add this to your console to run a test:
// import { testApiConnection } from './path/to/ApiDebugHelper';
// testApiConnection().then(result => console.log(result));