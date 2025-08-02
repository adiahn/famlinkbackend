# 🚀 FamTree Backend - Render Deployment Guide

## 📋 **Prerequisites**
- Render account (free tier available)
- GitHub repository connected
- MongoDB Atlas database

## 🔧 **Deployment Steps**

### **Step 1: Connect to Render**
1. Go to [render.com](https://render.com)
2. Sign up/Login with GitHub
3. Click "New +" → "Web Service"

### **Step 2: Connect Repository**
1. Connect your GitHub repository
2. Select the repository: `FamTree`
3. Choose the branch: `main`

### **Step 3: Configure Web Service**
```
Name: famtree-backend
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: npm start
```

### **Step 4: Environment Variables**
Add these in Render dashboard:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://admin:admin123@cluster0.yk9yqnn.mongodb.net/famtree?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=b46c2a75dfd795e3d9bebc852cd0e2895019ca1cefe7d55e3ef12206b3d018e0e67f08ad3a88317f83f3960e874675844b1296ef5e23
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://famlink.vercel.app,https://famlink-frontend.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### **Step 5: Deploy**
1. Click "Create Web Service"
2. Wait for deployment (2-3 minutes)
3. Your API will be available at: `https://your-app-name.onrender.com`

## 🧪 **Testing Your Deployment**

### **Health Check**
```bash
GET https://your-app-name.onrender.com/health
```

### **Test Endpoint**
```bash
GET https://your-app-name.onrender.com/test
```

### **Register User**
```bash
POST https://your-app-name.onrender.com/api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "password": "password123",
  "confirmPassword": "password123",
  "email": "john@example.com",
  "gender": "male"
}
```

### **Login**
```bash
POST https://your-app-name.onrender.com/api/auth/signin
Content-Type: application/json

{
  "phone": "+1234567890",
  "password": "password123"
}
```

## 🔗 **Update Frontend**
Update your frontend API base URL to:
```javascript
const API_BASE_URL = 'https://your-app-name.onrender.com';
```

## 📊 **Monitoring**
- **Logs**: Available in Render dashboard
- **Health**: `/health` endpoint
- **Metrics**: Render provides built-in monitoring

## 🚨 **Troubleshooting**

### **Common Issues:**
1. **Build Fails**: Check `package.json` has correct `start` script
2. **Database Connection**: Verify `MONGODB_URI` is correct
3. **Port Issues**: Render uses `PORT` environment variable
4. **CORS Errors**: Update `CORS_ORIGIN` with your frontend URL

### **Logs Location:**
- Render Dashboard → Your Service → Logs
- Application logs: `/logs/combined.log`
- Error logs: `/logs/error.log`

## ✅ **Success Indicators**
- Health endpoint returns: `"database": "MongoDB Atlas"`
- Login/Register endpoints work
- No CORS errors in browser console
- Logs show successful database connection

## 🎉 **Benefits of Render**
- ✅ Traditional server (no serverless limitations)
- ✅ Persistent database connections
- ✅ Full file system access
- ✅ Longer request timeouts
- ✅ Better for APIs
- ✅ Free tier available 