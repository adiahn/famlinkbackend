const express = require('express');
const app = express();

console.log('🚀 Simple test server starting...');

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Simple test server is working!',
    timestamp: new Date().toISOString()
  });
});

app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test endpoint working!',
    deployment: 'Render Ready'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Simple test server running on port ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🧪 Test: http://localhost:${PORT}/test`);
});

module.exports = app; 