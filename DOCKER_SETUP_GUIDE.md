# Hướng Dẫn Chạy Docker Compose

## Tổng Quan

Docker Compose sẽ chạy các service sau:
- **AI Service** (Port 8000): Chat AI với OpenRouter/OpenAI
- **MySQL Database** (Port 3306): Cơ sở dữ liệu chính
- **phpMyAdmin** (Port 8080): Quản lý database

## Chuẩn Bị

### 1. Tạo file .env cho AI service

```bash
cd ai
cp .env.ex .env
```

Cập nhật file `ai/.env` với thông tin thực tế:
```bash
# OpenRouter API Key (bắt buộc)
OPENROUTER_API_KEY=your-actual-api-key-here

# Database (sẽ kết nối với MySQL container)
DB_HOST=mysql
DB_PORT=3306
DB_USER=api_user
DB_PASSWORD=api_password
DB_NAME=lfysdb

# Application
DEBUG=True
HOST=0.0.0.0
PORT=8000
```

### 2. Cài đặt Docker và Docker Compose

Đảm bảo bạn đã cài đặt:
- Docker Desktop (Windows/Mac) hoặc Docker Engine (Linux)
- Docker Compose (thường đi kèm với Docker Desktop)

## Chạy Services

### Khởi động tất cả services:

```bash
cd api
docker-compose up -d
```

### Xem logs:

```bash
# Xem logs tất cả services
docker-compose logs -f

# Xem logs service cụ thể
docker-compose logs -f ai
docker-compose logs -f mysql
```

### Kiểm tra trạng thái:

```bash
docker-compose ps
```

## Truy Cập Services

- **AI Service**: http://localhost:8000
  - API Docs: http://localhost:8000/docs
  - Health Check: http://localhost:8000/health

- **phpMyAdmin**: http://localhost:8080
  - Server: mysql
  - Username: api_user
  - Password: api_password

- **MySQL**: localhost:3306
  - Host: localhost
  - Port: 3306
  - Database: lfysdb
  - Username: api_user
  - Password: api_password

## Quản Lý Services

### Dừng services:
```bash
docker-compose down
```

### Dừng và xóa volumes (xóa dữ liệu):
```bash
docker-compose down -v
```

### Rebuild services:
```bash
docker-compose up --build -d
```

### Restart service cụ thể:
```bash
docker-compose restart ai
```

## Troubleshooting

### 1. AI Service không khởi động được

Kiểm tra logs:
```bash
docker-compose logs ai
```

Thường do:
- Thiếu OPENROUTER_API_KEY trong .env
- Port 8000 đã được sử dụng
- Lỗi cài đặt dependencies

### 2. Không kết nối được database

Kiểm tra:
```bash
docker-compose logs mysql
```

Đảm bảo:
- MySQL container đã khởi động hoàn toàn
- Thông tin DB_HOST=mysql trong ai/.env

### 3. Port conflicts

Nếu port bị xung đột, sửa trong docker-compose.yml:
```yaml
ports:
  - "8001:8000"  # Thay đổi port bên trái
```

## Development Mode

Để development với hot reload:

1. AI service đã được cấu hình với volume mount
2. Thay đổi code sẽ tự động reload
3. Logs sẽ hiển thị real-time

## Production Notes

Khi deploy production:

1. Thay đổi DEBUG=False trong ai/.env
2. Sử dụng secret key mạnh
3. Cấu hình firewall cho các port
4. Sử dụng reverse proxy (nginx)
5. Backup database thường xuyên

## Useful Commands

```bash
# Xem resource usage
docker stats

# Exec vào container
docker-compose exec ai bash
docker-compose exec mysql mysql -u api_user -p

# Backup database
docker-compose exec mysql mysqldump -u api_user -p lfysdb > backup.sql

# Restore database
docker-compose exec -T mysql mysql -u api_user -p lfysdb < backup.sql
```