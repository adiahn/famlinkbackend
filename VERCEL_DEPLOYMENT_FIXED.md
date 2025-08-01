# Vercel Deployment Fix Guide

## 🚨 Issues Fixed

1. **Serverless Function Crashes** - Removed persistent server startup
2. **Database Connection Timeouts** - Optimized for serverless environment
3. **Module Loading Errors** - Added safe module imports with fallbacks
4. **Function Timeout** - Added proper timeout configuration

## 🔧 Environment Variables for Vercel

Set these in your Vercel Dashboard → Settings → Environment Variables:

```env
# Server Configuration
NODE_ENV=production
PORT=3000

# MongoDB Configuration (Use your Atlas connection)
MONGODB_URI=mongodb+srv://admin:admin123@cluster0.yk9yqnn.mongodb.net/famtree?retryWrites=true&w=majority&appName=Cluster0
MONGODB_URI_PROD=mongodb+srv://admin:admin123@cluster0.yk9yqnn.mongodb.net/famtree?retryWrites=true&w=majority&appName=Cluster0

# JWT Configuration
JWT_SECRET=b46c2a75dfd795e3d9bebc852cd0e2895019ca1cefe7d55e3ef12206b3d018e0e67f08ad3a88317f83f3960e874675844b1296ef5e23
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.vercel.app,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_SALT_ROUNDS=12
SESSION_SECRET=436a327ca2566e10a6e1ce25836d54268c14c73bb00d2380900376f62a56a11a

# API Configuration
API_VERSION=v1
API_PREFIX=/api

# Logging
LOG_LEVEL=info
```

## 🚀 Deployment Steps

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy
```bash
cd backend
vercel --prod
```

### 4. Set Environment Variables
- Go to Vercel Dashboard
- Select your project
- Go to Settings → Environment Variables
- Add all the variables above

### 5. Redeploy
```bash
vercel --prod
```

## 🧪 Testing

After deployment, test these endpoints:

1. **Health Check**: `https://your-project.vercel.app/health`
2. **Test Function**: `https://your-project.vercel.app/test`
3. **API Info**: `https://your-project.vercel.app/api`

## 🔍 Troubleshooting

### If still getting 500 errors:

1. **Check Vercel Logs**:
   - Go to Vercel Dashboard
   - Select your project
   - Go to Functions tab
   - Check the logs for errors

2. **Test Database Connection**:
   - Make sure MongoDB Atlas is accessible
   - Check if IP whitelist includes Vercel's IPs (0.0.0.0/0)

3. **Check Environment Variables**:
   - Verify all variables are set in Vercel Dashboard
   - Make sure there are no typos

4. **Test Locally First**:
   ```bash
   npm run working
   ```

## 📋 Key Changes Made

1. **api/index.js**: Complete rewrite for serverless
2. **vercel.json**: Added function timeout and proper routing
3. **database.js**: Optimized for serverless with shorter timeouts
4. **Safe Module Loading**: Added try-catch for all imports

## ✅ Expected Results

After fixing:
- ✅ No more 500 errors
- ✅ Health endpoint returns 200
- ✅ Database connects successfully
- ✅ All API endpoints work
- ✅ Proper error handling

## 🔗 Your API URLs

After successful deployment:
- **Base URL**: `https://your-project.vercel.app`
- **Health**: `https://your-project.vercel.app/health`
- **API**: `https://your-project.vercel.app/api`
- **Auth**: `https://your-project.vercel.app/api/auth/register`

## 🆘 Still Having Issues?

1. Check Vercel function logs
2. Verify MongoDB Atlas connection
3. Test with a simple endpoint first
4. Make sure all dependencies are in package.json 