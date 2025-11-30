# FIX CONVERSATION HISTORY - TỔNG KẾT

## Vấn đề đã phát hiện

Conversation history không hoạt động vì:

1. **Node.js Controller** không gửi `conversation_history` đến Python `/ask-stream` endpoint
2. **Python `/ask-stream` endpoint** không xử lý `conversation_history`
3. **Python service** không có method `_stream_ai_with_history` để stream với history

## Các thay đổi đã thực hiện

### 1. Node.js Controller (`api/src/controllers/chatAIController.js`)

#### Thay đổi 1: Thêm logging chi tiết
```javascript
// Thêm logs để debug conversation_history
console.log(`[ChatAI] Raw conversation_history from request:`, conversationHistory ? JSON.stringify(conversationHistory, null, 2) : 'null');
console.log(`[ChatAI] Processed conversation_history (${requestBody.conversation_history.length} messages):`, ...);
```

#### Thay đổi 2: Gửi conversation_history đến Python streaming
```javascript
// Trước đây: Chỉ gửi question
const response = await axios.post(
  `${PYTHON_AI_API_URL}/ask-stream`,
  { question: question.trim() },
  ...
);

// Sau khi sửa: Gửi cả conversation_history
const streamRequestBody = {
  question: question.trim()
};

if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
  streamRequestBody.conversation_history = conversationHistory.map(msg => ({
    role: msg.role || (msg.isUser ? 'user' : 'assistant'),
    content: msg.text || msg.content || msg.message || ''
  })).filter(msg => msg.content && msg.content.trim().length > 0);
}

const response = await axios.post(
  `${PYTHON_AI_API_URL}/ask-stream`,
  streamRequestBody,
  ...
);
```

### 2. Python Service (`ai/service.py`)

#### Thay đổi 1: Xử lý conversation_history trong `/ask-stream`
```python
# Trước đây: Không xử lý conversation_history
def generate():
    for chunk in chat_ai_service._stream_ai(prompt):
        yield chunk

# Sau khi sửa: Lấy và xử lý conversation_history
conversation_history = None
if hasattr(request, 'conversation_history') and request.conversation_history:
    conversation_history = [
        {"role": msg.role, "content": msg.content}
        for msg in request.conversation_history
    ]
    logger.info(f"[/ask-stream] Received conversation_history: {len(conversation_history)} messages")

def generate():
    for chunk in chat_ai_service._stream_ai_with_history(question, conversation_history):
        yield chunk
```

#### Thay đổi 2: Tạo method `_stream_ai_with_history`
```python
def _stream_ai_with_history(self, question: str, conversation_history: Optional[List[Dict[str, str]]] = None):
    """
    Gọi AI với streaming response và conversation history
    """
    # Build messages array
    messages = [{"role": "system", "content": "..."}]
    
    # Thêm conversation history nếu có
    if conversation_history and len(conversation_history) > 0:
        recent_history = conversation_history[-20:]
        for msg in recent_history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role in ["user", "assistant"] and content:
                messages.append({"role": role, "content": content.strip()})
    
    # Thêm câu hỏi hiện tại
    messages.append({"role": "user", "content": question})
    
    # Stream từ GPT
    stream = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        temperature=0.7,
        max_tokens=1000,
        stream=True
    )
    
    for chunk in stream:
        if chunk.choices[0].delta.content is not None:
            yield chunk.choices[0].delta.content
```

#### Thay đổi 3: Refactor `_stream_ai` để sử dụng `_stream_ai_with_history`
```python
def _stream_ai(self, prompt: str):
    """
    Gọi AI với streaming response (backward compatible - không có history)
    """
    return self._stream_ai_with_history(prompt, None)
```

#### Thay đổi 4: Thêm logging chi tiết
```python
# Thêm logs trong tất cả các methods xử lý conversation_history
logger.info(f"[/ask] Received conversation_history: {len(conversation_history)} messages")
logger.info(f"[/format-answer] Received conversation_history: {len(conversation_history)} messages")
logger.info(f"[_call_ai_with_history] Adding {len(conversation_history)} messages to conversation history")
logger.info(f"[_stream_ai_with_history] Total messages sent to GPT: {len(messages)}")
```

### 3. Frontend (`cli/src/app/core/services/chat-ai.service.ts`)

#### Thêm logging chi tiết để debug
```typescript
console.log(`[ChatAI] ===== CONVERSATION HISTORY DEBUG =====`);
console.log(`[ChatAI] Total messages in state: ${this.messagesSubject.value.length}`);
console.log(`[ChatAI] Filtered messages: ${currentMessagesBefore.length}`);
console.log(`[ChatAI] Prepared conversation history: ${conversationHistory.length} messages`);
console.log(`[ChatAI] All messages:`, JSON.stringify(conversationHistory, null, 2));
console.log(`[ChatAI] ========================================`);
```

## Cách test

### Test 1: Sử dụng test script
```bash
cd ai
python test_conversation_history.py
```

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
2. Gửi: "Tên tôi là Nam"
3. Đợi response
4. Gửi: "Tên tôi là gì?"
5. AI sẽ trả lời "Nam" nếu conversation history hoạt động

## Kết quả mong đợi

### Logs trong Browser Console
```
[ChatAI] ===== CONVERSATION HISTORY DEBUG =====
[ChatAI] Total messages in state: 3
[ChatAI] Filtered messages: 2
[ChatAI] Prepared conversation history: 2 messages
[ChatAI] First message: {"role":"user","content":"Tên tôi là Nam"}
[ChatAI] Last message: {"role":"assistant","content":"Xin chào Nam!..."}
```

### Logs trong Node.js
```
[ChatAI Stream] Conversation history received: 2 messages
[ChatAI Stream] First message: {"role":"user","content":"Tên tôi là Nam"}
[ChatAI Stream] Sending 2 messages to Python streaming
```

### Logs trong Python
```
[/ask-stream] Received conversation_history: 2 messages
[/ask-stream] First message: {'role': 'user', 'content': 'Tên tôi là Nam'}
[_stream_ai_with_history] Adding 2 messages to conversation history
[_stream_ai_with_history] Total messages sent to GPT: 4
```

### Response từ AI
```
Tên bạn là Nam.
```

## Checklist

- [x] Node.js gửi conversation_history đến Python `/ask-stream`
- [x] Python `/ask-stream` nhận và xử lý conversation_history
- [x] Python có method `_stream_ai_with_history` để stream với history
- [x] Thêm logging chi tiết ở tất cả các layer
- [x] Tạo test script để kiểm tra
- [x] Tạo documentation

## Lưu ý

1. **Giới hạn history**: Chỉ lấy 20 messages gần nhất để tránh token limit
2. **Backward compatible**: Method `_stream_ai` vẫn hoạt động cho code cũ
3. **Error handling**: Có fallback nếu conversation_history không hợp lệ
4. **Logging**: Đầy đủ logs để debug nếu có vấn đề

## Restart services

Sau khi thay đổi code, cần restart cả 2 services:

```bash
# Restart Python service
cd ai
# Ctrl+C để stop
python start.py

# Restart Node.js service
cd api
# Ctrl+C để stop
npm start
```

## Kiểm tra

Sau khi restart, chạy test script:
```bash
cd ai
python test_conversation_history.py
```

Nếu thấy:
```
✅ SUCCESS: AI nhớ được tên!
🎉 CONVERSATION HISTORY HOẠT ĐỘNG TỐT!
```

Thì conversation history đã hoạt động!
