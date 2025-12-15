# Hướng Dẫn Hosting Dự Án Lên VPS Ubuntu

## Tổng Quan Dự Án
Dự án của bạn bao gồm 3 thành phần chính:
- **API Backend** (Node.js + Express + MySQL)
- **Frontend** (Angular CLI)
- **AI Service** (Python FastAPI)
- **Database** (MySQL + phpMyAdmin)

## Yêu Cầu VPS
- Ubuntu 20.04 LTS hoặc mới hơn
- RAM: tối thiểu 2GB (khuyến nghị 4GB)
- Storage: tối thiểu 20GB
- CPU: 2 cores

## Bước 1: Chuẩn Bị VPS

### 1.1 Kết nối VPS
```bash
ssh root@your-vps-ip          # 🔄 Thay your-vps-ip bằng IP VPS của bạn
# hoặc
ssh username@your-vps-ip      # 🔄 Thay username và your-vps-ip
```

### 1.2 Cập nhật hệ thống
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Cài đặt các công cụ cần thiết
```bash
# Cài đặt Docker và Docker Compose
sudo apt install -y curl wget git
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker khang

# Cài đặt Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Cài đặt Node.js 20 và npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Cài đặt PM2 globally
sudo npm install -g pm2

# Cài đặt Python và pip
sudo apt install -y python3 python3-pip python3-venv

# Cài đặt Nginx
sudo apt install -y nginx

# Cài đặt Certbot cho SSL
sudo apt install -y certbot python3-certbot-nginx
```

## Bước 2: Upload Code Lên VPS

### 2.1 Tạo thư mục dự án
```bash
sudo mkdir -p /var/www/KL          # 🔄 Thay KL bằng tên dự án
sudo chown -R $USER:$USER /var/www/KL    # 🔄 Hoặc thay $USER bằng username
cd /var/www/KL
```

### 2.2 Upload code (chọn 1 trong các cách sau)

**Cách 1: Sử dụng Git (khuyến nghị)**
```bash
git clone https://github.com/your-username/your-repo.git .    # 🔄 Thay bằng GitHub repo của bạn
```


## Bước 3: Cấu Hình Database (MySQL + phpMyAdmin)

### 3.1 Chạy MySQL và phpMyAdmin
```bash
cd /var/www/KL/api
sudo docker-compose up -d mysql phpmyadmin
```

### 3.2 Kiểm tra containers
```bash
sudo docker ps
```

### 3.3 Truy cập phpMyAdmin
- URL: `http://your-vps-ip:8080`    # 🔄 Thay your-vps-ip bằng IP VPS của bạn
- Username: `root`
- Password: `rootpassword`

## Bước 4: Cấu Hình API Backend

### 4.1 Tạo file .env cho production
```bash
cd /var/www/KL/api
cp .env.example .env
```

### 4.2 Chỉnh sửa file .env
```bash
nano .env
```

### 4.3 Cài đặt dependencies và chạy migration
```bash
npm install
npm run db:migrate
```

### 4.4 Tạo file cấu hình PM2 cho API
```bash
nano ecosystem.config.js
```

Nội dung file:
```javascript
module.exports = {
  apps: [
    {
      name: 'api-backend',
      script: 'src/app.js',
      cwd: '/var/www/KL/api',    // 🔄 Thay KL bằng tên thư mục dự án
      instances: 'max',                    // Sử dụng tất cả CPU cores
      exec_mode: 'cluster',                // Cluster mode cho performance tốt hơn
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/api-backend-error.log',
      out_file: '/var/log/pm2/api-backend-out.log',
      log_file: '/var/log/pm2/api-backend.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G'
    }
  ]
};
```

### 4.5 Khởi động API với PM2
```bash
# Tạo thư mục logs
sudo mkdir -p /var/log/pm2
sudo chown -R khang:khang /var/log/pm2

# Khởi động API với PM2
pm2 start ecosystem.config.js

# Lưu cấu hình PM2
pm2 save

# Tự động khởi động PM2 khi reboot
pm2 startup
# Chạy lệnh được suggest bởi pm2 startup (thường là sudo...)

# Kiểm tra trạng thái
pm2 status
pm2 logs api-backend
```

## Bước 5: Cấu Hình AI Service

