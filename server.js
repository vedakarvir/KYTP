const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// MIDDLEWARE
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// SERVE STATIC FILES (Frontend)
app.use(express.static('public'));

// ROUTES
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    message: 'GST Payment Platform API is running'
  });
});

app.get('/api', (req, res) => {
  res.json({ 
    message: 'GST Payment Platform API',
    version: '0.1.0',
    endpoints: {
      health: '/health'
    }
  });
});

// ERROR HANDLING
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date()
  });
});

// START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 GST Payment Platform running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}/`);
  console.log(`🔍 Health: http://localhost:${PORT}/health`);
});
