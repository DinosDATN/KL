#!/usr/bin/env node

/**
 * Script debug Google OAuth issues
 * Kiểm tra cấu hình và test Google OAuth flow
 */

require('dotenv').config();

console.log('🔍 GOOGLE OAUTH DEBUG');
console.log('====================\n');

// 1. Kiểm tra environment variables
console.log('📋 1. KIỂM TRA ENVIRONMENT VARIABLES:');
console.log('=====================================');

const requiredVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET', 
  'GOOGLE_CALLBACK_URL',
  'CLIENT_URL',
  'JWT_SECRET',
  'NODE_ENV'
];

let missingVars = [];

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    if (varName.includes('SECRET') || varName.includes('JWT')) {
      console.log(`✅ ${varName}=${value.substring(0, 10)}...`);
    } else {
      console.log(`✅ ${varName}=${value}`);
    }
  } else {
    console.log(`❌ ${varName}=MISSING`);
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log(`\n⚠️ Thiếu ${missingVars.length} biến môi trường quan trọng!`);
  console.log('Vui lòng cập nhật file .env với các biến sau:');
  missingVars.forEach(varName => {
    console.log(`${varName}=your_value_here`);
  });
}

// 2. Kiểm tra Google OAuth URLs
console.log('\n📋 2. KIỂM TRA GOOGLE OAUTH URLS:');
console.log('=================================');

const clientUrl = process.env.CLIENT_URL;
const callbackUrl = process.env.GOOGLE_CALLBACK_URL;

console.log(`Frontend URL: ${clientUrl}`);
console.log(`Callback URL: ${callbackUrl}`);

// Kiểm tra URL format
if (callbackUrl) {
  if (callbackUrl.startsWith('https://') || callbackUrl.startsWith('http://')) {
    console.log('✅ Callback URL format hợp lệ');
    
    // Kiểm tra có đúng path không
    if (callbackUrl.includes('/api/v1/auth/google/callback')) {
      console.log('✅ Callback path đúng');
    } else {
      console.log('❌ Callback path có thể sai. Nên là: /api/v1/auth/google/callback');
    }
  } else {
    console.log('❌ Callback URL phải bắt đầu bằng http:// hoặc https://');
  }
}

// 3. Kiểm tra Google Console settings
console.log('\n📋 3. KIỂM TRA GOOGLE CONSOLE SETTINGS:');
console.log('======================================');

console.log('Vui lòng kiểm tra trong Google Cloud Console:');
console.log('1. 🌐 Authorized JavaScript origins:');
if (clientUrl) {
  console.log(`   - ${clientUrl}`);
  if (clientUrl.includes('localhost')) {
    console.log('   - http://localhost:4200 (cho development)');
  }
}

console.log('\n2. 🔄 Authorized redirect URIs:');
if (callbackUrl) {
  console.log(`   - ${callbackUrl}`);
}

console.log('\n3. 📧 OAuth consent screen:');
console.log('   - App name: Tên ứng dụng của bạn');
console.log('   - User support email: Email hỗ trợ');
console.log('   - Authorized domains: Domain của bạn');
console.log('   - Scopes: email, profile, openid');

// 4. Test URLs
console.log('\n📋 4. TEST URLS:');
console.log('================');

const testUrls = [
  `${clientUrl}/auth/login`,
  `${callbackUrl}`,
  `${clientUrl}/auth/callback`
];

console.log('Các URL cần test:');
testUrls.forEach(url => {
  console.log(`🔗 ${url}`);
});

// 5. Common issues và solutions
console.log('\n📋 5. COMMON ISSUES & SOLUTIONS:');
console.log('================================');

console.log(`
🚨 NGUYÊN NHÂN THƯỜNG GẶP:

1. ❌ GOOGLE_CLIENT_ID hoặc GOOGLE_CLIENT_SECRET sai
   ✅ Kiểm tra lại trong Google Cloud Console

2. ❌ GOOGLE_CALLBACK_URL không khớp với Google Console
   ✅ Phải giống hệt trong "Authorized redirect URIs"

3. ❌ Domain chưa được authorize trong Google Console
   ✅ Thêm domain vào "Authorized JavaScript origins"

4. ❌ OAuth consent screen chưa được setup đúng
   ✅ Cần có app name, support email, authorized domains

5. ❌ Scopes không đủ
   ✅ Cần có: email, profile, openid

6. ❌ Cookie domain settings sai
   ✅ COOKIE_DOMAIN phải khớp với domain thật

7. ❌ HTTPS/HTTP mismatch
   ✅ Production phải dùng HTTPS, dev có thể dùng HTTP
`);

// 6. Debug commands
console.log('\n📋 6. DEBUG COMMANDS:');
console.log('====================');

console.log(`
🔧 LỆNH DEBUG:

1. Kiểm tra API server logs:
   pm2 logs | grep -i google

2. Test API endpoint:
   curl -I ${callbackUrl}

3. Test Google OAuth flow:
   curl "${clientUrl}/api/v1/auth/google"

4. Kiểm tra database user:
   mysql -u root -p
   USE your_database;
   SELECT * FROM Users WHERE email = 'your_google_email@gmail.com';
`);

// 7. Recommended .env settings
console.log('\n📋 7. RECOMMENDED .ENV SETTINGS:');
console.log('===============================');

const isProduction = process.env.NODE_ENV === 'production';
const domain = clientUrl ? new URL(clientUrl).hostname : 'localhost';

console.log(`
# Cấu hình đề xuất cho ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}:

NODE_ENV=${isProduction ? 'production' : 'development'}
CLIENT_URL=${clientUrl || 'http://localhost:4200'}
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=${callbackUrl || (isProduction ? `https://${domain}/api/v1/auth/google/callback` : 'http://localhost:3000/api/v1/auth/google/callback')}

# Cookie settings
COOKIE_DOMAIN=${isProduction ? domain : 'localhost'}
COOKIE_SECURE=${isProduction ? 'true' : 'false'}

# CORS settings
CORS_ORIGIN=${clientUrl || 'http://localhost:4200'}
`);

console.log('\n✅ DEBUG HOÀN THÀNH!');
console.log('Vui lòng kiểm tra các vấn đề trên và cập nhật cấu hình tương ứng.');