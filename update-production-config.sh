#!/bin/bash

# Script để cập nhật cấu hình production cho realtime features
# Chạy script này trên server production

echo "🔧 CẬP NHẬT CẤU HÌNH PRODUCTION CHO REALTIME"
echo "============================================"

# Màu sắc cho output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Hàm hiển thị thông báo
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Kiểm tra quyền root
if [[ $EUID -eq 0 ]]; then
   print_warning "Script đang chạy với quyền root. Một số lệnh có thể cần điều chỉnh."
fi

# 1. Cập nhật file .env
echo -e "\n📋 1. CẬP NHẬT FILE .ENV..."

ENV_FILE="api/.env"

if [ ! -f "$ENV_FILE" ]; then
    print_error "File $ENV_FILE không tồn tại!"
    exit 1
fi

print_info "Backup file .env hiện tại..."
cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

# Đọc domain từ user
read -p "Nhập domain chính của bạn (ví dụ: pdkhang.online): " MAIN_DOMAIN

if [ -z "$MAIN_DOMAIN" ]; then
    print_error "Domain không được để trống!"
    exit 1
fi

print_info "Cập nhật cấu hình CORS và Socket.IO..."

# Cập nhật hoặc thêm các cấu hình cần thiết
update_env_var() {
    local key=$1
    local value=$2
    local file=$3
    
    if grep -q "^${key}=" "$file"; then
        # Cập nhật giá trị hiện có
        sed -i "s|^${key}=.*|${key}=${value}|" "$file"
        print_status "Cập nhật ${key}=${value}"
    else
        # Thêm mới
        echo "${key}=${value}" >> "$file"
        print_status "Thêm mới ${key}=${value}"
    fi
}

# Cập nhật các biến môi trường
update_env_var "NODE_ENV" "production" "$ENV_FILE"
update_env_var "CORS_ORIGIN" "https://${MAIN_DOMAIN},https://www.${MAIN_DOMAIN}" "$ENV_FILE"
update_env_var "SOCKET_CORS_ORIGIN" "https://${MAIN_DOMAIN},https://www.${MAIN_DOMAIN}" "$ENV_FILE"
update_env_var "CLIENT_URL" "https://${MAIN_DOMAIN}" "$ENV_FILE"

# 2. Kiểm tra cấu hình Nginx
echo -e "\n📋 2. KIỂM TRA CẤU HÌNH NGINX..."

NGINX_SITE="/etc/nginx/sites-available/${MAIN_DOMAIN}"

if [ -f "$NGINX_SITE" ]; then
    print_info "Kiểm tra cấu hình Socket.IO proxy trong Nginx..."
    
    if grep -q "location /socket.io/" "$NGINX_SITE"; then
        print_status "Socket.IO proxy đã được cấu hình"
    else
        print_warning "Socket.IO proxy chưa được cấu hình trong Nginx"
        print_info "Thêm cấu hình sau vào file $NGINX_SITE:"
        echo -e "${BLUE}"
        cat << 'EOF'
    # Proxy Socket.IO
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
EOF
        echo -e "${NC}"
    fi
else
    print_warning "File cấu hình Nginx $NGINX_SITE không tồn tại"
fi

# 3. Kiểm tra PM2
echo -e "\n📋 3. KIỂM TRA PM2..."

if command -v pm2 &> /dev/null; then
    print_status "PM2 đã được cài đặt"
    
    # Kiểm tra ecosystem.config.js
    if [ -f "ecosystem.config.js" ]; then
        print_status "File ecosystem.config.js tồn tại"
        
        # Hiển thị trạng thái PM2
        print_info "Trạng thái PM2 hiện tại:"
        pm2 status
    else
        print_warning "File ecosystem.config.js không tồn tại"
    fi
else
    print_error "PM2 chưa được cài đặt"
fi

# 4. Test cấu hình
echo -e "\n📋 4. TEST CẤU HÌNH..."

print_info "Kiểm tra port 3000..."
if netstat -tlnp | grep :3000 > /dev/null; then
    print_status "API server đang chạy trên port 3000"
else
    print_warning "API server không chạy trên port 3000"
fi

print_info "Kiểm tra Nginx..."
if systemctl is-active --quiet nginx; then
    print_status "Nginx đang chạy"
else
    print_warning "Nginx không chạy"
fi

# 5. Hướng dẫn restart services
echo -e "\n📋 5. RESTART CÁC DỊCH VỤ..."

print_info "Để áp dụng các thay đổi, chạy các lệnh sau:"
echo -e "${BLUE}"
echo "# Restart API server"
echo "pm2 restart ecosystem.config.js"
echo ""
echo "# Reload Nginx configuration"
echo "sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "# Kiểm tra logs"
echo "pm2 logs"
echo "sudo tail -f /var/log/nginx/error.log"
echo -e "${NC}"

# 6. Test script
echo -e "\n📋 6. SCRIPT TEST..."

print_info "Để test Socket.IO connection, chạy:"
echo -e "${BLUE}node test-socket-connection.js${NC}"

print_info "Để kiểm tra chi tiết, chạy:"
echo -e "${BLUE}node fix-realtime-production.js${NC}"

echo -e "\n✅ HOÀN THÀNH CẬP NHẬT CẤU HÌNH!"
print_info "Vui lòng restart các dịch vụ và kiểm tra logs để đảm bảo mọi thứ hoạt động bình thường."