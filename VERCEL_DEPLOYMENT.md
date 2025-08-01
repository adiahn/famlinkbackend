# Vercel Deployment Guide for FamTree Backend

This guide will help you deploy the FamTree backend API to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Database**: Set up a MongoDB database (MongoDB Atlas recommended)
3. **Environment Variables**: Prepare your environment variables

## Step 1: Prepare Your MongoDB Database

### Option A: MongoDB Atlas (Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get your connection string
4. Add your IP address to the whitelist (or use 0.0.0.0/0 for all IPs)

### Option B: Local MongoDB
- Not recommended for production deployment

## Step 2: Set Up Environment Variables

You'll need to configure these environment variables in Vercel:

### Required Variables
```
NODE_ENV=production
MONGODB_URI_PROD=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

### Optional Variables
```
CORS_ORIGIN=https://your-frontend-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

## Step 3: Deploy to Vercel

### Method 1: Using Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   cd backend
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project or create new
   - Set environment variables when prompted

### Method 2: Using Vercel Dashboard

1. **Push your code to GitHub**
2. **Go to [vercel.com/dashboard](https://vercel.com/dashboard)**
3. **Click "New Project"**
4. **Import your GitHub repository**
5. **Configure the project**:
   - Framework Preset: `Node.js`
   - Root Directory: `backend`
   - Build Command: `npm run build`
   - Output Directory: `api`
   - Install Command: `npm install`

## Step 4: Configure Environment Variables

1. **Go to your project dashboard in Vercel**
2. **Navigate to Settings > Environment Variables**
3. **Add all required environment variables**
4. **Redeploy** if needed

## Step 5: Test Your Deployment

Your API will be available at:
```
https://your-project-name.vercel.app
```

### Test Endpoints:
- Health Check: `GET /health`
- API Base: `GET /api/`

## Important Notes

### Serverless Limitations
- **Cold Starts**: First request may be slower
- **Function Timeout**: 30 seconds maximum
- **Memory**: Limited to 1024MB
- **Database Connections**: Use connection pooling

### Database Considerations
- **MongoDB Atlas**: Recommended for production
- **Connection Pooling**: Configured for serverless
- **Connection Caching**: Implemented to reduce cold starts

### Environment Variables
- **Never commit secrets** to your repository
- **Use Vercel's environment variable system**
- **Test locally** with `.env` file

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MongoDB URI
   - Verify IP whitelist
   - Check network connectivity

2. **Function Timeout**
   - Optimize database queries
   - Reduce response payload size
   - Use connection pooling

3. **CORS Issues**
   - Set `CORS_ORIGIN` environment variable
   - Include your frontend domain

4. **Environment Variables Not Working**
   - Redeploy after adding variables
   - Check variable names (case-sensitive)
   - Verify in Vercel dashboard

### Debugging

1. **Check Vercel Function Logs**:
   - Go to your project dashboard
   - Click on "Functions" tab
   - View logs for specific functions

2. **Test Locally**:
   ```bash
   npm run dev
   ```

3. **Use Vercel CLI for debugging**:
   ```bash
   vercel logs
   ```

## Production Checklist

- [ ] MongoDB Atlas database configured
- [ ] Environment variables set in Vercel
- [ ] CORS origin configured
- [ ] JWT secret changed from default
- [ ] Rate limiting configured
- [ ] Health check endpoint working
- [ ] All API endpoints tested
- [ ] Error handling working
- [ ] Logging configured

## Support

If you encounter issues:
1. Check Vercel documentation
2. Review function logs
3. Test endpoints locally
4. Verify environment variables

Your FamTree backend is now ready for production deployment on Vercel! 🚀 