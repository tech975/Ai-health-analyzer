#!/usr/bin/env node

/**
 * AI Health Analyzer - Deployment Checklist Script
 * 
 * This script verifies that all necessary files and configurations
 * are in place for successful deployment to Vercel and Render.
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 AI Health Analyzer - Deployment Checklist\n');

let allChecksPass = true;

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${description}: ${filePath}`);
  if (!exists) allChecksPass = false;
  return exists;
}

function checkEnvVar(envContent, varName, description) {
  const hasVar = envContent.includes(varName);
  console.log(`${hasVar ? '✅' : '❌'} ${description}: ${varName}`);
  if (!hasVar) allChecksPass = false;
  return hasVar;
}

function checkPackageScript(packagePath, scriptName, description) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const hasScript = packageJson.scripts && packageJson.scripts[scriptName];
    console.log(`${hasScript ? '✅' : '❌'} ${description}: ${scriptName}`);
    if (!hasScript) allChecksPass = false;
    return hasScript;
  } catch (error) {
    console.log(`❌ ${description}: Could not read ${packagePath}`);
    allChecksPass = false;
    return false;
  }
}

console.log('📁 Checking File Structure...\n');

// Check essential files
checkFile('client/package.json', 'Client package.json');
checkFile('server/package.json', 'Server package.json');
checkFile('client/vercel.json', 'Vercel configuration');
checkFile('server/render.yaml', 'Render configuration');
checkFile('client/.env.production', 'Client production environment');
checkFile('server/.env.production', 'Server production environment');
checkFile('server/tsconfig.json', 'TypeScript configuration');

console.log('\n📦 Checking Package Scripts...\n');

// Check package.json scripts
checkPackageScript('client/package.json', 'build', 'Client build script');
checkPackageScript('server/package.json', 'build', 'Server build script');
checkPackageScript('server/package.json', 'start', 'Server start script');

console.log('\n🔧 Checking Environment Variables...\n');

// Check client environment variables
if (fs.existsSync('client/.env.production')) {
  const clientEnv = fs.readFileSync('client/.env.production', 'utf8');
  checkEnvVar(clientEnv, 'VITE_API_URL', 'Client API URL');
  checkEnvVar(clientEnv, 'VITE_APP_NAME', 'Client App Name');
}

// Check server environment variables
if (fs.existsSync('server/.env.production')) {
  const serverEnv = fs.readFileSync('server/.env.production', 'utf8');
  checkEnvVar(serverEnv, 'NODE_ENV', 'Node Environment');
  checkEnvVar(serverEnv, 'PORT', 'Server Port');
  checkEnvVar(serverEnv, 'MONGODB_URI', 'MongoDB URI');
  checkEnvVar(serverEnv, 'JWT_SECRET', 'JWT Secret');
  checkEnvVar(serverEnv, 'CLOUDINARY_CLOUD_NAME', 'Cloudinary Cloud Name');
  checkEnvVar(serverEnv, 'CLOUDINARY_API_KEY', 'Cloudinary API Key');
  checkEnvVar(serverEnv, 'CLOUDINARY_API_SECRET', 'Cloudinary API Secret');
  checkEnvVar(serverEnv, 'GEMINI_API_KEY', 'Gemini API Key');
  checkEnvVar(serverEnv, 'CLIENT_URL', 'Client URL');
}

console.log('\n🔍 Checking Dependencies...\n');

// Check for critical dependencies
function checkDependency(packagePath, depName, description) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const hasDep = (packageJson.dependencies && packageJson.dependencies[depName]) ||
                   (packageJson.devDependencies && packageJson.devDependencies[depName]);
    console.log(`${hasDep ? '✅' : '❌'} ${description}: ${depName}`);
    if (!hasDep) allChecksPass = false;
    return hasDep;
  } catch (error) {
    console.log(`❌ Could not check dependency ${depName} in ${packagePath}`);
    allChecksPass = false;
    return false;
  }
}

// Client dependencies
checkDependency('client/package.json', 'react', 'React');
checkDependency('client/package.json', 'vite', 'Vite');
checkDependency('client/package.json', 'typescript', 'TypeScript');

// Server dependencies
checkDependency('server/package.json', 'express', 'Express');
checkDependency('server/package.json', 'mongoose', 'Mongoose');
checkDependency('server/package.json', 'typescript', 'TypeScript');

console.log('\n📋 Deployment Readiness Summary\n');

if (allChecksPass) {
  console.log('🎉 All checks passed! Your application is ready for deployment.\n');
  
  console.log('📝 Next Steps:');
  console.log('1. Push your code to GitHub');
  console.log('2. Deploy backend to Render:');
  console.log('   - Connect GitHub repository');
  console.log('   - Set root directory to "server"');
  console.log('   - Configure environment variables');
  console.log('3. Deploy frontend to Vercel:');
  console.log('   - Connect GitHub repository');
  console.log('   - Set root directory to "client"');
  console.log('   - Configure environment variables');
  console.log('4. Update CLIENT_URL in Render with your Vercel URL');
  console.log('5. Test the deployment');
  
} else {
  console.log('❌ Some checks failed. Please fix the issues above before deploying.\n');
  
  console.log('🔧 Common Fixes:');
  console.log('- Run the deployment preparation commands');
  console.log('- Ensure all environment files are created');
  console.log('- Check that all dependencies are installed');
  console.log('- Verify file paths and names');
}

console.log('\n📚 For detailed instructions, see: VERCEL_RENDER_DEPLOYMENT.md');

process.exit(allChecksPass ? 0 : 1);