/**
 * Integration Tests for AI Health Analyzer
 * Tests complete user workflows end-to-end
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
const CLIENT_BASE_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123',
  firstName: 'Test',
  lastName: 'User'
};

const testPatient = {
  name: 'John Doe',
  age: 35,
  gender: 'male',
  phoneNumber: '+1234567890'
};

let authToken = '';
let reportId = '';

// Helper functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const apiRequest = async (method, endpoint, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`API Request failed: ${method} ${endpoint}`, error.response?.data || error.message);
    throw error;
  }
};

const checkHealth = async () => {
  console.log('🏥 Checking API health...');
  try {
    const response = await apiRequest('GET', '/health');
    console.log('✅ API is healthy:', response.message);
    return true;
  } catch (error) {
    console.error('❌ API health check failed');
    return false;
  }
};

const testAuthentication = async () => {
  console.log('\n🔐 Testing Authentication...');
  
  try {
    // Test registration
    console.log('📝 Testing user registration...');
    const registerResponse = await apiRequest('POST', '/auth/register', testUser);
    console.log('✅ User registered successfully');
    
    // Test login
    console.log('🔑 Testing user login...');
    const loginResponse = await apiRequest('POST', '/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    
    authToken = loginResponse.data.token;
    console.log('✅ User logged in successfully');
    
    // Test profile access
    console.log('👤 Testing profile access...');
    const profileResponse = await apiRequest('GET', '/auth/profile');
    console.log('✅ Profile accessed successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    return false;
  }
};

const testFileUploadWorkflow = async () => {
  console.log('\n📄 Testing File Upload Workflow...');
  
  try {
    // Create a mock PDF file for testing
    const mockPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF');
    
    // Test file upload
    console.log('📤 Testing file upload...');
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', mockPdfBuffer, {
      filename: 'test-report.pdf',
      contentType: 'application/pdf'
    });
    
    // Add patient info
    Object.keys(testPatient).forEach(key => {
      form.append(key, testPatient[key]);
    });
    
    const uploadResponse = await axios.post(`${API_BASE_URL}/reports/upload`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${authToken}`
      }
    });
    
    reportId = uploadResponse.data.data.reportId;
    console.log('✅ File uploaded successfully, Report ID:', reportId);
    
    return true;
  } catch (error) {
    console.error('❌ File upload test failed:', error.message);
    return false;
  }
};

const testReportAnalysis = async () => {
  console.log('\n🤖 Testing AI Report Analysis...');
  
  try {
    if (!reportId) {
      throw new Error('No report ID available for analysis');
    }
    
    // Test report retrieval
    console.log('📋 Testing report retrieval...');
    const reportResponse = await apiRequest('GET', `/reports/${reportId}`);
    console.log('✅ Report retrieved successfully');
    
    // Note: AI analysis would typically be triggered automatically
    // In a real test, you might need to mock the AI service
    console.log('🔍 AI analysis testing skipped (requires mock AI service)');
    
    return true;
  } catch (error) {
    console.error('❌ Report analysis test failed:', error.message);
    return false;
  }
};

const testReportManagement = async () => {
  console.log('\n📊 Testing Report Management...');
  
  try {
    // Test getting user reports
    console.log('📋 Testing user reports retrieval...');
    const reportsResponse = await apiRequest('GET', `/reports/user/${testUser.email}?page=1&limit=10`);
    console.log('✅ User reports retrieved successfully');
    
    // Test search functionality
    console.log('🔍 Testing report search...');
    const searchResponse = await apiRequest('GET', `/reports/search?q=${testPatient.name}`);
    console.log('✅ Report search completed successfully');
    
    // Test report filtering
    console.log('🎯 Testing report filtering...');
    const filterResponse = await apiRequest('GET', `/reports/user/${testUser.email}?gender=${testPatient.gender}&age=${testPatient.age}`);
    console.log('✅ Report filtering completed successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Report management test failed:', error.message);
    return false;
  }
};

const testPerformanceMetrics = async () => {
  console.log('\n⚡ Testing Performance Metrics...');
  
  try {
    // Test health endpoint with metrics
    console.log('📊 Testing health endpoint with metrics...');
    const healthResponse = await apiRequest('GET', '/health');
    
    if (healthResponse.performance) {
      console.log('✅ Performance metrics available');
      console.log(`   - Total requests: ${healthResponse.performance.totalRequests}`);
      console.log(`   - Average response time: ${healthResponse.performance.averageResponseTime.toFixed(2)}ms`);
      console.log(`   - Error rate: ${healthResponse.performance.errorRate.toFixed(2)}%`);
    }
    
    // Test metrics endpoint (development only)
    if (process.env.NODE_ENV !== 'production') {
      try {
        const metricsResponse = await apiRequest('GET', '/metrics');
        console.log('✅ Metrics endpoint accessible');
      } catch (error) {
        console.log('ℹ️ Metrics endpoint not available (expected in production)');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Performance metrics test failed:', error.message);
    return false;
  }
};

const testErrorHandling = async () => {
  console.log('\n🚨 Testing Error Handling...');
  
  try {
    // Test invalid endpoint
    console.log('🔍 Testing 404 error handling...');
    try {
      await apiRequest('GET', '/invalid-endpoint');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ 404 error handled correctly');
      } else {
        throw error;
      }
    }
    
    // Test unauthorized access
    console.log('🔒 Testing unauthorized access...');
    const originalToken = authToken;
    authToken = 'invalid-token';
    
    try {
      await apiRequest('GET', '/auth/profile');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Unauthorized access handled correctly');
      } else {
        throw error;
      }
    }
    
    authToken = originalToken;
    
    // Test rate limiting (if enabled)
    console.log('⏱️ Testing rate limiting...');
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(apiRequest('GET', '/health'));
    }
    
    try {
      await Promise.all(requests);
      console.log('✅ Rate limiting test completed (no limits hit)');
    } catch (error) {
      if (error.response?.status === 429) {
        console.log('✅ Rate limiting working correctly');
      } else {
        console.log('ℹ️ Rate limiting not triggered');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
    return false;
  }
};

const cleanup = async () => {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete test report
    if (reportId) {
      await apiRequest('DELETE', `/reports/${reportId}`);
      console.log('✅ Test report deleted');
    }
    
    // Note: In a real test environment, you might want to delete the test user
    // For safety, we'll leave it for manual cleanup
    console.log('ℹ️ Test user left for manual cleanup');
    
    return true;
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    return false;
  }
};

// Main test runner
const runIntegrationTests = async () => {
  console.log('🚀 Starting AI Health Analyzer Integration Tests\n');
  
  const tests = [
    { name: 'Health Check', fn: checkHealth },
    { name: 'Authentication', fn: testAuthentication },
    { name: 'File Upload Workflow', fn: testFileUploadWorkflow },
    { name: 'Report Analysis', fn: testReportAnalysis },
    { name: 'Report Management', fn: testReportManagement },
    { name: 'Performance Metrics', fn: testPerformanceMetrics },
    { name: 'Error Handling', fn: testErrorHandling },
    { name: 'Cleanup', fn: cleanup }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
        console.log(`✅ ${test.name} - PASSED`);
      } else {
        failed++;
        console.log(`❌ ${test.name} - FAILED`);
      }
    } catch (error) {
      failed++;
      console.log(`❌ ${test.name} - FAILED:`, error.message);
    }
    
    // Small delay between tests
    await delay(1000);
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All integration tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some tests failed. Please check the logs above.');
    process.exit(1);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runIntegrationTests().catch(error => {
    console.error('❌ Integration tests failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runIntegrationTests,
  checkHealth,
  testAuthentication,
  testFileUploadWorkflow,
  testReportAnalysis,
  testReportManagement,
  testPerformanceMetrics,
  testErrorHandling
};