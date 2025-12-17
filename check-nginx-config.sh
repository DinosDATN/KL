#!/bin/bash

# Script để kiểm tra cấu hình Nginx trên production server

echo "🔍 KIỂM TRA CẤU HÌNH NGINX PRODUCTION"
echo "===================================="

# Tìm file cấu hình Nginx
echo -e "\n📋 1. TÌM FILE CẤU HÌNH NGINX..."

NGINX_SITES_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"

if [ -d "$NGINX_SITES_DIR" ]; then
    echo "✅ Thư mục sites-available tồn tại"
    echo "📁 Các file cấu hình:"
    ls -la "$NGINX_SITES_DIR"
else
    echo "❌ Thư mục sites-available không tồn tại"
fi

echo -e "\n📋 2. KIỂM TRA SITES-ENABLED..."
if [ -d "$NGINX_ENABLED_DIR" ]; then
    echo "✅ Thư mục sites-enabled tồn tại"
    echo "📁 Các file được kích hoạt:"
    ls -la "$NGINX_ENABLED_DIR"
else
    echo "❌ Thư mục sites-enabled không tồn tại"
fi

# Tìm file cấu hình chứa domain
echo -e "\n📋 3. TÌM CẤU HÌNH DOMAIN..."
read -p "Nhập domain của bạn (ví dụ: pdkhang.online): " DOMAIN

if [ ! -z "$DOMAIN" ]; then
    echo "🔍 Tìm kiếm cấu hình cho domain: $DOMAIN"
    
    # Tìm trong sites-available
    FOUND_FILES=$(grep -l "$DOMAIN" "$NGINX_SITES_DIR"/* 2>/dev/null)
    
    if [ ! -z "$FOUND_FILES" ]; then
        echo "✅ Tìm thấy cấu hình:"
        echo "$FOUND_FILES"
        
        for file in $FOUND_FILES; do
            echo -e "\n📄 Nội dung file: $file"
            echo "================================"
            cat "$file"
            echo "================================"
            
            # Kiểm tra Socket.IO proxy
            if grep -q "location /socket.io/" "$file"; then
                echo "✅ Socket.IO proxy được cấu hình"
            else
                echo "❌ Socket.IO proxy CHƯA được cấu hình"
                echo "⚠️ Cần thêm cấu hình sau:"
                echo ""
                echo "    # Proxy Socket.IO"
                echo "    location /socket.io/ {"
                echo "        proxy_pass http://localhost:3000;"
                echo "        proxy_http_version 1.1;"
                echo "        proxy_set_header Upgrade \$http_upgrade;"
                echo "        proxy_set_header Connection \"upgrade\";"
                echo "        proxy_set_header Host \$host;"
                echo "        proxy_set_header X-Real-IP \$remote_addr;"
                echo "        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
                echo "        proxy_set_header X-Forwarded-Proto \$scheme;"
                echo "    }"
            fi
        done
    else
        echo "❌ Không tìm thấy cấu hình cho domain $DOMAIN"
    fi
fi

# Kiểm tra trạng thái Nginx
echo -e "\n📋 4. KIỂM TRA TRẠNG THÁI NGINX..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx đang chạy"
    
    # Test cấu hình
    echo "🔍 Test cấu hình Nginx..."
    if nginx -t 2>/dev/null; then
        echo "✅ Cấu hình Nginx hợp lệ"
    else
        echo "❌ Cấu hình Nginx có lỗi:"
        nginx -t
    fi
else
    echo "❌ Nginx không chạy"
fi

# Kiểm tra port 3000
echo -e "\n📋 5. KIỂM TRA BACKEND SERVER..."
if netstat -tlnp | grep :3000 > /dev/null 2>&1; then
    echo "✅ Backend server đang chạy trên port 3000"
    
    # Hiển thị process
    echo "🔍 Process đang sử dụng port 3000:"
    netstat -tlnp | grep :3000
else
    echo "❌ Backend server KHÔNG chạy trên port 3000"
    echo "⚠️ Cần khởi động backend server"
fi

# Kiểm tra logs
echo -e "\n📋 6. KIỂM TRA LOGS..."
echo "🔍 Nginx error logs (10 dòng cuối):"
if [ -f "/var/log/nginx/error.log" ]; then
    tail -10 /var/log/nginx/error.log
else
    echo "❌ Không tìm thấy file log Nginx"
fi

echo -e "\n✅ HOÀN THÀNH KIỂM TRA!"
echo "Nếu Socket.IO proxy chưa được cấu hình, hãy thêm vào file Nginx và reload:"
echo "sudo nginx -t && sudo systemctl reload nginx"