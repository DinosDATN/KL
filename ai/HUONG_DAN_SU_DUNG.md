# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG CHAT AI

## Tổng quan
Hệ thống ChatAI đã được nâng cấp với khả năng truy vấn thông minh vào cơ sở dữ liệu, có thể trả lời các câu hỏi về:
- **Khóa học (Courses)**: Thông tin về các khóa học, giảng viên, rating, giá cả
- **Bài tập (Problems)**: Các bài tập lập trình, độ khó, tỷ lệ AC
- **Tài liệu (Documents)**: Tài liệu học tập, hướng dẫn, tutorial
- **Cuộc thi (Contests)**: Các cuộc thi, competition, thời gian diễn ra

## Cấu trúc hệ thống

### 1. Các file chính
```
ai/
├── service.py              # API chính (đã nâng cấp)
├── database_service.py     # Service truy vấn database an toàn
├── query_parser.py         # Parser phân tích câu hỏi
├── sql_query_builder.py    # Builder tạo SQL query
└── HUONG_DAN_SU_DUNG.md   # File này
```

### 2. Luồng xử lý
```
Câu hỏi người dùng 
    ↓
QueryParser (phân tích intent)
    ↓
DatabaseService (truy vấn an toàn)
    ↓
SQLQueryBuilder (format kết quả)
    ↓
ChatAI (tạo câu trả lời thông minh)
    ↓
Phản hồi cho người dùng
```

## Các tính năng mới

### 1. Truy vấn thông minh
Hệ thống có thể hiểu và xử lý các câu hỏi phức tạp:

#### Ví dụ về khóa học:
```
✅ "Có những khóa học nâng cao nào?"
✅ "Khóa học Python cho người mới bắt đầu"
✅ "Khóa học nào có rating cao nhất?"
✅ "Những khóa học miễn phí về web development"
```

#### Ví dụ về bài tập:
```
✅ "Bài tập dễ để luyện thuật toán"
✅ "Problems có tỷ lệ AC cao"
✅ "Bài tập khó về cấu trúc dữ liệu"
✅ "Tìm bài tập về sorting"
```

#### Ví dụ về tài liệu:
```
✅ "Tài liệu học React cơ bản"
✅ "Hướng dẫn về database design"
✅ "Documents về machine learning"
```

#### Ví dụ về cuộc thi:
```
✅ "Cuộc thi nào đang diễn ra?"
✅ "Contest sắp tới có gì?"
✅ "Lịch sử các cuộc thi programming"
```

### 2. Bộ lọc thông minh
Hệ thống hỗ trợ các bộ lọc:

- **Level/Độ khó**: Beginner, Intermediate, Advanced / Easy, Medium, Hard
- **Status**: Published, Ongoing, Upcoming, Finished
- **Premium**: Miễn phí hoặc trả phí
- **Rating**: Đánh giá từ 1-5 sao

### 3. Tìm kiếm tổng hợp
```
✅ "Tìm kiếm Python"
✅ "Tất cả về React"
✅ "Search algorithm"
```

### 4. Thống kê tổng quan
```
✅ "Thống kê hệ thống"
✅ "Có bao nhiêu khóa học?"
✅ "Stats về bài tập"
```

## API Endpoints

### 1. Chat chính - `/ask` (POST)
```json
{
    "question": "Có khóa học Python nào không?"
}
```

**Response:**
```json
{
    "answer": "Có, hiện tại hệ thống có 5 khóa học Python...",
    "data_source": "database",
    "query_info": {
        "intent": "database_query",
        "query_types": ["courses"],
        "filters_applied": {"level": "Beginner"}
    },
    "suggestions": [
        "Khóa học Python nâng cao có gì?",
        "Bài tập Python để thực hành?",
        "Tài liệu Python miễn phí?"
    ],
    "raw_data": {...}
}
```

### 2. Health Check - `/health` (GET)
```json
{
    "status": "healthy",
    "database": "connected",
    "services": {
        "query_parser": "active",
        "sql_builder": "active", 
        "ai_client": "active"
    }
}
```

### 3. Thống kê - `/stats` (GET)
```json
{
    "statistics": {
        "courses": {"total": 150, "average_rating": 4.2},
        "problems": {"total": 300, "average_acceptance": 65.5},
        "documents": {"total": 200, "average_rating": 4.0},
        "contests": {"total": 25}
    },
    "status": "success"
}
```

## Cấu hình

