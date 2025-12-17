# 🔧 KHẮC PHỤC GOOGLE OAUTH LỖI `oauth_failed`

## Vấn đề hiện tại
URL: `https://pdkhang.online/auth/login?error=oauth_failed`

## Nguyên nhân có thể

### 1. **Google Cloud Console Configuration**
- ❌ Authorized JavaScript origins chưa có domain production
- ❌ Authorized redirect URIs chưa đúng
- ❌ OAuth consent screen chưa setup

### 2. **Environment Variables**
- ❌ `GOOGLE_CALLBACK_URL` chưa đúng cho production
- ❌ `CLIENT_URL` chưa đúng
- ❌ `COOKIE_DOMAIN` settings sai

### 3. **HTTPS/HTTP Issues**
- ❌ Mixed content (HTTP callback trong HTTPS site)
- ❌ Cookie secure settings

## 🚀 CÁCH KHẮC PHỤC

### Bước 1: Kiểm tra cấu hình hiện tại

```bash
# Trên production server
cd /path/to/your/project
node debug-google-oauth.js
```

### Bước 2: Cập nhật Google Cloud Console

1. **Truy cập:** https://console.cloud.google.com/
2. **Chọn project** của bạn
3. **APIs & Services > Credentials**
4. **Chọn OAuth 2.0 Client ID** của bạn

**Cập nhật Authorized JavaScript origins:**
```
https://pdkhang.online
https://www.pdkhang.online
```

**Cập nhật Authorized redirect URIs:**
```
https://pdkhang.online/api/v1/auth/google/callback
https://www.pdkhang.online/api/v1/auth/google/callback
```

### Bước 3: Cập nhật file .env production

```bash
# Backup file .env hiện tại
cp api/.env api/.env.backup.$(date +%Y%m%d_%H%M%S)

# Chỉnh sửa file .env
nano api/.env
```

**Cập nhật các dòng sau:**

```env
# Environment
NODE_ENV=production

# URLs
CLIENT_URL=https://pdkhang.online
GOOGLE_CALLBACK_URL=https://pdkhang.online/api/v1/auth/google/callback

# Google OAuth (GIỮ NGUYÊN CLIENT_ID và SECRET)
GOOGLE_CLIENT_ID=your_existing_client_id
GOOGLE_CLIENT_SECRET=your_existing_client_secret

# Cookie settings cho production
COOKIE_DOMAIN=pdkhang.online
COOKIE_SECURE=true

# CORS
CORS_ORIGIN=https://pdkhang.online,https://www.pdkhang.online
```

### Bước 4: Kiểm tra OAuth Consent Screen

1. **APIs & Services > OAuth consent screen**
2. **Authorized domains:** Thêm `pdkhang.online`
3. **Scopes:** Đảm bảo có `email`, `profile`, `openid`

### Bước 5: Test cấu hình

```bash
# Test API endpoint
curl -I https://pdkhang.online/api/v1/auth/google

# Nên trả về redirect 302 đến Google
```

### Bước 6: Restart services

```bash
# Restart API server
pm2 restart ecosystem.config.js

# Reload Nginx (nếu cần)
sudo systemctl reload nginx
```

### Bước 7: Test OAuth flow

1. **Truy cập:** https://pdkhang.online/auth/login
2. **Click "Login with Google"**
3. **Kiểm tra redirect đến Google**
4. **Authorize và kiểm tra redirect về**

## 🔍 DEBUG STEPS

### Kiểm tra logs

```bash
# API server logs
pm2 logs | grep -i google

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# Specific OAuth logs
pm2 logs | grep -i oauth
```

### Test từng bước

```bash
# 1. Test health endpoint
curl https://pdkhang.online/api/v1/health

# 2. Test Google OAuth initiate
curl -I https://pdkhang.online/api/v1/auth/google

# 3. Test callback endpoint (sẽ fail nhưng kiểm tra có accessible không)
curl -I https://pdkhang.online/api/v1/auth/google/callback
```

## 🚨 COMMON ERRORS & FIXES

### Error: `redirect_uri_mismatch`
```
❌ Callback URL trong code khác với Google Console
✅ Đảm bảo GOOGLE_CALLBACK_URL giống hệt trong Google Console
```

### Error: `unauthorized_client`
```
❌ Client ID sai hoặc app chưa được approve
✅ Kiểm tra GOOGLE_CLIENT_ID và OAuth consent screen
```

### Error: `access_denied`
```
❌ User từ chối authorize hoặc app chưa được trust
✅ Kiểm tra OAuth consent screen và scopes
```

### Error: Cookie không set được
```
❌ COOKIE_DOMAIN hoặc COOKIE_SECURE settings sai
✅ COOKIE_DOMAIN=pdkhang.online, COOKIE_SECURE=true
```

## 📋 CHECKLIST

- [ ] Google Cloud Console có đúng origins và redirect URIs
- [ ] File .env có đúng GOOGLE_CALLBACK_URL
- [ ] CLIENT_URL đúng domain production
- [ ] COOKIE_DOMAIN và COOKIE_SECURE đúng
- [ ] OAuth consent screen đã setup
- [ ] PM2 đã restart
- [ ] Logs không có lỗi
- [ ] Test OAuth flow thành công

## 🎯 QUICK FIX

Nếu vẫn lỗi, thử cách nhanh này:

```bash
# 1. Kiểm tra environment
node debug-google-oauth.js

# 2. Restart với logs
pm2 restart ecosystem.config.js --log

# 3. Test ngay
curl -I https://pdkhang.online/api/v1/auth/google

# 4. Kiểm tra logs realtime
pm2 logs --lines 50
```

Sau khi làm theo các bước trên, Google OAuth sẽ hoạt động bình thường! 🎉