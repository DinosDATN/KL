# ChatAI Integration Guide

## Tổng quan

Hệ thống ChatAI đã được tích hợp hoàn chỉnh vào dự án với các thành phần sau:

1. **Python AI API** - Server AI xử lý câu hỏi (đã có sẵn)
2. **Node.js Backend API** - Middleware kết nối giữa frontend và Python AI
3. **Angular Frontend Widget** - Giao diện chat đẹp với dark/light mode support

## Cấu trúc Files

### Backend (Node.js)
```
api/
├── src/routes/chatAIRoutes.js          # API routes cho ChatAI
└── .env.example                        # Cấu hình environment (đã thêm PYTHON_AI_API_URL)
```

### Frontend (Angular)
```
cli/src/app/
├── core/
│   ├── models/ai.model.ts              # Models cho ChatAI (đã mở rộng)
│   └── services/chat-ai.service.ts     # Service xử lý ChatAI
├── shared/components/chat-ai-widget/
│   ├── chat-ai-widget.component.ts     # Component logic
│   ├── chat-ai-widget.component.html   # Template với interface đẹp
│   └── chat-ai-widget.component.css    # Styling với dark/light mode
├── app.component.ts                    # Đã import ChatAI widget
└── app.component.html                  # Đã thêm widget tag
```

## Cài đặt và Cấu hình

### 1. Backend Setup

#### Cập nhật environment file:
```bash
cd api
cp .env.example .env
```

Thêm vào `.env`:
```
PYTHON_AI_API_URL=http://localhost:8000
```

#### Khởi động services:
```bash
# Terminal 1: Python AI API
cd ai
python start.py

# Terminal 2: Node.js Backend
cd api
npm run dev

# Terminal 3: Angular Frontend
cd cli
ng serve
```

### 2. API Endpoints

#### Node.js Backend (http://localhost:3000/api/v1/chat-ai)

- `POST /ask` - Gửi câu hỏi cho AI
- `GET /health` - Kiểm tra trạng thái AI service
- `GET /stats` - Lấy thống kê từ AI service

#### Example Request:
```javascript
// POST /api/v1/chat-ai/ask
{
  "question": "Có khóa học Python nào không?"
}

// Response
{
  "success": true,
  "data": {
    "answer": "Có, hiện tại hệ thống có 5 khóa học Python...",
    "data_source": "database",
    "suggestions": [
      "Khóa học Python nâng cao có gì?",
      "Bài tập Python để thực hành?"
    ]
  },
  "timestamp": "2024-..."
}
```

## Tính năng ChatAI Widget

### 1. Interface Features
- **Floating Icon**: Icon chat đẹp ở góc phải màn hình
- **Chat Window**: Pop-up 380x500px với interface hiện đại
- **Dark/Light Mode**: Tự động detect và hỗ trợ cả hai chế độ
- **Responsive**: Tối ưu cho cả desktop và mobile
- **Quick Questions**: Gợi ý câu hỏi nhanh cho người dùng mới

### 2. User Experience
- **Real-time Typing**: Hiển thị typing indicator khi AI đang trả lời
- **Message History**: Lưu lịch sử chat trong session
- **Auto-scroll**: Tự động scroll xuống message mới
- **Export Chat**: Xuất lịch sử chat ra file text
- **Character Limit**: Giới hạn 1000 ký tự với warning

### 3. Error Handling
- **Connection Error**: Hiển thị lỗi khi không kết nối được AI
- **Timeout**: Xử lý timeout requests
- **Validation**: Validate input trước khi gửi
- **Retry**: Tự động retry 1 lần khi lỗi

## Customization

### 1. Styling
Widget sử dụng CSS custom với support:
- CSS Variables cho theme switching
- Media queries cho responsive
- Prefers-color-scheme cho dark mode
- Prefers-reduced-motion cho accessibility

