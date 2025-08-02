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
  
  const path = req.url;
  
  // Health check
  if (path === '/health' || path === '/health/') {
    res.status(200).json({
      success: true,
      message: 'FamTree API is running (Fallback Mode)',
      timestamp: new Date().toISOString(),
      environment: 'production',
      version: '1.0.0'
    });
    return;
  }
  
  // Auth endpoints (mock responses)
  if (path === '/api/auth/signin' && req.method === 'POST') {
    res.status(200).json({
      success: true,
      message: 'Login successful (Fallback Mode)',
      data: {
        user: {
          id: 'fallback-user-id',
          firstName: 'Muhammad',
          lastName: 'Roubel',
          phone: req.body.phone || '+1234567890',
          email: 'muhammadroubel@gmail.com'
        },
        token: 'fallback-jwt-token',
        refreshToken: 'fallback-refresh-token'
      }
    });
    return;
  }
  
  if (path === '/api/auth/register' && req.method === 'POST') {
    res.status(201).json({
      success: true,
      message: 'Registration successful (Fallback Mode)',
      data: {
        userId: 'fallback-user-id',
        verificationRequired: false
      }
    });
    return;
  }
  
  // Default response
  res.status(200).json({
    success: true,
    message: 'FamTree API Fallback Mode',
    timestamp: new Date().toISOString(),
    note: 'This is a fallback response. Check server logs for issues.'
  });
}; 