# 🚀 HƯỚNG DẪN DEPLOY REALTIME FEATURES LÊN PRODUCTION

## Bước 1: Push code lên production server

```bash
# Commit và push changes
git add .
git commit -m "Fix realtime features for production"
git push origin main

# Trên production server, pull latest code
cd /path/to/your/project
git pull origin main
```

## Bước 2: Cập nhật file .env trên production server

```bash
# Backup file .env hiện tại
cp api/.env api/.env.backup.$(date +%Y%m%d_%H%M%S)

# Chỉnh sửa file .env
nano api/.env
```

**Thêm/cập nhật các dòng sau trong api/.env:**

```env
# Environment
NODE_ENV=production

# CORS Configuration - THAY ĐỔI DOMAIN CỦA BẠN
CORS_ORIGIN=https://pdkhang.online,https://www.pdkhang.online
SOCKET_CORS_ORIGIN=https://pdkhang.online,https://www.pdkhang.online
CLIENT_URL=https://pdkhang.online

# Cookie Configuration - THAY ĐỔI DOMAIN CỦA BẠN
COOKIE_DOMAIN=pdkhang.online
COOKIE_SECURE=true

# Các cấu hình khác giữ nguyên...
```

## Bước 3: Kiểm tra cấu hình Nginx

```bash
# Kiểm tra file cấu hình Nginx cho domain của bạn
sudo nano /etc/nginx/sites-available/pdkhang.online
```

**Đảm bảo có cấu hình Socket.IO proxy:**

```nginx
server {
    listen 80;
    server_name pdkhang.online www.pdkhang.online;
    
    # ... các cấu hình khác ...
    
    # Proxy API requests
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # ✅ QUAN TRỌNG: Proxy Socket.IO
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
}
```

## Bước 4: Build và deploy frontend

```bash
# Build Angular app cho production
cd cli
npm run build

# Copy build files đến thư mục web server
sudo cp -r dist/* /var/www/html/

# Hoặc nếu bạn có script deploy riêng
# ./deploy-frontend.sh
```

## Bước 5: Restart các services

```bash
# Test cấu hình Nginx
sudo nginx -t

# Nếu OK, reload Nginx
sudo systemctl reload nginx

# Restart API server
pm2 restart ecosystem.config.js

# Hoặc restart tất cả PM2 processes
pm2 restart all
```

## Bước 6: Kiểm tra logs và test

```bash
# Kiểm tra PM2 logs
pm2 logs

# Kiểm tra Nginx logs
sudo tail -f /var/log/nginx/error.log

# Kiểm tra API server có chạy không
netstat -tlnp | grep :3000

# Test Socket.IO connection (optional)
node test-socket-connection.js
```

## Bước 7: Test trên browser

1. **Mở website production:** `https://pdkhang.online`
2. **Login vào tài khoản**
3. **Mở Developer Tools > Console**
4. **Kiểm tra Socket.IO connection:**
   - Tìm log: `Connected to server` hoặc `Socket.IO connection`
   - Không có lỗi CORS
   - Không có lỗi authentication

5. **Test realtime features:**
   - Gửi tin nhắn chat
   - Kiểm tra notifications
   - Test với 2 browser/tab khác nhau

## Troubleshooting

### Nếu Socket.IO không connect:

```bash
# Kiểm tra backend logs
pm2 logs | grep -i socket

# Kiểm tra Nginx logs
sudo tail -f /var/log/nginx/error.log

# Test API endpoint
curl -I https://pdkhang.online/api/v1/health

# Test Socket.IO endpoint
curl -I https://pdkhang.online/socket.io/
```

### Nếu có lỗi CORS:

1. Kiểm tra file `.env` có đúng domain không
2. Restart PM2: `pm2 restart all`
3. Kiểm tra browser console có lỗi CORS không

### Nếu authentication failed:

1. Kiểm tra JWT_SECRET trong `.env`
2. Kiểm tra cookie domain settings
3. Clear browser cookies và login lại

## Script tự động (Optional)

Bạn có thể chạy script này để tự động cập nhật cấu hình:

```bash
# Chạy script kiểm tra
bash check-nginx-config.sh

# Chạy script cập nhật
bash update-production-config.sh
```

---

## ✅ Checklist Deploy

- [ ] Code đã được push lên production server
- [ ] File `.env` đã được cập nhật với domain production
- [ ] Nginx có cấu hình Socket.IO proxy
- [ ] Frontend đã được build và deploy
- [ ] PM2 và Nginx đã được restart
- [ ] Logs không có lỗi
- [ ] Website có thể truy cập được
- [ ] Socket.IO connection thành công
- [ ] Realtime features hoạt động (chat, notifications)

Sau khi hoàn thành tất cả các bước, realtime features sẽ hoạt động bình thường trên production! 🎉