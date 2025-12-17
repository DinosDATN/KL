#!/usr/bin/env node

/**
 * Script để khắc phục vấn đề realtime notifications và chat không hoạt động ở production
 * 
 * Các vấn đề thường gặp:
 * 1. CORS configuration không đúng
 * 2. Socket.IO URL không đúng
 * 3. Nginx proxy configuration thiếu
 * 4. Environment variables không đúng
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 KHẮC PHỤC VẤN ĐỀ REALTIME PRODUCTION');
console.log('=====================================\n');

// Kiểm tra các file cần thiết
const requiredFiles = [
  'api/.env',
  'api/src/app.js',
  'cli/src/environments/environment.prod.ts'
];

console.log('📋 1. KIỂM TRA CÁC FILE CẤU HÌNH...');
let missingFiles = [];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - Tồn tại`);
  } else {
    console.log(`❌ ${file} - Không tồn tại`);
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.log('\n⚠️ Một số file cấu hình bị thiếu. Vui lòng tạo chúng trước.');
  process.exit(1);
}

console.log('\n📋 2. KIỂM TRA CẤU HÌNH API .ENV...');

// Đọc file .env
let envContent = '';
try {
  envContent = fs.readFileSync('api/.env', 'utf8');
  console.log('✅ Đọc file .env thành công');
} catch (error) {
  console.log('❌ Không thể đọc file .env:', error.message);
  process.exit(1);
}

// Kiểm tra các cấu hình quan trọng
const requiredEnvVars = [
  'CORS_ORIGIN',
  'SOCKET_CORS_ORIGIN',
  'CLIENT_URL',
  'JWT_SECRET',
  'NODE_ENV'
];

console.log('\n🔍 Kiểm tra các biến môi trường quan trọng:');
const envLines = envContent.split('\n');
const envVars = {};

envLines.forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

requiredEnvVars.forEach(varName => {
  if (envVars[varName]) {
    console.log(`✅ ${varName}=${envVars[varName]}`);
  } else {
    console.log(`❌ ${varName} - Chưa được cấu hình`);
  }
});

console.log('\n📋 3. KIỂM TRA CẤU HÌNH SOCKET.IO TRONG APP.JS...');

try {
  const appJsContent = fs.readFileSync('api/src/app.js', 'utf8');
  
  // Kiểm tra allowedSocketOrigins
  if (appJsContent.includes('allowedSocketOrigins')) {
    console.log('✅ allowedSocketOrigins được cấu hình');
    
    // Tìm và hiển thị cấu hình
    const originMatch = appJsContent.match(/allowedSocketOrigins\s*=\s*\[([\s\S]*?)\]/);
    if (originMatch) {
      console.log('🔍 Cấu hình hiện tại:');
      console.log(originMatch[0]);
    }
  } else {
    console.log('❌ allowedSocketOrigins không được tìm thấy');
  }
  
  // Kiểm tra CORS configuration
  if (appJsContent.includes('cors({')) {
    console.log('✅ CORS được cấu hình');
  } else {
    console.log('❌ CORS configuration không được tìm thấy');
  }
  
} catch (error) {
  console.log('❌ Không thể đọc file app.js:', error.message);
}

console.log('\n📋 4. KIỂM TRA ENVIRONMENT PRODUCTION...');

try {
  const envProdContent = fs.readFileSync('cli/src/environments/environment.prod.ts', 'utf8');
  
  if (envProdContent.includes('socketUrl')) {
    console.log('✅ socketUrl được cấu hình trong environment.prod.ts');
  } else {
    console.log('❌ socketUrl chưa được cấu hình trong environment.prod.ts');
  }
  
  console.log('🔍 Nội dung environment.prod.ts:');
  console.log(envProdContent);
  
} catch (error) {
  console.log('❌ Không thể đọc file environment.prod.ts:', error.message);
}

console.log('\n📋 5. GỢI Ý KHẮC PHỤC...');

console.log(`
🔧 CÁC BƯỚC KHẮC PHỤC:

1. CẬP NHẬT FILE .ENV PRODUCTION:
   Thêm hoặc cập nhật các dòng sau trong api/.env:
   
   NODE_ENV=production
   CORS_ORIGIN=https://pdkhang.online,https://www.pdkhang.online
   SOCKET_CORS_ORIGIN=https://pdkhang.online,https://www.pdkhang.online
   CLIENT_URL=https://pdkhang.online

2. KIỂM TRA NGINX CONFIGURATION:
   Đảm bảo có cấu hình proxy cho Socket.IO:
   
   location /socket.io/ {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }

3. RESTART CÁC DỊCH VỤ:
   sudo systemctl reload nginx
   pm2 restart ecosystem.config.js

4. KIỂM TRA LOGS:
   pm2 logs
   sudo tail -f /var/log/nginx/error.log

5. TEST SOCKET.IO CONNECTION:
   Mở Developer Tools > Console trên website
   Kiểm tra có lỗi Socket.IO connection không
`);

console.log('\n✅ HOÀN THÀNH KIỂM TRA!');
console.log('Vui lòng thực hiện các bước khắc phục ở trên và restart các dịch vụ.');