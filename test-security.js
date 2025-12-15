/**
 * Script test bảo mật API
 * Kiểm tra xem các endpoint có bị lộ thông tin không
 */

const https = require('https');
const http = require('http');

const API_BASE = 'https://api.pdkhang.online/api/v1';

const testEndpoints = [
  '/users',
  '/users/1', 
  '/courses',
  '/problems',
  '/leaderboard',
  '/payments/my-payments',
  '/admin/users'
];

function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}${endpoint}`;
    const options = {
      method: 'GET',
      headers: {
        'User-Agent': 'SecurityTest/1.0'
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          endpoint,
          status: res.statusCode,
          headers: res.headers,
          data: data.substring(0, 200) + (data.length > 200 ? '...' : '')
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        endpoint,
        status: 'ERROR',
        error: err.message
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        endpoint,
        status: 'TIMEOUT'
      });
    });

    req.end();
  });
}

async function testSecurity() {
  console.log('🔒 Testing API Security...\n');
  
  for (const endpoint of testEndpoints) {
    try {
      const result = await makeRequest(endpoint);
      
      console.log(`📍 ${endpoint}`);
      console.log(`   Status: ${result.status}`);
      
      if (result.status === 200) {
        console.log(`   ⚠️  ACCESSIBLE - ${result.data}`);
      } else if (result.status === 401) {
        console.log(`   ✅ PROTECTED - Unauthorized`);
      } else if (result.status === 403) {
        console.log(`   ✅ BLOCKED - Forbidden`);
      } else {
        console.log(`   ❓ Other: ${result.error || result.data}`);
      }
      console.log('');
      
    } catch (error) {
      console.log(`📍 ${endpoint}`);
      console.log(`   ❌ ERROR: ${error.message}\n`);
    }
  }
}

testSecurity().catch(console.error);