const express = require('express');

const app = express();
const PORT = 5000;

app.get('/', (req, res) => {
  res.json({ message: 'Server is working!' });
});

app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Health check passed',
    timestamp: new Date().toISOString()
  });
});

console.log('Starting server...');

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

console.log('Server setup complete'); 