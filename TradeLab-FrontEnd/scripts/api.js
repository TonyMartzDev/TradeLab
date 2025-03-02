// API configuration
const API_CONFIG = {
  baseURL: '/api', // Using relative path since frontend is served from the same origin
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
};

// Create axios instance with default config
const api = axios.create(API_CONFIG);

// Add request interceptor for handling tokens, etc.
const globalRequestInterceptor = api.interceptors.request.use(
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
const globalResponseInterceptor = api.interceptors.response.use(
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
  getAllTrades: () => api.get('/trades').then(res => res.data),
  
  // Get a specific trade
  getTrade: (id) => api.get(`/trades/${id}`).then(res => res.data),
  
  // Create a new trade
  createTrade: (tradeData) => api.post('/trades', tradeData).then(res => res.data),
  
  // Update a trade
  updateTrade: (id, tradeData) => api.put(`/trades/${id}`, tradeData).then(res => res.data),
  
  // Delete a trade
  deleteTrade: (id) => api.delete(`/trades/${id}`),
  
  // Get recent trades (last 10)
  getRecentTrades: () => api.get('/trades/recent').then(res => res.data)
};

// Export the API objects
window.tradeAPI = tradeAPI;