### 5.1 Tạo virtual environment
```bash
cd /var/www/KL/ai              # 🔄 Thay KL bằng tên thư mục dự án
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 5.2 Tạo file .env cho AI service
```bash
cp .env.example .env                      # 🔄 Kiểm tra tên file .env mẫu (có thể là .env.example)
nano .env                                 # 🔄 Cập nhật API keys cho OpenAI, etc.
```

### 5.3 Cập nhật file cấu hình PM2 cho AI Service
```bash
nano ecosystem.config.js
```

Thêm AI service vào file cấu hình:
```javascript
module.exports = {
  apps: [
    {
      name: 'api-backend',
      script: 'src/app.js',
      cwd: '/var/www/KL/api',    // 🔄 Thay KL
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/api-backend-error.log',
      out_file: '/var/log/pm2/api-backend-out.log',
      log_file: '/var/log/pm2/api-backend.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G'
    },
    {
  name: 'ai-service',
  script: '/var/www/KL/ai/venv/bin/python',
  args: '-m uvicorn service:app --host 0.0.0.0 --port 8000',
  cwd: '/var/www/KL/ai',
  instances: 1,
  exec_mode: 'fork',
  env: {
    PYTHONPATH: '/var/www/KL/ai'
  },
  error_file: '/var/log/pm2/ai-service-error.log',
  out_file: '/var/log/pm2/ai-service-out.log',
  log_file: '/var/log/pm2/ai-service.log',
  time: true,
  autorestart: true,
  max_restarts: 10,
  min_uptime: '10s',
  max_memory_restart: '2G'
}


  ]
};
```

### 5.4 Khởi động AI service với PM2
```bash
# Restart PM2 với cấu hình mới
pm2 restart ecosystem.config.js

# Hoặc start AI service riêng lẻ
pm2 start ecosystem.config.js --only ai-service

