# Hướng dẫn Setup Email cho Contact Form

## 1. Cài đặt Dependencies

Trong thư mục `api/`, chạy:
```bash
npm install nodemailer
```

## 2. Cấu hình Email trong .env

Cập nhật file `api/.env`:
```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=admin@l-fys.com
FRONTEND_URL=https://pdkhang.online
```

## 3. Setup Gmail App Password

### Bước 1: Bật 2-Factor Authentication
1. Đi đến [Google Account Security](https://myaccount.google.com/security)
2. Bật "2-Step Verification"

### Bước 2: Tạo App Password
1. Trong Security settings, tìm "App passwords"
2. Chọn "Mail" và "Other (custom name)"
3. Nhập "L-FYS Contact Form"
4. Copy password được tạo

### Bước 3: Cập nhật .env
```env
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=generated-app-password
```

## 4. Alternative Email Providers

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### Custom SMTP
```env
SMTP_HOST=mail.your-domain.com
SMTP_PORT=587
SMTP_USER=noreply@your-domain.com
SMTP_PASS=your-password
```

## 5. Test Email Configuration

### API Endpoint
```bash
GET /api/v1/contact/test
```

### Response
```json
{
  "success": true,
  "message": "Email configuration is working correctly"
}
```

## 6. Contact Form API

### Endpoint
```bash
POST /api/v1/contact
```

### Request Body
```json
{
  "name": "Nguyễn Văn A",
  "email": "user@example.com",
  "subject": "Câu hỏi về khóa học",
  "message": "Tôi muốn hỏi về...",
  "category": "course"
}
```

### Response Success
```json
{
  "success": true,
  "message": "Tin nhắn đã được gửi thành công! Chúng tôi sẽ phản hồi trong vòng 24 giờ."
}
```

### Response Error
```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "errors": [
    {
      "msg": "Email không hợp lệ",
      "param": "email"
    }
  ]
}
```

## 7. Rate Limiting

- **Limit:** 5 requests per 15 minutes per IP
- **Purpose:** Prevent spam và abuse
- **Error:** 429 Too Many Requests

## 8. Email Templates

### Admin Email
- **To:** ADMIN_EMAIL
- **Subject:** [Category] Subject
- **Content:** Formatted contact info + message

### User Auto-Reply
- **To:** User's email
- **Subject:** Xác nhận đã nhận tin nhắn - L-FYS
- **Content:** Confirmation + helpful links

## 9. Security Features

### Input Validation
- Name: 2-100 characters
- Email: Valid email format
- Subject: 5-200 characters
- Message: 10-2000 characters
- Category: Predefined values only

### Sanitization
- HTML escaping
- Email normalization
- Trim whitespace

### Rate Limiting
- IP-based limiting
- Configurable windows
- Error messages

## 10. Troubleshooting

### Common Issues

#### "EAUTH" Error
- Check SMTP credentials
- Verify app password
- Ensure 2FA is enabled

#### "ECONNECTION" Error
- Check SMTP host/port
- Verify firewall settings
- Test network connectivity

#### "Invalid Email" Error
- Check email format validation
- Verify email normalization

### Debug Mode
Set `LOG_LEVEL=debug` in .env to see detailed logs.

## 11. Production Considerations

### Email Delivery
- Use professional email service (SendGrid, Mailgun)
- Setup SPF, DKIM, DMARC records
- Monitor delivery rates

### Performance
- Queue emails for high volume
- Use background jobs
- Implement retry logic

### Monitoring
- Log all email attempts
- Track delivery status
- Monitor error rates

## 12. Frontend Integration

### Service Usage
```typescript
this.contactService.sendContactForm(formData).subscribe({
  next: (response) => {
    // Handle success
  },
  error: (error) => {
    // Handle error
  }
});
```

### Error Handling
- Validation errors (400)
- Rate limiting (429)
- Server errors (500)
- Network errors

## 13. Testing

### Manual Testing
1. Fill out contact form
2. Check admin email inbox
3. Check user email for auto-reply
4. Verify email content formatting

### Automated Testing
```bash
# Test email config
curl -X GET http://localhost:3000/api/v1/contact/test

# Test contact form
curl -X POST http://localhost:3000/api/v1/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","subject":"Test","message":"Test message","category":"general"}'
```