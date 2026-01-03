# AI Health Analyzer - Vercel & Render Deployment Guide

This guide provides step-by-step instructions for deploying the AI Health Analyzer application with the client on Vercel and the server on Render.

## Prerequisites

Before starting the deployment, ensure you have:

1. **GitHub Repository**: Your code should be pushed to a GitHub repository
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Render Account**: Sign up at [render.com](https://render.com)
4. **MongoDB Atlas Account**: For the production database
5. **Cloudinary Account**: For file storage
6. **Google AI Studio Account**: For Gemini API access

## Part 1: Backend Deployment on Render

### Step 1: Prepare Environment Variables

First, gather all the required environment variables:

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

### Step 2: Deploy to Render

1. **Connect Repository**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository containing your AI Health Analyzer code

2. **Configure Service**:
   - **Name**: `ai-health-analyzer-api`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your production branch)
   - **Root Directory**: `server`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`

3. **Set Environment Variables**:
   In the Render dashboard, add all the environment variables listed above.

4. **Deploy**:
   - Click "Create Web Service"
   - Wait for the deployment to complete (usually 5-10 minutes)
   - Note your Render URL: `https://your-service-name.onrender.com`

### Step 3: Verify Backend Deployment

Test your backend deployment:

```bash
# Health check
curl https://your-service-name.onrender.com/api/health

# Should return JSON with status: "OK"
```

## Part 2: Frontend Deployment on Vercel

### Step 1: Update Environment Variables

Update the client environment variables with your Render backend URL:

1. **Update `client/.env.production`**:
```env
VITE_API_URL=https://your-service-name.onrender.com/api
VITE_APP_NAME=AI Health Analyzer
VITE_APP_VERSION=1.0.0
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_CACHE_ENABLED=true
```

### Step 2: Deploy to Vercel

1. **Connect Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm ci`

3. **Set Environment Variables**:
   In Vercel dashboard → Settings → Environment Variables:
   ```
   VITE_API_URL = https://your-service-name.onrender.com/api
   VITE_APP_NAME = AI Health Analyzer
   VITE_APP_VERSION = 1.0.0
   ```

4. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete
   - Note your Vercel URL: `https://your-app-name.vercel.app`

### Step 3: Update Backend CORS

Update your backend's `CLIENT_URL` environment variable in Render:

```env
CLIENT_URL=https://your-app-name.vercel.app
```

Redeploy the backend service after updating this variable.

## Part 3: Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster (free tier is sufficient for testing)
3. Create a database user
4. Whitelist IP addresses (0.0.0.0/0 for Render, or specific IPs)
5. Get your connection string

### Step 2: Update Database Connection

Update the `MONGODB_URI` in your Render environment variables:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-health-analyzer?retryWrites=true&w=majority
```

## Part 4: External Services Setup

### Cloudinary Setup

1. **Create Account**: Sign up at [cloudinary.com](https://cloudinary.com)
2. **Get Credentials**: From your dashboard, copy:
   - Cloud Name
   - API Key
   - API Secret
3. **Update Environment Variables** in Render

### Gemini AI Setup

1. **Get API Key**: Visit [Google AI Studio](https://aistudio.google.com/)
2. **Create API Key**: Generate a new API key
3. **Update Environment Variable**: Add `GEMINI_API_KEY` in Render

## Part 5: Testing the Deployment

### Automated Testing

Run the integration tests:

```bash
# Update the URLs in integration-tests.js
node integration-tests.js
```

### Manual Testing

1. **Frontend Access**: Visit your Vercel URL
2. **User Registration**: Create a new account
3. **File Upload**: Upload a sample health report
4. **AI Analysis**: Verify the analysis works
5. **Report Viewing**: Check if reports display correctly

### Health Checks

```bash
# Backend health
curl https://your-service-name.onrender.com/api/health

# Frontend (should return HTML)
curl https://your-app-name.vercel.app
```

## Part 6: Domain Configuration (Optional)

### Custom Domain for Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

### Custom Domain for Render

1. Go to Render Dashboard → Your Service → Settings
2. Add custom domain
3. Configure DNS records

## Part 7: Monitoring and Maintenance

### Monitoring

1. **Render Monitoring**: Built-in metrics and logs
2. **Vercel Analytics**: Enable in project settings
3. **Error Tracking**: Consider adding Sentry

### Logs

- **Render Logs**: Available in dashboard
- **Vercel Logs**: Available in dashboard and CLI

### Updates

1. **Automatic Deployments**: Both platforms deploy on git push
2. **Environment Variables**: Update through dashboards
3. **Dependencies**: Regular security updates

## Troubleshooting

### Common Issues

#### 1. CORS Errors
- Ensure `CLIENT_URL` in Render matches your Vercel URL exactly
- Check for trailing slashes

#### 2. Environment Variables Not Loading
- Verify all required variables are set in both platforms
- Check for typos in variable names
- Ensure production environment is selected

#### 3. Build Failures
- Check build logs in platform dashboards
- Verify Node.js version compatibility
- Ensure all dependencies are listed in package.json

#### 4. Database Connection Issues
- Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Check connection string format
- Ensure database user has proper permissions

#### 5. File Upload Issues
- Verify Cloudinary credentials
- Check file size limits
- Ensure proper CORS configuration

### Debug Commands

```bash
# Check Render service logs
curl https://your-service-name.onrender.com/api/health

# Test API endpoints
curl -X POST https://your-service-name.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'
```

## Security Checklist

- [ ] JWT_SECRET is strong and unique
- [ ] Database credentials are secure
- [ ] API keys are not exposed in client code
- [ ] HTTPS is enabled (automatic on both platforms)
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Input validation is implemented

## Performance Optimization

### Backend (Render)
- Use Render's built-in caching
- Enable compression
- Optimize database queries
- Monitor memory usage

### Frontend (Vercel)
- Enable Vercel's Edge Network
- Optimize bundle size
- Use lazy loading
- Enable caching headers

## Cost Optimization

### Render
- Start with Starter plan ($7/month)
- Monitor usage and scale as needed
- Use sleep mode for development

### Vercel
- Hobby plan is free for personal projects
- Pro plan ($20/month) for commercial use
- Monitor bandwidth usage

## Backup Strategy

1. **Database**: MongoDB Atlas automatic backups
2. **Code**: GitHub repository
3. **Environment Variables**: Document in secure location
4. **File Storage**: Cloudinary automatic backups

## Support and Resources

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **MongoDB Atlas**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **Cloudinary**: [cloudinary.com/documentation](https://cloudinary.com/documentation)

---

## Quick Deployment Checklist

### Before Deployment
- [ ] Code is pushed to GitHub
- [ ] Environment variables are prepared
- [ ] External services (MongoDB, Cloudinary, Gemini) are set up
- [ ] Build scripts are tested locally

### Backend (Render)
- [ ] Service created and configured
- [ ] Environment variables set
- [ ] Build and start commands configured
- [ ] Deployment successful
- [ ] Health check passes

### Frontend (Vercel)
- [ ] Project imported and configured
- [ ] Environment variables set
- [ ] Build configuration correct
- [ ] Deployment successful
- [ ] Site accessible

### Post-Deployment
- [ ] CORS updated with frontend URL
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Monitoring set up
- [ ] Documentation updated

This deployment should result in a fully functional AI Health Analyzer application with no errors!