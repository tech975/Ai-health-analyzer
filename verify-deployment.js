#!/usr/bin/env node

/**
 * Deployment Verification Script
 * 
 * This script verifies that the deployed application is working correctly
 * by testing key endpoints and functionality.
 */

const https = require('https');
const http = require('http');

class DeploymentVerifier {
  constructor(apiUrl, clientUrl) {
    this.apiUrl = apiUrl;
    this.clientUrl = clientUrl;
    this.results = [];
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https:') ? https : http;
      const req = client.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        req.write(options.body);
      }
      req.end();
    });
  }

  log(test, status, message) {
    const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
    console.log(`${emoji} ${test}: ${message}`);
    this.results.push({ test, status, message });
  }

  async testHealthCheck() {
    try {
      const response = await this.makeRequest(`${this.apiUrl}/health`);
      
      if (response.statusCode === 200) {
        const data = JSON.parse(response.data);
        if (data.status === 'OK') {
          this.log('Health Check', 'pass', 'API is responding correctly');
          return true;
        } else {
          this.log('Health Check', 'fail', `Unexpected status: ${data.status}`);
          return false;
        }
      } else {
        this.log('Health Check', 'fail', `HTTP ${response.statusCode}`);
        return false;
      }
    } catch (error) {
      this.log('Health Check', 'fail', error.message);
      return false;
    }
  }

  async testCORS() {
    try {
      const response = await this.makeRequest(`${this.apiUrl}/health`, {
        method: 'OPTIONS',
        headers: {
          'Origin': this.clientUrl,
          'Access-Control-Request-Method': 'GET'
        }
      });

      const corsHeader = response.headers['access-control-allow-origin'];
      if (corsHeader === this.clientUrl || corsHeader === '*') {
        this.log('CORS Configuration', 'pass', 'CORS headers configured correctly');
        return true;
      } else {
        this.log('CORS Configuration', 'fail', `CORS origin: ${corsHeader}, expected: ${this.clientUrl}`);
        return false;
      }
    } catch (error) {
      this.log('CORS Configuration', 'fail', error.message);
      return false;
    }
  }

  async testFrontend() {
    try {
      const response = await this.makeRequest(this.clientUrl);
      
      if (response.statusCode === 200) {
        if (response.data.includes('<title>') && response.data.includes('AI Health Analyzer')) {
          this.log('Frontend Deployment', 'pass', 'Frontend is accessible and contains expected content');
          return true;
        } else {
          this.log('Frontend Deployment', 'warn', 'Frontend accessible but content may be incorrect');
          return false;
        }
      } else {
        this.log('Frontend Deployment', 'fail', `HTTP ${response.statusCode}`);
        return false;
      }
    } catch (error) {
      this.log('Frontend Deployment', 'fail', error.message);
      return false;
    }
  }

  async testAuthEndpoint() {
    try {
      // Test registration endpoint (should return validation error for empty body)
      const response = await this.makeRequest(`${this.apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      // We expect a 400 error for validation
      if (response.statusCode === 400) {
        this.log('Auth Endpoint', 'pass', 'Auth endpoint is responding with proper validation');
        return true;
      } else {
        this.log('Auth Endpoint', 'warn', `Unexpected status code: ${response.statusCode}`);
        return false;
      }
    } catch (error) {
      this.log('Auth Endpoint', 'fail', error.message);
      return false;
    }
  }

  async testSSL() {
    if (this.apiUrl.startsWith('https://')) {
      this.log('SSL/TLS', 'pass', 'API using HTTPS');
    } else {
      this.log('SSL/TLS', 'warn', 'API not using HTTPS (not recommended for production)');
    }

    if (this.clientUrl.startsWith('https://')) {
      this.log('SSL/TLS', 'pass', 'Frontend using HTTPS');
    } else {
      this.log('SSL/TLS', 'warn', 'Frontend not using HTTPS (not recommended for production)');
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Deployment Verification\n');
    console.log(`🔗 API URL: ${this.apiUrl}`);
    console.log(`🌐 Client URL: ${this.clientUrl}\n`);

    const tests = [
      () => this.testSSL(),
      () => this.testHealthCheck(),
      () => this.testCORS(),
      () => this.testFrontend(),
      () => this.testAuthEndpoint()
    ];

    let passed = 0;
    let failed = 0;
    let warnings = 0;

    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        console.error('Test error:', error);
      }
    }

    // Count results
    this.results.forEach(result => {
      if (result.status === 'pass') passed++;
      else if (result.status === 'fail') failed++;
      else warnings++;
    });

    console.log('\n📊 Verification Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️ Warnings: ${warnings}`);

    if (failed === 0) {
      console.log('\n🎉 Deployment verification successful!');
      console.log('Your application appears to be working correctly.');
    } else {
      console.log('\n❌ Some tests failed. Please check the issues above.');
    }

    if (warnings > 0) {
      console.log('\n⚠️ Some warnings were found. Consider addressing them for better security/performance.');
    }

    return failed === 0;
  }
}

// Command line usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node verify-deployment.js <API_URL> <CLIENT_URL>');
    console.log('');
    console.log('Examples:');
    console.log('  node verify-deployment.js https://your-api.onrender.com/api https://your-app.vercel.app');
    console.log('  node verify-deployment.js http://localhost:5000/api http://localhost:3000');
    process.exit(1);
  }

  const [apiUrl, clientUrl] = args;
  const verifier = new DeploymentVerifier(apiUrl, clientUrl);
  
  verifier.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
}

module.exports = DeploymentVerifier;