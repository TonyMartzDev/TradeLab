// API configuration
const API_CONFIG = {
  baseURL: 'http://localhost:3000/api', // Change this to your actual API base URL
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Create axios instance with default config
const api = axios.create(API_CONFIG);

// Add request interceptor for handling tokens, etc.
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here when you implement authentication
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for handling errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle different error cases
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.data);
      throw new Error(error.response.data.message || 'An error occurred');
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.request);
      throw new Error('Network error. Please check your connection.');
    } else {
      // Error in request configuration
      console.error('Request Error:', error.message);
      throw new Error('Request configuration error.');
    }
  }
);

// Trade API endpoints
const tradeAPI = {
  // Get all trades
  getAllTrades: () => api.get('/trades'),
  
  // Get a specific trade
  getTrade: (id) => api.get(`/trades/${id}`),
  
  // Create a new trade
  createTrade: (tradeData) => api.post('/trades', tradeData),
  
  // Update a trade
  updateTrade: (id, tradeData) => api.put(`/trades/${id}`, tradeData),
  
  // Delete a trade
  deleteTrade: (id) => api.delete(`/trades/${id}`),
  
  // Get recent trades (last 10)
  getRecentTrades: () => api.get('/trades/recent')
};

// Export the API objects
window.tradeAPI = tradeAPI;
