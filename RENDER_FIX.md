# 🔧 Render Deployment Fix

## 🚨 **Current Issue**
Render is trying to run `node api/index.js` instead of `npm start`

## ✅ **Solution Applied**

### **1. Updated package.json**
- Changed `start` script to: `"start": "node start.js"`
- Created `start.js` as entry point

### **2. Created render.yaml**
- Explicit configuration for Render
- Correct start command: `npm start`
- All environment variables included

### **3. Created start.js**
- Simple entry point that loads `src/server-render.js`
- Ensures Render uses the correct server

## 🔄 **Next Steps**

### **Option 1: Use render.yaml (Recommended)**
1. In Render dashboard, go to your service
2. Click "Settings" → "Environment"
3. Add environment variables manually:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://admin:admin123@cluster0.yk9yqnn.mongodb.net/famtree?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=b46c2a75dfd795e3d9bebc852cd0e2895019ca1cefe7d55e3ef12206b3d018e0e67f08ad3a88317f83f3960e874675844b1296ef5e23
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   CORS_ORIGIN=https://famlink.vercel.app,https://famlink-frontend.vercel.app
   ```
4. Click "Manual Deploy" → "Deploy latest commit"

### **Option 2: Manual Configuration**
1. In Render dashboard, go to your service
2. Click "Settings" → "Build & Deploy"
3. Set:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add environment variables as above
5. Click "Manual Deploy"

## 🧪 **Test After Deployment**
```bash
# Health check
GET https://your-app-name.onrender.com/health

# Expected response:
{
  "success": true,
  "message": "FamTree API is running on Render",
  "database": "MongoDB Atlas",
  "deployment": "Render"
}
```

## ✅ **Success Indicators**
- ✅ Server starts without "Application exited early"
- ✅ Health endpoint returns success
- ✅ Database connection established
- ✅ Login/Register endpoints work 