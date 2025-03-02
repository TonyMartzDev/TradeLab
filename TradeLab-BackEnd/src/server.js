const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const tradeRoutes = require('./routes/tradeRoutes');
const { initializeDatabase } = require('./db/database');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Logging middleware

// Serve static files from the frontend directory
const frontendPath = path.join(__dirname, '../../TradeLab-FrontEnd');
app.use(express.static(frontendPath));

// Routes
app.use('/api/trades', tradeRoutes);

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString().split('T')[0] });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialize database and start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check available at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
