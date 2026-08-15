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

// ROUTES
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    message: 'GST Payment Platform API is running'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'GST Payment Platform',
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
  console.log(`🚀 GST Payment API running on port ${PORT}`);
});