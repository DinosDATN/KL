# 🔥 REALTIME FEATURES SETUP GUIDE

## Tổng quan

Dự án sử dụng **Socket.IO** để cung cấp các tính năng realtime:
- 💬 **Chat realtime** (group chat, private chat)
- 🔔 **Notifications realtime**
- 👥 **User online status**
- ⌨️ **Typing indicators**
- 👍 **Message reactions**

## Cấu trúc Files

```
├── api/
│   ├── src/
│   │   ├── socket/
│   │   │   └── chatHandler.js          # Socket.IO event handlers
│   │   ├── middleware/
│   │   │   └── socketAuthMiddleware.js # Socket authentication
│   │   └── app.js                      # Socket.IO server setup
│   └── .env                            # Environment variables
├── cli/
│   ├── src/
│   │   ├── app/core/services/
│   │   │   ├── socket.service.ts       # Basic Socket.IO service
│   │   │   └── enhanced-socket.service.ts # Advanced Socket.IO service
│   │   └── environments/
│   │       ├── environment.ts          # Development config
│   │       └── environment.prod.ts     # Production config
│   └── proxy.conf.json                 # Development proxy config
└── Scripts/
    ├── test-realtime-dev.js            # Test development setup
    ├── test-socket-connection.js       # Test Socket.IO connection
    └── deploy-production.md            # Production deployment guide
```

## Development Setup

### 1. Cài đặt dependencies

```bash
# Backend
cd api
npm install

# Frontend  
cd cli
npm install
```

### 2. Cấu hình environment

**api/.env:**
```env
# Socket.IO Configuration
SOCKET_CORS_ORIGIN=http://localhost:4200
CORS_ORIGIN=http://localhost:4200
CLIENT_URL=http://localhost:4200

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# Database và các config khác...
```

### 3. Chạy development servers

```bash
# Terminal 1: Backend API + Socket.IO
cd api
npm run dev

# Terminal 2: Frontend với proxy
cd cli  
ng serve --proxy-config proxy.conf.json
```

### 4. Test realtime features

```bash
# Test Socket.IO connection
cd api
npm run test:realtime

# Hoặc test manual
node test-realtime-dev.js
```

## Production Deployment

### 1. Build và deploy code

```bash
# Commit changes
git add .
git commit -m "Setup realtime features"
git push origin main

# Trên production server
git pull origin main
```

### 2. Cấu hình production environment

**api/.env (production):**
```env
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
SOCKET_CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
CLIENT_URL=https://yourdomain.com
COOKIE_DOMAIN=yourdomain.com
COOKIE_SECURE=true
```

### 3. Cấu hình Nginx

**Thêm vào Nginx config:**
```nginx
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
```

### 4. Restart services

```bash
# Test Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Restart API server
pm2 restart ecosystem.config.js
```

### 5. Verify deployment

```bash
# Check logs
pm2 logs

# Test Socket.IO
node test-socket-connection.js
```

## Troubleshooting

### Development Issues

**Socket.IO không connect:**
```bash
# Kiểm tra API server
curl http://localhost:3000/health

# Kiểm tra Socket.IO endpoint  
curl http://localhost:3000/socket.io/

# Test authentication
npm run test:auth
```

**CORS errors:**
- Kiểm tra `CORS_ORIGIN` và `SOCKET_CORS_ORIGIN` trong `.env`
- Đảm bảo `proxy.conf.json` có cấu hình `/socket.io`

### Production Issues

**Socket.IO connection failed:**
```bash
# Kiểm tra Nginx logs
sudo tail -f /var/log/nginx/error.log

# Kiểm tra PM2 logs
pm2 logs | grep -i socket

# Test endpoints
curl -I https://yourdomain.com/api/v1/health
curl -I https://yourdomain.com/socket.io/
```

**Authentication errors:**
- Kiểm tra `JWT_SECRET` giống nhau giữa dev và prod
- Kiểm tra `COOKIE_DOMAIN` và `COOKIE_SECURE` settings
- Clear browser cookies và login lại

## API Events

### Client → Server Events

```typescript
// Join room
socket.emit('join_room', roomId);

// Send message
socket.emit('send_message', {
  roomId: number,
  content: string,
  type: 'text' | 'image' | 'file',
  replyTo?: number
});

// Typing indicators
socket.emit('typing_start', { roomId });
socket.emit('typing_stop', { roomId });

// Reactions
socket.emit('add_reaction', {
  messageId: number,
  reactionType: 'like' | 'love' | 'laugh' | 'sad' | 'angry'
});
```

### Server → Client Events

```typescript
// Connection status
socket.on('connect', () => {});
socket.on('disconnect', () => {});
socket.on('auth_error', (error) => {});

// Messages
socket.on('new_message', (message) => {});
socket.on('user_typing', (data) => {});
socket.on('user_stop_typing', (data) => {});

// Reactions
socket.on('reaction_update', (data) => {});

// User status
socket.on('user_online', (data) => {});
socket.on('user_offline', (data) => {});

// Notifications
socket.on('notification', (data) => {});
```

## Performance Tips

### Development
- Sử dụng `enhanced-socket.service.ts` cho debugging tốt hơn
- Enable logging trong environment.ts
- Sử dụng Chrome DevTools để monitor WebSocket connections

### Production
- Disable logging trong environment.prod.ts
- Sử dụng PM2 cluster mode nếu cần
- Monitor memory usage của Socket.IO connections
- Implement connection limits nếu cần thiết

## Security

### Authentication
- JWT tokens được verify cho mỗi Socket.IO connection
- Multiple authentication methods: cookies, headers, query params
- User validation against database

### CORS
- Strict CORS policy cho Socket.IO
- Whitelist specific domains only
- Credentials support for cookie-based auth

### Rate Limiting
- Implement rate limiting cho Socket.IO events nếu cần
- Monitor for spam/abuse patterns

---

## 🎯 Quick Start Checklist

### Development
- [ ] API server chạy trên port 3000
- [ ] Frontend chạy với proxy config
- [ ] Socket.IO connection thành công
- [ ] Chat features hoạt động
- [ ] Notifications hiển thị

### Production  
- [ ] Code deployed và build thành công
- [ ] Environment variables cập nhật
- [ ] Nginx có Socket.IO proxy config
- [ ] Services restart thành công
- [ ] Realtime features test OK

**Happy coding! 🚀**