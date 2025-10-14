// API Configuration for both development and production
const API_CONFIG = {
  // Base URL - automatically detects environment
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  
  // API endpoints
  ENDPOINTS: {
    TIRE_REQUESTS: '/api/tire-requests',
    TIRE_ORDERS: '/api/tire-orders',
    AUTH: '/api/auth',
    EMPLOYEES: '/api/employees',
    UPLOADS: '/uploads'
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  // In development, use full URL to localhost backend
  if (process.env.NODE_ENV === 'development') {
    return `${API_CONFIG.BASE_URL}${endpoint}`;
  }
  
  // In production, use relative path (handled by Vercel proxy)
  return endpoint;
};

// Export configuration
export default API_CONFIG;
export const { BASE_URL, ENDPOINTS } = API_CONFIG;