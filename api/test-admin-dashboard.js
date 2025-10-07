const axios = require('axios');

// Test configuration
const API_BASE_URL = 'http://localhost:3000/api/v1';
const ADMIN_TOKEN = 'your_admin_jwt_token_here'; // Replace with actual admin JWT token

// Test endpoints
const testEndpoints = [
  {
    name: 'Admin Dashboard Stats',
    url: `${API_BASE_URL}/admin/dashboard/stats`,
    method: 'GET'
  },
  {
    name: 'User Statistics',
    url: `${API_BASE_URL}/admin/users/statistics`,
    method: 'GET'
  },
  {
    name: 'Course Statistics',
    url: `${API_BASE_URL}/admin/courses/statistics`,
    method: 'GET'
  },
  {
    name: 'Problem Statistics',
    url: `${API_BASE_URL}/admin/problems/statistics`,
    method: 'GET'
  }
];

async function testEndpoint(endpoint) {
  try {
    console.log(`\n🔍 Testing: ${endpoint.name}`);
    console.log(`📍 URL: ${endpoint.url}`);
    
    const response = await axios({
      method: endpoint.method,
      url: endpoint.url,
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Response Keys:`, Object.keys(response.data.data || response.data));
    
    if (response.data.data) {
      // Show sample of the data structure
      const sampleKeys = Object.keys(response.data.data).slice(0, 5);
      sampleKeys.forEach(key => {
        const value = response.data.data[key];
        if (Array.isArray(value)) {
          console.log(`   ${key}: Array(${value.length})`);
        } else if (typeof value === 'object' && value !== null) {
          console.log(`   ${key}: Object(${Object.keys(value).length} keys)`);
        } else {
          console.log(`   ${key}: ${value}`);
        }
      });
    }
    
    return { success: true, data: response.data };
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    if (error.response) {
      console.log(`📄 Status: ${error.response.status}`);
      console.log(`📄 Response:`, error.response.data);
    } else if (error.request) {
      console.log(`📡 No response received - Server might be down`);
    }
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting Admin Dashboard API Tests');
  console.log('=====================================');
  
  if (ADMIN_TOKEN === 'your_admin_jwt_token_here') {
    console.log('⚠️  Warning: Using placeholder JWT token. Replace with actual admin token for authentication.');
    console.log('   These tests will fail with 401/403 errors without a valid token.\n');
  }
  
  const results = [];
  
  for (const endpoint of testEndpoints) {
    const result = await testEndpoint(endpoint);
    results.push({ endpoint: endpoint.name, ...result });
  }
  
  console.log('\n📋 Test Summary');
  console.log('================');
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.endpoint}`);
  });
  
  const passCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`\n🏁 Results: ${passCount}/${totalCount} tests passed`);
  
  if (passCount === totalCount) {
    console.log('🎉 All dashboard endpoints are working correctly!');
  } else {
    console.log('🔧 Some endpoints need attention. Check the error messages above.');
  }
}

// Instructions for manual testing
console.log('📖 Dashboard API Test Instructions');
console.log('===================================');
console.log('1. Make sure the API server is running (npm run dev)');
console.log('2. Replace ADMIN_TOKEN with a valid admin JWT token');
console.log('3. Run: node test-admin-dashboard.js');
console.log('');

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('💥 Test runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = { testEndpoint, runTests };