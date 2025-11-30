# DEBUG CONVERSATION HISTORY

## Vấn đề
Conversation history không hoạt động - AI không nhớ các câu hỏi và câu trả lời trước đó.

## Các điểm đã kiểm tra và sửa

### 1. Frontend (Angular)
**File:** `cli/src/app/core/services/chat-ai.service.ts`

**Đã thêm:**
- Logging chi tiết để debug conversation history
- Log tất cả messages trong state
- Log conversation history được chuẩn bị
- Log request payload gửi đi

**Cách kiểm tra:**
1. Mở Developer Console trong browser (F12)
2. Gửi câu hỏi trong chat widget
3. Xem logs với prefix `[ChatAI]`
4. Kiểm tra xem `conversation_history` có được gửi đi không

### 2. Node.js Backend
**File:** `api/src/controllers/chatAIController.js`

**Đã thêm:**
- Log raw conversation_history từ request
- Log processed conversation_history
- Log khi gửi đến Python service

**Cách kiểm tra:**
1. Xem logs của Node.js server
2. Tìm logs với prefix `[ChatAI]` hoặc `[ChatAI Stream]`
3. Kiểm tra xem conversation_history có được nhận và xử lý không

### 3. Python AI Service
**File:** `ai/service.py`

**Đã thêm:**
- Log khi nhận conversation_history trong `/ask` endpoint
- Log khi nhận conversation_history trong `/format-answer` endpoint
- Log chi tiết trong `_call_ai_with_history` function
- Log số lượng messages được thêm vào GPT request
- Log structure của messages gửi đến GPT

**Cách kiểm tra:**
1. Xem logs của Python service
2. Tìm logs với prefix `[/ask]`, `[/format-answer]`, hoặc `[_call_ai_with_history]`
3. Kiểm tra xem conversation_history có được xử lý đúng không

## Cách test

### Test 1: Sử dụng test script
```bash
cd ai
python test_conversation_history.py
```

Script này sẽ:
1. Gửi câu hỏi "Tên tôi là Nam"
2. Gửi câu hỏi "Tên tôi là gì?" với history từ câu 1
3. Gửi câu hỏi "Tôi thích học Python" với history từ câu 1 và 2
4. Gửi câu hỏi "Tóm tắt lại thông tin về tôi" với tất cả history
5. Kiểm tra xem AI có nhớ tên và sở thích không

### Test 2: Sử dụng curl
```bash
# Câu hỏi 1
curl -X POST http://localhost:3000/api/v1/chat-ai/ask-stream \
  -H "Content-Type: application/json" \
  -d '{"question": "Tên tôi là Nam"}'

# Câu hỏi 2 với history
curl -X POST http://localhost:3000/api/v1/chat-ai/ask-stream \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Tên tôi là gì?",
    "conversation_history": [
      {"role": "user", "content": "Tên tôi là Nam"},
      {"role": "assistant", "content": "Xin chào Nam! Rất vui được làm quen với bạn."}
    ]
  }'
```

### Test 3: Sử dụng frontend
1. Mở chat widget
2. Gửi câu hỏi: "Tên tôi là Nam"
3. Đợi response
4. Gửi câu hỏi: "Tên tôi là gì?"
5. Kiểm tra xem AI có trả lời "Nam" không

## Các vấn đề có thể gặp

### 1. Frontend không gửi conversation_history
**Triệu chứng:** Logs trong browser console không hiển thị conversation_history

**Nguyên nhân:**
- Messages trong state không đúng format
- Filter loại bỏ tất cả messages
- Mapping role không đúng

**Giải pháp:**
- Kiểm tra `messagesSubject.value` trong console
- Kiểm tra filter condition
- Kiểm tra mapping logic

### 2. Node.js không nhận được conversation_history
**Triệu chứng:** Logs trong Node.js hiển thị "No conversation history"

**Nguyên nhân:**
- Request body không có field `conversation_history`
- Field bị undefined hoặc null
- Content-Type header không đúng

**Giải pháp:**
- Kiểm tra request payload trong browser Network tab
- Kiểm tra `req.body.conversation_history` trong Node.js
- Đảm bảo Content-Type là `application/json`

### 3. Python không nhận được conversation_history
**Triệu chứng:** Logs trong Python hiển thị "No conversation_history in request"

**Nguyên nhân:**
- Node.js không gửi conversation_history đến Python
- Format không đúng với Pydantic model
- Field name không match

**Giải pháp:**
- Kiểm tra request body gửi từ Node.js đến Python
- Kiểm tra Pydantic model `ChatRequest` và `FormatAnswerRequest`
- Đảm bảo field name là `conversation_history` (snake_case)

### 4. GPT không sử dụng conversation_history
**Triệu chứng:** Logs hiển thị conversation_history được gửi nhưng GPT không nhớ

**Nguyên nhân:**
- Messages không được thêm vào GPT request
- Role hoặc content không đúng format
- System prompt không hướng dẫn GPT sử dụng history

**Giải pháp:**
- Kiểm tra logs `Total messages sent to GPT`
- Kiểm tra `messages` array structure
- Kiểm tra system prompt có mention về conversation history

## Checklist debug

- [ ] Frontend logs hiển thị conversation_history được chuẩn bị
- [ ] Frontend logs hiển thị request payload có conversation_history
- [ ] Node.js logs hiển thị nhận được conversation_history
- [ ] Node.js logs hiển thị processed conversation_history
- [ ] Python logs hiển thị nhận được conversation_history trong `/ask`
- [ ] Python logs hiển thị conversation_history được thêm vào messages
- [ ] Python logs hiển thị total messages sent to GPT > 2 (system + history + current)
- [ ] Test script hoặc manual test cho kết quả đúng

## Kết quả mong đợi

Khi conversation history hoạt động đúng:
1. Logs sẽ hiển thị conversation_history được truyền qua tất cả các layer
2. GPT sẽ nhận được messages array với history
3. AI sẽ trả lời dựa trên context từ các câu hỏi trước
4. Test "Tên tôi là gì?" sẽ trả về "Nam"

## Liên hệ

Nếu vẫn gặp vấn đề sau khi debug, hãy:
1. Thu thập tất cả logs từ frontend, Node.js, và Python
2. Chạy test script và lưu output
3. Kiểm tra lại code ở tất cả các layer