### 1. Database
File `database_service.py` chứa cấu hình kết nối:
```python
self.db_config = {
    'host': 'localhost',
    'user': 'api_user', 
    'password': 'api_password',
    'database': 'lfysdb',
    'charset': 'utf8mb4'
}
```

### 2. AI Model
File `service.py` sử dụng OpenRouter:
```python
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY")
)
```

## Bảo mật

### 1. SQL Injection Prevention
- Sử dụng parameterized queries
- Whitelist các bảng và cột được phép
- Giới hạn số lượng kết quả

### 2. Access Control
- Chỉ cho phép truy vấn 4 bảng chính: Courses, Problems, Documents, Contests
- Không cho phép operation DELETE, INSERT, UPDATE
- Giới hạn độ sâu truy vấn

### 3. Rate Limiting
Khuyến nghị thêm rate limiting cho production:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/ask")
@limiter.limit("10/minute")
async def ask(request: ChatRequest):
    ...
```

## Troubleshooting

### 1. Lỗi kết nối database
**Triệu chứng:** "Database connection error"
**Giải pháp:**
- Kiểm tra MySQL service đang chạy
- Xác thực thông tin kết nối trong `database_service.py`
- Kiểm tra firewall và port 3306

### 2. Lỗi AI API
**Triệu chứng:** "Error calling AI"  
**Giải pháp:**
- Kiểm tra API key OpenRouter
- Xác nhận biến môi trường `OPENROUTER_API_KEY`
- Kiểm tra kết nối internet

### 3. Query không trả về kết quả
**Triệu chứng:** "Không tìm thấy dữ liệu"
**Giải pháp:**
- Kiểm tra dữ liệu trong database
- Xem logs để debug query được tạo
- Thử các từ khóa khác

### 4. Performance chậm
**Giải pháp:**
- Thêm indexes cho database
- Cache kết quả query phổ biến
- Giới hạn số lượng kết quả

## Monitoring và Logs

### 1. Logging
Hệ thống ghi log tại các điểm quan trọng:
```python
logger.info(f"Processing question: {question}")
logger.error(f"Database error: {e}")
```

### 2. Metrics
Theo dõi:
- Response time của API
- Số lượng query database
- Error rate của AI API
- Memory usage

### 3. Health Monitoring
Sử dụng endpoint `/health` để monitoring:
```bash
curl http://localhost:8000/health
```

## Phát triển thêm

### 1. Thêm bảng mới
1. Cập nhật `ALLOWED_TABLES` trong `database_service.py`
2. Thêm keywords trong `query_parser.py`
3. Thêm handler trong `sql_query_builder.py`

### 2. Thêm bộ lọc mới
1. Cập nhật `filter_patterns` trong `query_parser.py`
2. Thêm logic xử lý trong `_extract_filters()`
3. Cập nhật các method get_* trong `database_service.py`

### 3. Cải thiện AI
1. Thêm system prompt cụ thể cho từng domain
2. Fine-tune model cho domain lập trình
3. Thêm context memory cho conversation

## Testing

### 1. Unit Tests
```bash
# Test database service
python -m pytest tests/test_database_service.py

# Test query parser  
python -m pytest tests/test_query_parser.py

# Test SQL builder
python -m pytest tests/test_sql_builder.py
```

### 2. Integration Tests
```bash
# Test full workflow
python -m pytest tests/test_integration.py

# Test API endpoints
python -m pytest tests/test_api.py
```

### 3. Manual Testing
Sử dụng các câu hỏi mẫu để test:
```
1. "Khóa học Python cơ bản"
2. "Bài tập sorting dễ"
3. "Tài liệu về React" 
4. "Cuộc thi sắp tới"
5. "Thống kê hệ thống"
```

## Deployment

### 1. Production Setup
```bash
# Cài đặt dependencies
pip install -r requirements.txt

# Set environment variables
export OPENROUTER_API_KEY="your-key"
export DB_PASSWORD="production-password"

# Run with gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker service:app
```

### 2. Docker
```dockerfile
FROM python:3.9
COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt
CMD ["uvicorn", "service:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 3. Environment Variables
```bash
OPENROUTER_API_KEY=your-openrouter-key
DB_HOST=localhost
DB_USER=api_user
DB_PASSWORD=your-db-password
DB_NAME=lfysdb
LOG_LEVEL=INFO
```

---

## Liên hệ hỗ trợ
Nếu gặp vấn đề khi sử dụng, vui lòng:
1. Kiểm tra logs để xác định nguyên nhân
2. Thử restart service
3. Liên hệ team phát triển với thông tin logs

**Chúc bạn sử dụng thành công! 🚀**