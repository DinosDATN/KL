# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG CHAT AI VỚI SQL QUERY

## Tổng quan

Hệ thống ChatAI đã được nâng cấp với khả năng query database thông qua SQL. Hệ thống tự động quyết định khi nào cần query database và khi nào chỉ cần trả lời bằng AI thông thường.

## Kiến trúc hệ thống

```
User question
   ↓
Frontend (Angular)
   ↓
Node.js backend
   ↓
[Decision Layer] - Phân tích câu hỏi có cần query DB không?
   ↓
   ├─→ Cần query DB → Python AI Service
   │      ↓
   │   GPT sinh SQL (với schema context)
   │      ↓
   │   Python trả SQL về Node.js
   │      ↓
   │   Node.js validate SQL (chỉ SELECT, check permissions)
   │      ↓
   │   Node.js chạy SQL vào database
   │      ↓
   │   Node.js format kết quả → GPT format lại câu trả lời
   │      ↓
   │   Trả về Frontend
   │
   └─→ Không cần query DB → Python AI Service
          ↓
       GPT trả lời trực tiếp
          ↓
       Trả về Frontend
```

## Các component chính

### 1. Python AI Service (`ai/service.py`)

**Tính năng:**
- **Decision Layer**: Tự động quyết định câu hỏi có cần query database không
- **SQL Generation**: Sinh SQL query từ câu hỏi tiếng Việt với schema context
- **Answer Formatting**: Format lại câu trả lời từ kết quả query

**Endpoints:**
- `POST /ask` - Xử lý câu hỏi với decision layer
- `POST /format-answer` - Format câu trả lời từ query result
- `GET /health` - Health check

### 2. Node.js Services

#### SQL Validator (`api/src/services/sqlValidator.js`)
- Chỉ cho phép SELECT queries
- Chặn các lệnh nguy hiểm (DROP, DELETE, UPDATE, INSERT, etc.)
- Tự động thêm LIMIT nếu chưa có
- Giới hạn LIMIT tối đa 1000 rows

#### SQL Executor (`api/src/services/sqlExecutor.js`)
- Thực thi SQL queries an toàn
- Timeout protection (10 seconds default)
- Giới hạn số rows trả về
- Format kết quả thành text hoặc JSON

#### Database Schema Service (`api/src/services/databaseSchemaService.js`)
- Lấy database schema từ MySQL
- Cung cấp schema dưới dạng text hoặc JSON
- Cache schema để tối ưu hiệu năng

### 3. Node.js Controller (`api/src/controllers/chatAIController.js`)

**Tính năng:**
- Xử lý request từ frontend
- Gọi Python AI service
- Validate và execute SQL nếu cần
- Format và trả về kết quả

**Endpoints:**
- `POST /api/v1/chat-ai/ask` - Gửi câu hỏi
- `GET /api/v1/chat-ai/schema` - Lấy database schema
- `GET /api/v1/chat-ai/health` - Health check

## Bảo mật

### SQL Validation
- ✅ Chỉ cho phép SELECT queries
- ✅ Chặn các lệnh nguy hiểm: DROP, DELETE, UPDATE, INSERT, ALTER, TRUNCATE, etc.
- ✅ Tự động thêm LIMIT để giới hạn kết quả
- ✅ Timeout protection (10 seconds)
- ✅ Giới hạn tối đa 1000 rows

### Error Handling
- Fallback về AI answer nếu SQL execution fails
- Logging đầy đủ để monitoring
- User-friendly error messages

## Cách sử dụng

### 1. Cấu hình Environment Variables

**Python Service (`ai/.env`):**
```bash
OPENROUTER_API_KEY=your-openrouter-api-key
NODE_API_URL=http://localhost:3000
HOST=0.0.0.0
PORT=8000
```

**Node.js API (`.env`):**
```bash
PYTHON_AI_API_URL=http://localhost:8000
DB_HOST=localhost
DB_NAME=lfysdb
DB_USER=api_user
DB_PASSWORD=api_password
```

### 2. Khởi động services

**Python AI Service:**
```bash
cd ai
pip install -r requirements.txt
python start.py
```

**Node.js API:**
```bash
cd api
npm install
npm start
```

### 3. Test hệ thống

**Test câu hỏi cần query DB:**
```bash
curl -X POST http://localhost:3000/api/v1/chat-ai/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Có những khóa học nào?"}'
```

**Test câu hỏi không cần query DB:**
```bash
curl -X POST http://localhost:3000/api/v1/chat-ai/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Python là gì?"}'
```

**Lấy database schema:**
```bash
curl http://localhost:3000/api/v1/chat-ai/schema
```

## Ví dụ câu hỏi

### Câu hỏi cần query DB:
- ✅ "Có những khóa học nào?"
- ✅ "Có bao nhiêu bài tập khó?"
- ✅ "Hiển thị danh sách tài liệu mới nhất"
- ✅ "Top 10 khóa học có rating cao nhất"
- ✅ "Thống kê số lượng người dùng"

### Câu hỏi không cần query DB:
- ✅ "Python là gì?"
- ✅ "Làm thế nào để học lập trình?"
- ✅ "Giải thích về thuật toán quicksort"
- ✅ "Cách debug code hiệu quả?"

## Response Format

### Khi có SQL query:
```json
{
  "success": true,
  "data": {
    "answer": "Dựa trên dữ liệu từ hệ thống, có 15 khóa học...",
    "data_source": "database",
    "query_info": {
      "type": "select",
      "generated": true
    },
    "raw_data": [...],
    "suggestions": [...]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Khi không có SQL query:
```json
{
  "success": true,
  "data": {
    "answer": "Python là một ngôn ngữ lập trình...",
    "data_source": "ai",
    "suggestions": [...]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Troubleshooting

### Python service không kết nối được Node.js API
- Kiểm tra `NODE_API_URL` trong `.env`
- Đảm bảo Node.js API đang chạy
- Kiểm tra CORS settings

### SQL validation fails
- Kiểm tra SQL có bắt đầu bằng SELECT không
- Đảm bảo không có các lệnh nguy hiểm
- Kiểm tra schema có đúng không

### Schema không được load
- Kiểm tra database connection
- Kiểm tra quyền truy cập INFORMATION_SCHEMA
- Xem logs trong `databaseSchemaService.js`

## Best Practices

1. **Câu hỏi rõ ràng**: Câu hỏi càng rõ ràng, SQL càng chính xác
2. **Giới hạn kết quả**: Luôn có LIMIT trong SQL để tránh query quá lớn
3. **Error handling**: Luôn có fallback về AI answer nếu SQL fails
4. **Monitoring**: Log tất cả SQL queries để monitoring và debugging
5. **Security**: Không bao giờ cho phép user input trực tiếp vào SQL

## Tương lai

- [ ] Caching query results
- [ ] Query optimization
- [ ] Multi-language support
- [ ] Advanced analytics queries
- [ ] Query history và learning

