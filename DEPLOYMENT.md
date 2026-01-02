# AI Health Analyzer - Deployment Guide

This guide covers the deployment process for the AI Health Analyzer application in both development and production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Development Deployment](#development-deployment)
- [Production Deployment](#production-deployment)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Performance Monitoring](#performance-monitoring)

## Prerequisites

### System Requirements

- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher
- **MongoDB**: Version 5.0 or higher (for local development)
- **Docker**: Version 20.10 or higher (for production)
- **Docker Compose**: Version 2.0 or higher (for production)

### External Services

- **Cloudinary Account**: For file storage
- **Google Gemini API**: For AI analysis
- **MongoDB Atlas**: For production database (recommended)

## Environment Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-health-analyzer
```

### 2. Environment Variables

#### Server Environment Variables

Create `server/.env` for development:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-health-analyzer
JWT_SECRET=your-jwt-secret-key-here
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
GEMINI_API_KEY=your-gemini-api-key
CLIENT_URL=http://localhost:3000
```

Create `server/.env.production` for production:

```env
NODE_ENV=production
PORT=5000
API_URL=https://your-api-domain.com
CLIENT_URL=https://your-client-domain.com
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-health-analyzer
JWT_SECRET=your-super-secure-jwt-secret-key-here-minimum-32-characters
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
GEMINI_API_KEY=your-gemini-api-key
BCRYPT_ROUNDS=12
```

#### Client Environment Variables

Create `client/.env` for development:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=AI Health Analyzer
VITE_APP_VERSION=1.0.0
```

Create `client/.env.production` for production:

```env
NODE_ENV=production
VITE_API_URL=https://your-api-domain.com/api
VITE_APP_NAME=AI Health Analyzer
VITE_APP_VERSION=1.0.0
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_CACHE_ENABLED=true
VITE_ENABLE_HTTPS=true
```

### 3. Docker Environment Variables

Create `.env` in the root directory for Docker Compose:

```env
MONGO_ROOT_PASSWORD=your-mongo-root-password
JWT_SECRET=your-jwt-secret-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
GEMINI_API_KEY=your-gemini-api-key
API_URL=https://your-api-domain.com
CLIENT_URL=https://your-client-domain.com
```

## Development Deployment

### Option 1: Using the Deployment Script (Linux/macOS)

```bash
# Make the script executable
chmod +x deploy.sh

# Run development deployment
./deploy.sh development

# Run without tests
./deploy.sh development true
```

### Option 2: Manual Development Setup

1. **Install Dependencies**

```bash
# Install server dependencies
cd server
npm install
cd ..

# Install client dependencies
cd client
npm install
cd ..
```

2. **Start MongoDB** (if running locally)

```bash
# Using MongoDB service
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

3. **Start Development Servers**

```bash
# Terminal 1: Start the backend server
cd server
npm run dev

# Terminal 2: Start the frontend client
cd client
npm run dev
```

4. **Access the Application**

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

### Option 3: Windows PowerShell

```powershell
# Install dependencies
cd server
npm install
cd ..
cd client
npm install
cd ..

# Start servers (in separate terminals)
# Terminal 1:
cd server
npm run dev

# Terminal 2:
cd client
npm run dev
```

## Production Deployment

### Option 1: Using Docker Compose (Recommended)

1. **Prepare Environment Files**

Ensure all production environment files are created and configured properly.

2. **Deploy with Script**

```bash
./deploy.sh production
```

3. **Manual Docker Deployment**

```bash
# Build and start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### Option 2: Manual Production Setup

1. **Build Applications**

```bash
# Build server
cd server
npm ci --only=production
npm run build
cd ..

# Build client
cd client
npm ci
npm run build
cd ..
```

2. **Deploy to Server**

```bash
# Copy built files to production server
scp -r server/dist user@server:/path/to/app/server/
scp -r client/dist user@server:/path/to/app/client/

# Install production dependencies on server
ssh user@server "cd /path/to/app/server && npm ci --only=production"
```

3. **Start Production Services**

```bash
# Start server with PM2 (recommended)
pm2 start server/dist/index.js --name "ai-health-analyzer-api"

# Or start with node
node server/dist/index.js
```

### Option 3: Cloud Platform Deployment

#### Vercel (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy client
cd client
vercel --prod
```

#### Railway/Render (Backend)

1. Connect your repository to Railway/Render
2. Set environment variables in the platform dashboard
3. Deploy automatically on git push

## Verification

### Automated Verification

#### Linux/macOS

```bash
# Run integration tests
node integration-tests.js
```

#### Windows PowerShell

```powershell
# Run verification script
.\verify-deployment.ps1 -Environment "development"

# For production
.\verify-deployment.ps1 -Environment "production" -ApiUrl "https://your-api-domain.com/api" -ClientUrl "https://your-client-domain.com"
```

### Manual Verification

1. **Health Check**

```bash
curl http://localhost:5000/api/health
```

2. **Frontend Access**

Open http://localhost:3000 in your browser

3. **API Endpoints**

Test key endpoints:
- GET /api/health
- POST /api/auth/register
- POST /api/auth/login

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed

**Symptoms**: Server fails to start with MongoDB connection error

**Solutions**:
- Ensure MongoDB is running
- Check MONGODB_URI in environment variables
- Verify network connectivity to MongoDB Atlas (if using cloud)

#### 2. Cloudinary Configuration Error

**Symptoms**: File upload fails

**Solutions**:
- Verify Cloudinary credentials in environment variables
- Check Cloudinary account limits
- Ensure proper API permissions

#### 3. AI Analysis Fails

**Symptoms**: Report analysis returns errors

**Solutions**:
- Verify Gemini API key is valid
- Check API quota and limits
- Ensure proper file format (PDF)

#### 4. CORS Errors

**Symptoms**: Frontend cannot connect to backend

**Solutions**:
- Check CLIENT_URL in server environment variables
- Verify CORS configuration in server/src/index.ts
- Ensure proper protocol (http/https) matching

#### 5. Build Failures

**Symptoms**: npm run build fails

**Solutions**:
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility
- Verify all environment variables are set

### Debug Mode

Enable debug logging:

```bash
# Server debug mode
DEBUG=* npm run dev

# Client debug mode
VITE_DEBUG=true npm run dev
```

### Log Files

Check application logs:

```bash
# Docker logs
docker-compose logs -f api
docker-compose logs -f client

# PM2 logs
pm2 logs ai-health-analyzer-api

# System logs
tail -f /var/log/ai-health-analyzer.log
```

## Performance Monitoring

### Built-in Monitoring

The application includes built-in performance monitoring:

- **API Response Times**: Tracked automatically
- **Memory Usage**: Monitored and logged
- **Error Rates**: Calculated and reported
- **Cache Performance**: Hit rates and statistics

### Monitoring Endpoints

- Health Check: `/api/health`
- Metrics (dev only): `/api/metrics`

### External Monitoring

Consider integrating with:

- **Application Performance Monitoring (APM)**: New Relic, DataDog
- **Error Tracking**: Sentry
- **Uptime Monitoring**: Pingdom, UptimeRobot
- **Log Management**: ELK Stack, Splunk

### Performance Optimization

The application includes several performance optimizations:

#### Frontend
- Code splitting and lazy loading
- Bundle optimization
- Image optimization
- Caching strategies
- Performance monitoring

#### Backend
- Database indexing
- Query optimization
- In-memory caching
- Rate limiting
- Connection pooling
- Compression

### Scaling Considerations

For high-traffic deployments:

1. **Horizontal Scaling**: Deploy multiple API instances behind a load balancer
2. **Database Scaling**: Use MongoDB replica sets or sharding
3. **Caching**: Implement Redis for distributed caching
4. **CDN**: Use Cloudflare or AWS CloudFront for static assets
5. **Monitoring**: Implement comprehensive monitoring and alerting

## Security Checklist

- [ ] Environment variables are properly secured
- [ ] JWT secrets are strong and unique
- [ ] HTTPS is enabled in production
- [ ] Security headers are configured
- [ ] Rate limiting is enabled
- [ ] Input validation is implemented
- [ ] File upload restrictions are in place
- [ ] Database access is restricted
- [ ] API endpoints are properly authenticated
- [ ] Error messages don't leak sensitive information

## Maintenance

### Regular Tasks

1. **Update Dependencies**: Monthly security updates
2. **Monitor Logs**: Daily log review
3. **Database Maintenance**: Weekly index optimization
4. **Backup**: Daily database backups
5. **Performance Review**: Weekly performance analysis

### Update Process

1. Test updates in development environment
2. Run full test suite
3. Deploy to staging environment
4. Run integration tests
5. Deploy to production during maintenance window
6. Monitor for issues post-deployment

## Support

For deployment issues:

1. Check this documentation
2. Review application logs
3. Run verification scripts
4. Check GitHub issues
5. Contact development team

---

**Note**: This deployment guide assumes familiarity with basic DevOps concepts. For production deployments, consider consulting with a DevOps engineer to ensure proper security and scalability configurations.