#!/usr/bin/env node

/**
 * AI Health Analyzer - Deployment Preparation Script
 * 
 * This script prepares the application for deployment by:
 * - Installing dependencies
 * - Running builds
 * - Checking for common issues
 * - Validating configurations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing AI Health Analyzer for Deployment\n');

function runCommand(command, cwd = process.cwd()) {
  try {
    console.log(`📦 Running: ${command}`);
    execSync(command, { cwd, stdio: 'inherit' });
    console.log('✅ Success\n');
    return true;
  } catch (error) {
    console.error(`❌ Failed: ${command}`);
    console.error(error.message);
    return false;
  }
}

function createFileIfNotExists(filePath, content) {
  if (!fs.existsSync(filePath)) {
    console.log(`📝 Creating: ${filePath}`);
    fs.writeFileSync(filePath, content);
    console.log('✅ Created\n');
  } else {
    console.log(`✅ Already exists: ${filePath}\n`);
  }
}

// Step 1: Install dependencies
console.log('📦 Installing Dependencies...\n');

if (!runCommand('npm install', 'server')) {
  console.error('❌ Failed to install server dependencies');
  process.exit(1);
}

if (!runCommand('npm install', 'client')) {
  console.error('❌ Failed to install client dependencies');
  process.exit(1);
}

// Step 2: Create missing configuration files
console.log('📝 Creating Configuration Files...\n');

// Ensure .gitignore includes necessary entries
const gitignoreContent = `
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
/client/dist/
/server/dist/

# Environment variables
.env
.env.local
.env.production.local
.env.development.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test
.env.production

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/
`;

createFileIfNotExists('.gitignore', gitignoreContent.trim());

// Step 3: Test builds
console.log('🔨 Testing Builds...\n');

if (!runCommand('npm run build', 'server')) {
  console.error('❌ Server build failed');
  process.exit(1);
}

if (!runCommand('npm run build', 'client')) {
  console.error('❌ Client build failed');
  process.exit(1);
}

// Step 4: Validate TypeScript
console.log('🔍 Validating TypeScript...\n');

if (!runCommand('npx tsc --noEmit', 'server')) {
  console.error('❌ Server TypeScript validation failed');
  process.exit(1);
}

if (!runCommand('npx tsc --noEmit', 'client')) {
  console.error('❌ Client TypeScript validation failed');
  process.exit(1);
}

// Step 5: Run linting
console.log('🧹 Running Linting...\n');

runCommand('npm run lint', 'client'); // Don't fail on lint errors, just warn

// Step 6: Create deployment summary
console.log('📋 Creating Deployment Summary...\n');

const deploymentSummary = `# Deployment Summary

Generated: ${new Date().toISOString()}

## Build Status
- ✅ Server dependencies installed
- ✅ Client dependencies installed
- ✅ Server build successful
- ✅ Client build successful
- ✅ TypeScript validation passed

## Next Steps

### 1. Backend Deployment (Render)
1. Go to https://dashboard.render.com
2. Create new Web Service
3. Connect GitHub repository
4. Configure:
   - Root Directory: \`server\`
   - Build Command: \`npm ci && npm run build\`
   - Start Command: \`npm start\`
5. Set environment variables (see server/.env.production)
6. Deploy

### 2. Frontend Deployment (Vercel)
1. Go to https://vercel.com/dashboard
2. Import GitHub repository
3. Configure:
   - Root Directory: \`client\`
   - Framework: Vite
   - Build Command: \`npm run build\`
   - Output Directory: \`dist\`
4. Set environment variables (see client/.env.production)
5. Deploy

### 3. Post-Deployment
1. Update CLIENT_URL in Render with your Vercel URL
2. Test the application
3. Monitor logs for any issues

## Important URLs to Update
- Update VITE_API_URL in Vercel with your Render backend URL
- Update CLIENT_URL in Render with your Vercel frontend URL

## Support
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Deployment Guide: VERCEL_RENDER_DEPLOYMENT.md
`;

fs.writeFileSync('DEPLOYMENT_SUMMARY.md', deploymentSummary);

console.log('🎉 Deployment Preparation Complete!\n');
console.log('📋 Summary:');
console.log('- All dependencies installed');
console.log('- Builds tested successfully');
console.log('- TypeScript validation passed');
console.log('- Configuration files created');
console.log('- Deployment summary generated');
console.log('\n📚 Next: Follow the steps in VERCEL_RENDER_DEPLOYMENT.md');
console.log('📝 Quick reference: DEPLOYMENT_SUMMARY.md');

console.log('\n🔧 Run deployment checklist:');
console.log('node deployment-checklist.js');