# Kiểm tra trạng thái
pm2 status
pm2 logs ai-service
```

## Bước 6: Build và Deploy Frontend

### 6.1 Build Angular app
```bash
cd /var/www/KL/cli              # 🔄 Thay KL bằng tên thư mục dự án
npm install
npm run build
```

### 6.2 Copy build files
```bash
sudo cp -r dist/cli/* /var/www/html/
```

## Bước 7: Cấu Hình Nginx

### 7.1 Tạo file cấu hình Nginx
```bash
sudo nano /etc/nginx/sites-available/your-domain.com    # 🔄 Thay your-domain.com bằng domain của bạn
```

Nội dung file:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;    # 🔄 Thay bằng domain của bạn

    # Frontend (Angular)
    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
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

    # Socket.IO
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

    # AI Service
    location /ai/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # phpMyAdmin (tùy chọn, chỉ cho admin)
    location /phpmyadmin/ {
        proxy_pass http://localhost:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Bảo mật: chỉ cho phép IP admin
        # allow your-admin-ip;
        # deny all;
    }

    # File uploads
    location /uploads/ {
        alias /var/www/KL/api/uploads/;    # 🔄 Thay KL bằng tên thư mục dự án
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 7.2 Kích hoạt site
```bash
sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/    # 🔄 Thay your-domain.com
sudo nginx -t
sudo systemctl reload nginx
```

## Bước 8: Cấu Hình SSL với Let's Encrypt

### 8.1 Cài đặt SSL certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com    # 🔄 Thay bằng domain của bạn
```

### 8.2 Tự động gia hạn SSL
```bash
sudo crontab -e
```

Thêm dòng:
```
0 12 * * * /usr/bin/certbot renew --quiet
```

## Bước 9: Cấu Hình Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 3306  # MySQL (chỉ nếu cần truy cập từ bên ngoài)
sudo ufw enable
```

## Bước 10: Monitoring và Logs

### 10.1 Xem logs
```bash
# PM2 logs
pm2 logs                          # Tất cả services
pm2 logs api-backend             # Chỉ API backend
pm2 logs ai-service              # Chỉ AI service

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Docker logs
sudo docker-compose logs -f mysql
sudo docker-compose logs -f phpmyadmin
```

### 10.2 Kiểm tra trạng thái services
```bash
# PM2 status
pm2 status
pm2 monit                        # Real-time monitoring

# System services
sudo systemctl status nginx
sudo docker ps

# PM2 process info
pm2 info api-backend
pm2 info ai-service
```

## Bước 11: Backup và Bảo Mật

### 11.1 Backup database
```bash
# Tạo script backup
sudo nano /usr/local/bin/backup-db.sh
```

Nội dung:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
sudo docker exec api_mysql mysqldump -u root -prootpassword lfysdb > /var/backups/db_backup_$DATE.sql
find /var/backups -name "db_backup_*.sql" -mtime +7 -delete
```

```bash
sudo chmod +x /usr/local/bin/backup-db.sh
# Thêm vào crontab để backup hàng ngày
echo "0 2 * * * /usr/local/bin/backup-db.sh" | sudo crontab -
```

### 11.2 Bảo mật cơ bản
```bash
# Thay đổi SSH port (tùy chọn)
sudo nano /etc/ssh/sshd_config
# Uncomment và thay đổi: Port 2222

# Disable root login
# PermitRootLogin no

sudo systemctl restart ssh
```

## Kiểm Tra Hoạt Động

1. **Frontend**: `https://your-domain.com`                        # 🔄 Thay your-domain.com
2. **API Health**: `https://your-domain.com/api/v1/health`        # 🔄 Thay your-domain.com
3. **AI Service**: `https://your-domain.com/ai/docs` (FastAPI docs)    # 🔄 Thay your-domain.com
4. **phpMyAdmin**: `https://your-domain.com/phpmyadmin`           # 🔄 Thay your-domain.com

## Troubleshooting

### Lỗi thường gặp:

1. **Service không start**: Kiểm tra logs với `pm2 logs`
2. **Database connection failed**: Kiểm tra MySQL container và credentials
3. **502 Bad Gateway**: Kiểm tra backend services có chạy không
4. **CORS errors**: Kiểm tra cấu hình CORS_ORIGIN trong .env

### Commands hữu ích:
```bash
# PM2 commands
pm2 restart all                  # Restart tất cả PM2 processes
pm2 restart api-backend          # Restart API backend
pm2 restart ai-service           # Restart AI service
pm2 reload all                   # Zero-downtime reload
pm2 stop all                     # Stop tất cả processes
pm2 delete all                   # Xóa tất cả processes

# System services
sudo systemctl restart nginx
sudo docker-compose restart

# Xem resource usage
pm2 monit                        # PM2 monitoring dashboard
htop
df -h
free -h
```

## Cập Nhật Code

Để cập nhật code mới:
```bash
cd /var/www/KL                          # 🔄 Thay KL bằng tên thư mục dự án
git pull origin main                              # 🔄 Thay main bằng tên branch chính của bạn

# Update API
cd api
npm install
pm2 restart api-backend

# Update AI
cd ../ai
source venv/bin/activate
pip install -r requirements.txt
pm2 restart ai-service

# Update Frontend
cd ../cli
npm install
npm run build
sudo cp -r dist/cli/* /var/www/html/
```

---

---

## 📝 Checklist Thông Tin Cần Thay Thế

Trước khi bắt đầu, hãy chuẩn bị các thông tin sau:

- **🌐 Domain**: `your-domain.com` → Tên miền của bạn
- **🖥️ VPS IP**: `your-vps-ip` → Địa chỉ IP VPS
- **👤 Username**: `username` → Tên user trên VPS
- **📁 Project Name**: `KL` → Tên thư mục dự án
- **🔐 JWT Secret**: Chuỗi bí mật ít nhất 32 ký tự
- **🔑 OAuth Credentials**: Google/GitHub Client ID & Secret
- **💳 VNPay**: TMN Code & Hash Secret (nếu sử dụng)
- **🤖 OpenAI API Key**: Cho AI service (nếu sử dụng)

**Lưu ý**: Tất cả các chỗ có ký hiệu 🔄 trong hướng dẫn đều cần thay thế bằng thông tin thực tế của bạn.

## 🚀 Ưu Điểm Của PM2

- **Cluster Mode**: Tự động scale API backend trên tất cả CPU cores
- **Zero Downtime**: Reload ứng dụng không gián đoạn service
- **Auto Restart**: Tự động restart khi crash hoặc memory leak
- **Monitoring**: Dashboard real-time để theo dõi performance
- **Log Management**: Tự động rotate và quản lý logs
- **Startup Script**: Tự động khởi động khi server reboot