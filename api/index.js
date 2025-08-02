module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Get the path
  const path = req.url;
  
  // Health check
  if (path === '/health' || path === '/health/') {
    res.status(200).json({
      success: true,
      message: 'FamTree API is running (Vercel Serverless)',
      timestamp: new Date().toISOString(),
      environment: 'production',
      version: '1.0.0'
    });
    return;
  }
  
  // Test endpoint
  if (path === '/test' || path === '/test/') {
    res.status(200).json({
      success: true,
      message: 'Serverless function is working!',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    });
    return;
  }
  
  // API info
  if (path === '/api' || path === '/api/') {
    res.status(200).json({
      success: true,
      message: 'FamTree API',
      version: '1.0.0',
      deployment: 'Vercel Serverless',
      status: 'Working',
      endpoints: {
        health: 'GET /health',
        test: 'GET /test',
        api: 'GET /api'
      }
    });
    return;
  }
  
  // Auth endpoints
  if (path === '/api/auth/register' && req.method === 'POST') {
    res.status(200).json({
      success: true,
      message: 'Registration endpoint reached (database not connected)',
      timestamp: new Date().toISOString(),
      data: req.body
    });
    return;
  }
  
  if (path === '/api/auth/signin' && req.method === 'POST') {
    res.status(200).json({
      success: true,
      message: 'Signin endpoint reached (database not connected)',
      timestamp: new Date().toISOString(),
      data: req.body
    });
    return;
  }
  
  // Default response for root
  if (path === '/' || path === '') {
    res.status(200).json({
      success: true,
      message: 'FamTree API Serverless Function',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: 'GET /health',
        test: 'GET /test',
        api: 'GET /api',
        register: 'POST /api/auth/register',
        signin: 'POST /api/auth/signin'
      }
    });
    return;
  }
  
  // 404 for everything else
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      method: req.method,
      url: req.url
    }
  });
}; 