### 2. Quick Questions
Có thể tùy chỉnh câu hỏi gợi ý trong `chat-ai.service.ts`:
```typescript
getQuickQuestions(): string[] {
  return [
    'Có những khóa học nào?',
    'Bài tập dễ để luyện tập?',
    // Thêm câu hỏi mới ở đây
  ];
}
```

### 3. Position & Size
Tùy chỉnh vị trí và kích thước trong CSS:
```css
/* Desktop positioning */
.chat-ai-widget.desktop {
  bottom: 24px;  /* Thay đổi vị trí */
  right: 24px;   /* Thay đổi vị trí */
}

/* Widget size */
.chat-window {
  width: 380px;  /* Thay đổi độ rộng */
  height: 500px; /* Thay đổi độ cao */
}
```

## Testing

### 1. Manual Testing
1. Mở website bất kỳ
2. Click vào icon ChatAI ở góc phải
3. Test các tính năng:
   - Gửi tin nhắn
   - Click quick questions
   - Toggle dark/light mode
   - Resize window (responsive)
   - Export chat history

### 2. API Testing
```bash
# Test health endpoint
curl http://localhost:3000/api/v1/chat-ai/health

# Test ask endpoint
curl -X POST http://localhost:3000/api/v1/chat-ai/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Xin chào"}'
```

## Troubleshooting

### 1. Widget không hiển thị
- Check console có lỗi import không
- Kiểm tra `app.component.html` đã thêm `<app-chat-ai-widget>`
- Verify CSS classes được load

### 2. API không hoạt động
- Kiểm tra Python AI server đang chạy (port 8000)
- Kiểm tra Node.js backend đang chạy (port 3000)  
- Check environment variable `PYTHON_AI_API_URL`

### 3. Styling issues
- Kiểm tra Tailwind CSS đang hoạt động
- Verify CSS classes conflict
- Check dark mode detection

### 4. Mobile issues
- Test responsive breakpoints
- Check touch events
- Verify mobile-specific CSS

## Performance

### 1. Optimization
- Lazy loading: Widget chỉ init khi cần
- Debounced input: Tránh spam requests
- Memory management: Cleanup subscriptions
- Bundle size: Standalone component, không ảnh hưởng main bundle

### 2. Monitoring
- API response time
- Error rates
- User engagement metrics
- Chat completion rates

## Security

### 1. Input Validation
- Character limits (1000 chars)
- XSS protection via Angular sanitizer
- SQL injection protection (parameterized queries)

### 2. Rate Limiting
Khuyến nghị thêm rate limiting:
```javascript
// Trong chatAIRoutes.js
const rateLimit = require('express-rate-limit');

const chatLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many chat requests'
});

router.post('/ask', chatLimit, async (req, res) => {
  // ...
});
```

## Future Enhancements

### 1. Planned Features
- [ ] Voice input/output
- [ ] File upload support
- [ ] Chat history persistence
- [ ] User preferences
- [ ] Multi-language support

### 2. Technical Improvements
- [ ] WebSocket for real-time communication
- [ ] AI response streaming
- [ ] Offline support
- [ ] PWA notifications

## Support

### 1. Logs
- Backend: Check Node.js console
- Frontend: Check browser DevTools
- AI Service: Check Python logs

### 2. Debug Mode
Enable trong `environment.ts`:
```typescript
export const environment = {
  production: false,
  enableLogging: true  // Chi tiết logs
};
```

### 3. Health Checks
- Backend: `GET /health`
- AI Service: `GET /api/v1/chat-ai/health`
- Frontend: Click "Trạng thái: Hoạt động" trong chat footer

---

## Kết luận

ChatAI widget đã được tích hợp thành công với:
✅ API backend hoàn chỉnh  
✅ Frontend service với error handling  
✅ Beautiful UI/UX với dark/light mode  
✅ Responsive design cho mobile  
✅ Accessibility support  
✅ Performance optimized  

Widget sẽ hiển thị trên mọi trang của website và sẵn sàng phục vụ người dùng!

Chúc bạn sử dụng thành công! 🚀