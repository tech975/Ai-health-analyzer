# 🚀 AI Health Analyzer - Complete Deployment Guide

This guide provides everything you need to deploy the AI Health Analyzer application to Vercel (frontend) and Render (backend) with zero errors.

## 📋 Quick Start Checklist

- [ ] Code is pushed to GitHub
- [ ] External services are set up (MongoDB Atlas, Cloudinary, Gemini AI)
- [ ] Environment variables are prepared
- [ ] Dependencies are installed and builds are tested
- [ ] Deployment platforms are configured

## 🛠️ Pre-Deployment Setup

### 1. Prepare Your Environment

```bash
# Run the preparation script
node prepare-deployment.js

# Generate environment templates
node setup-production-env.js setup

# Validate your configuration
node setup-production-env.js validate

# Run deployment checklist
node deployment-checklist.js
```

### 2. Set Up External Services

#### MongoDB Atlas (Database)
1. Create account at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster (free tier available)
3. Create database user with read/write permissions
4. Whitelist IP addresses (0.0.0.0/0 for cloud deployment)
5. Get connection string

#### Cloudinary (File Storage)
1. Create account at [Cloudinary](https://cloudinary.com)
2. Get your credentials from the dashboard:
   - Cloud Name
   - API Key
   - API Secret

#### Google Gemini AI (AI Analysis)
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Create a new API key
3. Note the key for environment variables

## 🌐 Backend Deployment (Render)

### Step 1: Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:

```
Name: ai-health-analyzer-api
Environment: Node
Region: (Choose closest to your users)
Branch: main
Root Directory: server
Build Command: npm ci && npm run build
Start Command: npm start
```

### Step 2: Environment Variables

Add these environment variables in Render:

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-health-analyzer?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters-long
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
GEMINI_API_KEY=your-gemini-api-key
CLIENT_URL=https://your-app-name.vercel.app
BCRYPT_ROUNDS=12
```

### Step 3: Deploy

1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Note your Render URL: `https://your-service-name.onrender.com`

## 🎨 Frontend Deployment (Vercel)

### Step 1: Create Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:

```
Framework Preset: Vite
Root Directory: client
Build Command: npm run build
Output Directory: dist
Install Command: npm ci
```

### Step 2: Environment Variables

Add these environment variables in Vercel:

```env
VITE_API_URL=https://your-service-name.onrender.com/api
VITE_APP_NAME=AI Health Analyzer
VITE_APP_VERSION=1.0.0
```

### Step 3: Deploy

1. Click "Deploy"
2. Wait for deployment (2-5 minutes)
3. Note your Vercel URL: `https://your-app-name.vercel.app`

## 🔄 Post-Deployment Configuration

### Update CORS Settings

1. Go back to your Render dashboard
2. Update the `CLIENT_URL` environment variable with your actual Vercel URL
3. Redeploy the backend service

### Verify Deployment

```bash
# Run verification script
node verify-deployment.js https://your-service-name.onrender.com/api https://your-app-name.vercel.app
```

## 🧪 Testing Your Deployment

### Automated Testing

```bash
# Health check
curl https://your-service-name.onrender.com/api/health

# Should return: {"status":"OK","message":"AI Health Analyzer API is running",...}
```

### Manual Testing

1. Visit your Vercel URL
2. Register a new account
3. Upload a sample health report (PDF)
4. Verify AI analysis works
5. Check report viewing functionality

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Build Failures

**Server Build Fails:**
```bash
# Check TypeScript errors
cd server
npx tsc --noEmit

# Fix any TypeScript errors and redeploy
```

**Client Build Fails:**
```bash
# Check for missing dependencies
cd client
npm install
npm run build
```

#### 2. Environment Variable Issues

```bash
# Validate environment variables
node setup-production-env.js validate

# Check for typos in variable names
# Ensure all required variables are set
```

#### 3. CORS Errors

- Verify `CLIENT_URL` in Render matches your Vercel URL exactly
- Check for trailing slashes
- Ensure both URLs use HTTPS

#### 4. Database Connection Issues

- Verify MongoDB Atlas connection string
- Check IP whitelist (should include 0.0.0.0/0)
- Ensure database user has proper permissions

#### 5. File Upload Issues

- Verify Cloudinary credentials
- Check file size limits (10MB default)
- Ensure proper file format (PDF)

### Debug Commands

```bash
# Check service logs in Render dashboard
# Check function logs in Vercel dashboard

# Test individual endpoints
curl -X POST https://your-service-name.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'
```

## 📊 Monitoring and Maintenance

### Built-in Monitoring

- **Render**: Automatic monitoring and logs
- **Vercel**: Analytics and performance metrics
- **Application**: Built-in health checks and performance monitoring

### Regular Maintenance

1. **Weekly**: Check application logs for errors
2. **Monthly**: Update dependencies for security patches
3. **Quarterly**: Review performance metrics and optimize

## 🔒 Security Best Practices

- [ ] JWT secret is strong and unique
- [ ] Database credentials are secure
- [ ] API keys are not exposed in client code
- [ ] HTTPS is enabled (automatic on both platforms)
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Input validation is implemented

## 💰 Cost Optimization

### Render (Backend)
- **Starter Plan**: $7/month (recommended for production)
- **Free Plan**: Available but with limitations (sleeps after inactivity)

### Vercel (Frontend)
- **Hobby Plan**: Free for personal projects
- **Pro Plan**: $20/month for commercial use

### MongoDB Atlas
- **Free Tier**: 512MB storage (sufficient for testing)
- **Shared Clusters**: Starting at $9/month

### Cloudinary
- **Free Tier**: 25GB storage, 25GB bandwidth
- **Paid Plans**: Starting at $89/month

## 📞 Support

If you encounter issues:

1. Check this documentation
2. Review application logs in platform dashboards
3. Run the verification script
4. Check GitHub issues
5. Contact the development team

## 🎯 Success Criteria

Your deployment is successful when:

- [ ] Health check returns status "OK"
- [ ] Frontend loads without errors
- [ ] User registration works
- [ ] File upload functions correctly
- [ ] AI analysis completes successfully
- [ ] Reports display properly
- [ ] All verification tests pass

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Google AI Studio](https://aistudio.google.com/)

---

## 🚀 Quick Deployment Commands

```bash
# 1. Prepare deployment
node prepare-deployment.js

# 2. Set up environment
node setup-production-env.js setup

# 3. Validate configuration
node deployment-checklist.js

# 4. Deploy to platforms (manual via dashboards)

# 5. Verify deployment
node verify-deployment.js https://your-api.onrender.com/api https://your-app.vercel.app
```

**🎉 That's it! Your AI Health Analyzer should now be running error-free in production!**