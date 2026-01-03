#!/usr/bin/env node

/**
 * Production Environment Setup Script
 * 
 * This script helps set up production environment variables
 * with proper validation and security checks.
 */

const fs = require('fs');
const crypto = require('crypto');

console.log('🔧 Setting up Production Environment Variables\n');

// Generate secure JWT secret
function generateJWTSecret() {
  return crypto.randomBytes(64).toString('hex');
}

// Validate MongoDB URI format
function validateMongoURI(uri) {
  const mongoRegex = /^mongodb(\+srv)?:\/\/.+/;
  return mongoRegex.test(uri);
}

// Validate URL format
function validateURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Interactive setup (for local use)
function setupInteractive() {
  console.log('🔐 Generating secure JWT secret...');
  const jwtSecret = generateJWTSecret();
  console.log('✅ JWT secret generated\n');

  const serverEnvTemplate = `# Production Environment Variables for Server
# Configure these in your Render dashboard

NODE_ENV=production
PORT=10000

# Database Configuration
# Replace with your MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-health-analyzer?retryWrites=true&w=majority

# JWT Configuration - KEEP THIS SECRET!
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=7d

# Cloudinary Configuration (File Storage)
# Get these from your Cloudinary dashboard
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# AI Configuration
# Get this from Google AI Studio
GEMINI_API_KEY=your-gemini-api-key

# CORS Configuration
# Update with your actual Vercel URL
CLIENT_URL=https://your-app-name.vercel.app

# Security Settings
BCRYPT_ROUNDS=12`;

  const clientEnvTemplate = `# Production Environment Variables for Client
# Configure these in your Vercel dashboard

# API Configuration
# Update with your actual Render backend URL
VITE_API_URL=https://your-backend-app.onrender.com/api

# App Configuration
VITE_APP_NAME=AI Health Analyzer
VITE_APP_VERSION=1.0.0

# Performance Settings
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_CACHE_ENABLED=true`;

  // Write template files
  fs.writeFileSync('server/.env.production.template', serverEnvTemplate);
  fs.writeFileSync('client/.env.production.template', clientEnvTemplate);

  console.log('📝 Environment templates created:');
  console.log('- server/.env.production.template');
  console.log('- client/.env.production.template');
  console.log('\n🔧 Next steps:');
  console.log('1. Copy the templates to .env.production files');
  console.log('2. Replace placeholder values with actual credentials');
  console.log('3. Use these values in your deployment platforms');
}

// Validation function for existing env files
function validateEnvironment() {
  console.log('🔍 Validating environment configuration...\n');

  let valid = true;

  // Check server environment
  if (fs.existsSync('server/.env.production')) {
    const serverEnv = fs.readFileSync('server/.env.production', 'utf8');
    
    console.log('📋 Server Environment Validation:');
    
    // Check required variables
    const requiredServerVars = [
      'NODE_ENV',
      'PORT',
      'MONGODB_URI',
      'JWT_SECRET',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
      'GEMINI_API_KEY',
      'CLIENT_URL'
    ];

    requiredServerVars.forEach(varName => {
      const hasVar = serverEnv.includes(`${varName}=`);
      console.log(`${hasVar ? '✅' : '❌'} ${varName}`);
      if (!hasVar) valid = false;
    });

    // Validate specific formats
    const mongoMatch = serverEnv.match(/MONGODB_URI=(.+)/);
    if (mongoMatch && mongoMatch[1]) {
      const mongoURI = mongoMatch[1].trim();
      if (validateMongoURI(mongoURI)) {
        console.log('✅ MongoDB URI format valid');
      } else {
        console.log('❌ MongoDB URI format invalid');
        valid = false;
      }
    }

    const clientUrlMatch = serverEnv.match(/CLIENT_URL=(.+)/);
    if (clientUrlMatch && clientUrlMatch[1]) {
      const clientUrl = clientUrlMatch[1].trim();
      if (validateURL(clientUrl)) {
        console.log('✅ Client URL format valid');
      } else {
        console.log('❌ Client URL format invalid');
        valid = false;
      }
    }

    const jwtMatch = serverEnv.match(/JWT_SECRET=(.+)/);
    if (jwtMatch && jwtMatch[1]) {
      const jwtSecret = jwtMatch[1].trim();
      if (jwtSecret.length >= 32) {
        console.log('✅ JWT secret length adequate');
      } else {
        console.log('❌ JWT secret too short (minimum 32 characters)');
        valid = false;
      }
    }
  } else {
    console.log('❌ server/.env.production not found');
    valid = false;
  }

  console.log('');

  // Check client environment
  if (fs.existsSync('client/.env.production')) {
    const clientEnv = fs.readFileSync('client/.env.production', 'utf8');
    
    console.log('📋 Client Environment Validation:');
    
    const requiredClientVars = [
      'VITE_API_URL',
      'VITE_APP_NAME'
    ];

    requiredClientVars.forEach(varName => {
      const hasVar = clientEnv.includes(`${varName}=`);
      console.log(`${hasVar ? '✅' : '❌'} ${varName}`);
      if (!hasVar) valid = false;
    });

    const apiUrlMatch = clientEnv.match(/VITE_API_URL=(.+)/);
    if (apiUrlMatch && apiUrlMatch[1]) {
      const apiUrl = apiUrlMatch[1].trim();
      if (validateURL(apiUrl)) {
        console.log('✅ API URL format valid');
      } else {
        console.log('❌ API URL format invalid');
        valid = false;
      }
    }
  } else {
    console.log('❌ client/.env.production not found');
    valid = false;
  }

  console.log('');

  if (valid) {
    console.log('🎉 All environment validations passed!');
  } else {
    console.log('❌ Some validations failed. Please fix the issues above.');
  }

  return valid;
}

// Security checklist
function securityChecklist() {
  console.log('🔒 Security Checklist:\n');
  
  const checklist = [
    'JWT_SECRET is at least 32 characters long',
    'MongoDB URI uses strong password',
    'Cloudinary credentials are from your account',
    'Gemini API key is valid and active',
    'CLIENT_URL matches your actual frontend domain',
    'No sensitive data in client environment variables',
    'Environment files are not committed to git',
    'Production URLs use HTTPS',
    'Database access is restricted to your application'
  ];

  checklist.forEach((item, index) => {
    console.log(`${index + 1}. [ ] ${item}`);
  });

  console.log('\n📋 Verify each item before deploying to production.');
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'setup':
    setupInteractive();
    break;
  case 'validate':
    validateEnvironment();
    break;
  case 'security':
    securityChecklist();
    break;
  default:
    console.log('Usage:');
    console.log('  node setup-production-env.js setup     - Generate environment templates');
    console.log('  node setup-production-env.js validate  - Validate existing environment');
    console.log('  node setup-production-env.js security  - Show security checklist');
    break;
}