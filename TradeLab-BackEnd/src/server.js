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

// API routes first
app.use('/api/trades', tradeRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString().split('T')[0] });
});

// Serve static files from the frontend directory
const frontendPath = path.join(__dirname, '../../TradeLab-FrontEnd');
app.use(express.static(frontendPath, {
  // Don't fall back to index.html for missing files
  fallthrough: true,
  // Return proper 404 for missing files
  redirect: false
}));

// Handle root route explicitly
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'pages/index.html'));
});

// 404 handler - must come after all other routes
app.use((req, res) => {
  // Check if the request was for an API endpoint
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      message: 'API endpoint not found',
      path: req.path
    });
  }

  // For non-API requests, send a proper 404 response
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>404 - Not Found</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 2rem;
            text-align: center;
          }
          h1 { color: #2c3e50; }
          .error-code { 
            font-size: 5rem; 
            color: #e74c3c;
            margin: 0;
          }
          .back-link {
            color: #3498db;
            text-decoration: none;
            margin-top: 2rem;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <p class="error-code">404</p>
        <h1>Page Not Found</h1>
        <p>The requested resource could not be found: ${req.path}</p>
        <a href="/" class="back-link">Return to Homepage</a>
      </body>
    </html>
  `);
});

// Error handling middleware - must be last
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
