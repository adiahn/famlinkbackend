module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Serverless function is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    deployment: 'Vercel Serverless',
    method: req.method,
    url: req.url
  });
}; 