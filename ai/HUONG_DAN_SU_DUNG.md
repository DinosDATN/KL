# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG CHAT AI

## Tổng quan
Hệ thống ChatAI đơn giản, chỉ sử dụng AI để trả lời các câu hỏi của người dùng về lập trình, thuật toán, công nghệ và các chủ đề liên quan.

## Cấu trúc hệ thống

### 1. Các file chính
```
ai/
├── service.py              # API chính - chỉ sử dụng AI
├── start.py                # Script khởi động server
├── requirements.txt        # Dependencies
└── HUONG_DAN_SU_DUNG.md   # File này
```

### 2. Luồng xử lý
```
Câu hỏi người dùng 
    ↓
ChatAIService (xử lý câu hỏi)
    ↓
OpenAI API (trả lời)
    ↓
Phản hồi cho người dùng
```

## Tính năng

### 1. Trả lời câu hỏi thông minh
Hệ thống có thể trả lời các câu hỏi về:
- Lập trình và ngôn ngữ lập trình
- Thuật toán và cấu trúc dữ liệu
- Công nghệ và framework
- Best practices và tips
- Debugging và troubleshooting
- Và nhiều chủ đề khác liên quan đến lập trình

### 2. Ví dụ câu hỏi
```
✅ "Python là gì?"
✅ "Làm thế nào để bắt đầu học lập trình?"
✅ "Giải thích về thuật toán quicksort"
✅ "Cách debug code hiệu quả?"
✅ "Sự khác biệt giữa REST và GraphQL?"
✅ "React hooks là gì?"
```

## API Endpoints

### 1. Chat chính - `/ask` (POST)
```json
{
    "question": "Python là gì?"
}
```

**Response:**
```json
{
    "answer": "Python là một ngôn ngữ lập trình cấp cao, được thiết kế với triết lý 'đọc được như tiếng Anh'...",
    "data_source": "ai"
}
```

### 2. Health Check - `/health` (GET)
```json
{
    "status": "healthy",
    "ai_client": "active",
    "message": "AI service is running"
}
```

## Cấu hình

### 1. Environment Variables
Tạo file `.env` trong thư mục `ai/`:
```bash
OPENROUTER_API_KEY=your-openrouter-api-key-here
HOST=0.0.0.0
PORT=8000
DEBUG=True
```

### 2. Lấy API Key
1. Đăng ký tài khoản tại: https://openrouter.ai/
2. Tạo API key tại: https://openrouter.ai/keys
3. Copy API key vào file `.env`

### 3. AI Model
Hệ thống sử dụng OpenRouter với model `gpt-4o-mini`:
- Model: gpt-4o-mini
- Temperature: 0.7
- Max tokens: 1000

## Cài đặt và Chạy

### 1. Cài đặt dependencies
```bash
cd ai
pip install -r requirements.txt
```

### 2. Cấu hình environment
```bash
# Tạo file .env
cp .env.example .env  # Nếu có file example
# Hoặc tạo file .env và thêm OPENROUTER_API_KEY
```

### 3. Chạy server
```bash
# Sử dụng script start.py
python start.py

# Hoặc chạy trực tiếp với uvicorn
uvicorn service:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Kiểm tra
```bash
# Health check
curl http://localhost:8000/health

# Test API
curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Python là gì?"}'
```

## Swagger UI
Sau khi chạy server, truy cập:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Troubleshooting

### 1. Lỗi API Key
**Triệu chứng:** "Error calling AI" hoặc "401 Unauthorized"  
**Giải pháp:**
- Kiểm tra `OPENROUTER_API_KEY` trong file `.env`
- Đảm bảo API key hợp lệ và còn credit
- Kiểm tra kết nối internet

### 2. Lỗi import module
**Triệu chứng:** "ModuleNotFoundError"  
**Giải pháp:**
```bash
pip install -r requirements.txt
```

### 3. Port đã được sử dụng
**Triệu chứng:** "Address already in use"  
**Giải pháp:**
- Thay đổi PORT trong file `.env`
- Hoặc kill process đang sử dụng port đó

### 4. Response chậm
**Giải pháp:**
- Kiểm tra kết nối internet
- Model `gpt-4o-mini` thường nhanh, nếu chậm có thể do network
- Có thể giảm `max_tokens` trong `service.py` để tăng tốc

## Tùy chỉnh

### 1. Thay đổi model
Trong file `service.py`, thay đổi:
```python
completion = client.chat.completions.create(
    model="gpt-4o-mini",  # Thay đổi model ở đây
    ...
)
```

Các model khác có thể dùng:
- `gpt-4o-mini` (mặc định, nhanh và rẻ)
- `gpt-4o` (chất lượng cao hơn)
- `claude-3-haiku` (từ Anthropic)
- Xem thêm tại: https://openrouter.ai/models

### 2. Thay đổi temperature
```python
temperature=0.7,  # 0.0 = deterministic, 1.0 = creative
```

### 3. Thay đổi max_tokens
```python
max_tokens=1000,  # Tăng để có câu trả lời dài hơn
```

### 4. Thay đổi system prompt
Trong file `service.py`, chỉnh sửa `system` message:
```python
"role": "system", 
"content": (
    "Bạn là trợ lý AI hỗ trợ người học lập trình, nói tiếng Việt. "
    # Thêm hoặc chỉnh sửa prompt ở đây
)
```

## Production Deployment

### 1. Sử dụng Gunicorn
```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker service:app --bind 0.0.0.0:8000
```

### 2. Docker
Tạo file `Dockerfile`:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "service:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build và chạy:
```bash
docker build -t chat-ai .
docker run -p 8000:8000 --env-file .env chat-ai
```

### 3. Environment Variables cho Production
```bash
OPENROUTER_API_KEY=your-production-key
HOST=0.0.0.0
PORT=8000
DEBUG=False
LOG_LEVEL=INFO
```

## Rate Limiting (Khuyến nghị)

Để tránh lạm dụng, nên thêm rate limiting:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/ask")
@limiter.limit("10/minute")
async def ask(request: ChatRequest):
    ...
```

## Monitoring

### 1. Logging
Hệ thống tự động log các lỗi và thông tin quan trọng:
```python
logger.info(f"Processing question: {question}")
logger.error(f"Error: {e}")
```

### 2. Health Check
Sử dụng endpoint `/health` để monitoring:
```bash
curl http://localhost:8000/health
```

## Bảo mật

### 1. API Key
- **KHÔNG** commit file `.env` vào git
- Thêm `.env` vào `.gitignore`
- Sử dụng environment variables trong production

### 2. Rate Limiting
- Thêm rate limiting để tránh lạm dụng
- Giới hạn số request per minute/user

### 3. Input Validation
- Hệ thống tự động validate input qua Pydantic
- Giới hạn độ dài câu hỏi nếu cần

## Testing

### 1. Manual Testing
Sử dụng Swagger UI hoặc curl:
```bash
curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Test question"}'
```

### 2. Unit Tests (nếu cần)
```python
# test_service.py
import pytest
from service import ChatAIService

def test_process_question():
    service = ChatAIService()
    result = service.process_question("Test")
    assert "answer" in result
```

---

## Liên hệ hỗ trợ
Nếu gặp vấn đề khi sử dụng, vui lòng:
1. Kiểm tra logs để xác định nguyên nhân
2. Thử restart service
3. Kiểm tra API key và kết nối internet

**Chúc bạn sử dụng thành công! 🚀**
