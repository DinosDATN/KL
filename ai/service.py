from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import os
import logging
import json
import httpx
from typing import Dict, Any, Optional, List

app = FastAPI()

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cấu hình logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cấu hình Node.js API URL để lấy schema
NODE_API_URL = os.getenv("NODE_API_URL", "http://localhost:3000")

# 🔹 Dùng OpenRouter endpoint
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY")
)

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    question: str
    conversation_history: Optional[List[ChatMessage]] = None  # Lịch sử hội thoại

class FormatAnswerRequest(BaseModel):
    question: str
    query_result: list
    query_info: Optional[Dict[str, Any]] = None
    conversation_history: Optional[List[ChatMessage]] = None

class ChatAIService:
    """
    Service chính xử lý chat AI với khả năng query database
    """
    
    def __init__(self):
        self.schema_cache = None
        self.schema_cache_time = None
    
    def _get_database_schema(self) -> str:
        """
        Lấy database schema từ Node.js API
        """
        try:
            # Cache schema trong 1 giờ
            import time
            if self.schema_cache and self.schema_cache_time:
                if time.time() - self.schema_cache_time < 3600:
                    logger.info("Using cached schema")
                    return self.schema_cache
            
            logger.info(f"Fetching schema from: {NODE_API_URL}/api/v1/chat-ai/schema")
            with httpx.Client(timeout=10.0) as client:
                response = client.get(f"{NODE_API_URL}/api/v1/chat-ai/schema?format=text")
                logger.info(f"Schema API response status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    schema = data.get("data", {}).get("schema", "")
                    if schema:
                        self.schema_cache = schema
                        self.schema_cache_time = time.time()
                        logger.info(f"Schema fetched successfully, length: {len(schema)} characters")
                        return schema
                    else:
                        logger.warning("Schema response is empty")
                        return ""
                else:
                    logger.warning(f"Failed to get schema: {response.status_code}, response: {response.text[:200]}")
                    return ""
        except Exception as e:
            logger.error(f"Error getting schema: {e}", exc_info=True)
            return ""
    
    def _decide_if_needs_database(self, question: str) -> bool:
        """
        Decision layer: Quyết định xem câu hỏi có cần query database không
        Sử dụng keyword matching trước (nhanh hơn), sau đó mới dùng AI nếu cần
        """
        question_lower = question.lower()
        
        # Keyword matching - nhanh và chính xác cho các trường hợp phổ biến
        strong_db_keywords = [
            "có bao nhiêu", "thống kê", "danh sách", "liệt kê",
            "hiển thị", "show", "list", "đếm", "count"
        ]
        
        # Nếu có strong keywords, chắc chắn cần DB
        if any(keyword in question_lower for keyword in strong_db_keywords):
            logger.info(f"Strong DB keyword detected in: '{question}'")
            return True
        
        # Kiểm tra có từ khóa về entities (khóa học, bài tập, etc.)
        entity_keywords = [
            "khóa học", "course", "bài tập", "problem", "tài liệu", "document",
            "người dùng", "user", "cuộc thi", "contest", "hệ thống"
        ]
        
        has_entity = any(keyword in question_lower for keyword in entity_keywords)
        
        # Nếu có entity keywords + các từ chỉ thị, cần DB
        if has_entity:
            indicator_keywords = [
                "có", "trong", "của", "nào", "gì", "hiện tại", "hiện có",
                "mới nhất", "cũ nhất", "nhiều nhất", "ít nhất", "top"
            ]
            if any(keyword in question_lower for keyword in indicator_keywords):
                logger.info(f"Entity + indicator detected in: '{question}'")
                return True
        
        # Nếu không match keyword, dùng AI để quyết định (cho các trường hợp phức tạp)
        try:
            decision_prompt = (
                f"Phân tích câu hỏi sau và quyết định xem có cần query database không:\n\n"
                f"Câu hỏi: {question}\n\n"
                f"Các loại câu hỏi CẦN query database:\n"
                f"- Hỏi về số lượng, thống kê (ví dụ: 'có bao nhiêu khóa học', 'thống kê người dùng')\n"
                f"- Hỏi về danh sách, liệt kê (ví dụ: 'danh sách khóa học', 'hiển thị bài tập')\n"
                f"- Hỏi về thông tin cụ thể từ hệ thống (ví dụ: 'khóa học nào có rating cao nhất', 'bài tập khó nhất')\n"
                f"- Hỏi về dữ liệu thực tế trong hệ thống\n\n"
                f"Các loại câu hỏi KHÔNG CẦN query database:\n"
                f"- Hỏi về khái niệm, định nghĩa (ví dụ: 'Python là gì', 'thuật toán quicksort là gì')\n"
                f"- Hỏi về cách làm, hướng dẫn (ví dụ: 'làm thế nào để học lập trình', 'cách debug code')\n"
                f"- Hỏi về lý thuyết, kiến thức chung\n\n"
                f"Trả lời CHỈ bằng 'YES' nếu cần query database, hoặc 'NO' nếu không cần."
            )
            
            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "Bạn là một hệ thống phân tích câu hỏi. Nhiệm vụ của bạn là quyết định xem câu hỏi có cần query database không. Trả lời CHỈ bằng 'YES' hoặc 'NO'."
                    },
                    {"role": "user", "content": decision_prompt}
                ],
                temperature=0.1,
                max_tokens=10
            )
            
            decision = completion.choices[0].message.content.strip().upper()
            needs_db = decision == "YES" or "YES" in decision
            
            logger.info(f"AI decision for question '{question}': {'NEEDS_DB' if needs_db else 'NO_DB'} (response: {decision})")
            return needs_db
            
        except Exception as e:
            logger.error(f"Error in AI decision layer: {e}")
            # Fallback: nếu có entity keywords thì cần DB
            return has_entity
    
    def process_question(self, question: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Xử lý câu hỏi với decision layer: quyết định có cần query DB không
        conversation_history: List of messages với format [{"role": "user|assistant", "content": "..."}]
        """
        try:
            logger.info(f"Processing question: {question}")
            if conversation_history:
                logger.info(f"Conversation history: {len(conversation_history)} messages")
            
            # Decision layer: Kiểm tra xem có cần query database không
            needs_database = self._decide_if_needs_database(question)
            logger.info(f"Decision result: needs_database={needs_database} for question: '{question}'")
            
            if needs_database:
                # Lấy schema và sinh SQL
                logger.info("Fetching database schema...")
                schema = self._get_database_schema()
                
                if not schema:
                    logger.warning("Could not fetch schema, trying to generate SQL without schema...")
                    # Thử sinh SQL với basic schema info
                    basic_schema = (
                        "Tables: courses (id, title, description, rating, students, status, is_deleted), "
                        "problems (id, title, difficulty, is_deleted), "
                        "documents (id, title, description, is_deleted), "
                        "users (id, name, email, role, is_active)"
                    )
                    schema = basic_schema
                
                logger.info(f"Using schema, length: {len(schema)} characters")
                sql_result = self._generate_sql(question, schema, conversation_history)
                
                if sql_result.get("sql"):
                    logger.info(f"SQL generated successfully: {sql_result['sql']}")
                    return {
                        "answer": sql_result.get("fallback_answer", ""),
                        "data_source": "ai",
                        "requires_sql": True,
                        "sql": sql_result["sql"],
                        "query_info": sql_result.get("query_info", {})
                    }
                else:
                    logger.warning("Could not generate SQL, using fallback answer")
                    # Trả về fallback answer nếu có
                    if sql_result.get("fallback_answer"):
                        return {
                            "answer": sql_result["fallback_answer"],
                            "data_source": "ai",
                            "requires_sql": False
                        }
            
            # Không cần query DB hoặc không sinh được SQL, trả lời bằng AI thông thường
            logger.info("Using standard AI response")
            ai_response = self._call_ai_with_history(question, conversation_history)
            
            return {
                "answer": ai_response,
                "data_source": "ai",
                "requires_sql": False
            }
            
        except Exception as e:
            logger.error(f"Error processing question: {e}", exc_info=True)
            return {
                "answer": "Xin lỗi, tôi gặp lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại.",
                "error": str(e),
                "requires_sql": False
            }
    
    def _generate_sql(self, question: str, schema: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Sinh SQL query từ câu hỏi người dùng với schema context
        """
        try:
            # Rút ngắn schema nếu quá dài (giới hạn 8000 tokens)
            if len(schema) > 8000:
                schema = schema[:8000] + "\n... (schema truncated)"
            
            system_prompt = (
                "Bạn là một chuyên gia SQL cho MySQL database. Nhiệm vụ của bạn là phân tích câu hỏi tiếng Việt "
                "và sinh ra câu lệnh SQL SELECT phù hợp.\n\n"
                "QUAN TRỌNG:\n"
                "- CHỈ sinh ra câu lệnh SELECT, KHÔNG được có các lệnh khác (INSERT, UPDATE, DELETE, DROP, etc.)\n"
                "- Phải sử dụng đúng tên bảng và cột từ schema được cung cấp\n"
                "- Tên bảng trong database là: courses (khóa học), problems (bài tập), documents (tài liệu), users (người dùng)\n"
                "- Luôn thêm LIMIT để giới hạn kết quả (tối đa 100 rows)\n"
                "- Đối với câu hỏi đếm số lượng, sử dụng COUNT(*)\n"
                "- Đối với câu hỏi 'có bao nhiêu', trả về SELECT COUNT(*) as total FROM ...\n"
                "- Trả về CHỈ SQL query, không có giải thích hay text khác\n"
                "- Nếu không thể sinh SQL hợp lệ, trả về 'NO_SQL'\n\n"
                f"DATABASE SCHEMA:\n{schema}\n\n"
                "Ví dụ:\n"
                "Câu hỏi: 'Có những khóa học nào?'\n"
                "SQL: SELECT id, title, description, rating, students FROM courses WHERE is_deleted = false AND status = 'published' LIMIT 100\n\n"
                "Câu hỏi: 'Hệ thống hiện tại có bao nhiêu khóa học?'\n"
                "SQL: SELECT COUNT(*) as total FROM courses WHERE is_deleted = false LIMIT 100\n\n"
                "Câu hỏi: 'Có bao nhiêu bài tập khó?'\n"
                "SQL: SELECT COUNT(*) as total FROM problems WHERE difficulty = 'Hard' AND is_deleted = false LIMIT 100\n\n"
            )
            
            user_prompt = f"Câu hỏi: {question}\n\nSQL:"
            
            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,  # Lower temperature cho SQL generation
                max_tokens=500
            )
            
            sql_response = completion.choices[0].message.content.strip()
            logger.info(f"Raw SQL response from GPT: {sql_response[:200]}")
            
            # Làm sạch SQL response
            sql_response = sql_response.replace("```sql", "").replace("```", "").strip()
            # Loại bỏ các dòng comment hoặc giải thích
            lines = sql_response.split('\n')
            sql_lines = [line for line in lines if not line.strip().startswith('--') and line.strip()]
            sql_response = ' '.join(sql_lines).strip()
            
            logger.info(f"Cleaned SQL: {sql_response}")
            
            # Kiểm tra xem có phải SQL hợp lệ không
            if sql_response.upper().startswith("SELECT") and "NO_SQL" not in sql_response.upper():
                logger.info(f"Valid SQL generated: {sql_response}")
                return {
                    "sql": sql_response,
                    "query_info": {
                        "type": "select",
                        "generated": True
                    }
                }
            else:
                logger.warning(f"Invalid SQL response: {sql_response}")
                # Fallback: trả lời bằng AI thông thường với conversation history
                if conversation_history:
                    fallback_answer = self._call_ai_with_history(question, conversation_history)
                else:
                    fallback_prompt = (
                        f"Người dùng hỏi: {question}\n\n"
                        f"Hãy trả lời câu hỏi một cách thân thiện, chi tiết và hữu ích bằng tiếng Việt. "
                        f"Bạn là trợ lý AI hỗ trợ người học lập trình."
                    )
                    fallback_answer = self._call_ai(fallback_prompt)
                
                return {
                    "sql": None,
                    "fallback_answer": fallback_answer,
                    "query_info": {
                        "type": "fallback",
                        "reason": "Could not generate valid SQL"
                    }
                }
                
        except Exception as e:
            logger.error(f"Error generating SQL: {e}")
            # Fallback với conversation history
            if conversation_history:
                fallback_answer = self._call_ai_with_history(question, conversation_history)
            else:
                fallback_prompt = (
                    f"Người dùng hỏi: {question}\n\n"
                    f"Hãy trả lời câu hỏi một cách thân thiện, chi tiết và hữu ích bằng tiếng Việt. "
                    f"Bạn là trợ lý AI hỗ trợ người học lập trình."
                )
                fallback_answer = self._call_ai(fallback_prompt)
            
            return {
                "sql": None,
                "fallback_answer": fallback_answer,
                "query_info": {
                    "type": "fallback",
                    "error": str(e)
                }
            }
    
    def _call_ai(self, prompt: str) -> str:
        """
        Gọi AI để trả lời câu hỏi (non-streaming) - backward compatible
        """
        return self._call_ai_with_history(prompt, None)
    
    def _call_ai_with_history(self, question: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> str:
        """
        Gọi AI với conversation history
        """
        try:
            # Build messages array
            messages = [
                {
                    "role": "system", 
                    "content": (
                        "Bạn là trợ lý AI hỗ trợ người học lập trình, nói tiếng Việt. "
                        "Bạn có thể trả lời các câu hỏi về lập trình, thuật toán, công nghệ, "
                        "và các chủ đề liên quan đến học lập trình. "
                        "Hãy trả lời một cách thân thiện, chi tiết và hữu ích. "
                        "Nếu không biết câu trả lời chính xác, hãy đưa ra gợi ý hoặc hướng dẫn tìm hiểu thêm. "
                        "Bạn có thể nhớ và tham khảo các câu hỏi và câu trả lời trước đó trong cuộc hội thoại."
                    )
                }
            ]
            
            # Thêm conversation history nếu có (giới hạn 20 messages gần nhất để tránh quá dài)
            if conversation_history and len(conversation_history) > 0:
                logger.info(f"[_call_ai_with_history] Adding {len(conversation_history)} messages to conversation history")
                # Chỉ lấy 20 messages gần nhất
                recent_history = conversation_history[-20:] if len(conversation_history) > 20 else conversation_history
                added_count = 0
                for msg in recent_history:
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    if role in ["user", "assistant"] and content and content.strip():
                        messages.append({
                            "role": role,
                            "content": content.strip()
                        })
                        added_count += 1
                        logger.info(f"[_call_ai_with_history] Added message #{added_count}: {role} - {content[:100]}...")
                logger.info(f"[_call_ai_with_history] Total messages added: {added_count}")
            else:
                logger.info("[_call_ai_with_history] No conversation history provided")
            
            # Thêm câu hỏi hiện tại
            messages.append({
                "role": "user",
                "content": question
            })
            
            logger.info(f"[_call_ai_with_history] Total messages sent to GPT: {len(messages)}")
            logger.info(f"[_call_ai_with_history] Messages structure: {[{'role': m['role'], 'content_length': len(m['content'])} for m in messages]}")
            
            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=0.7,
                max_tokens=1000
            )
            
            logger.info(f"[_call_ai_with_history] GPT response received successfully")
            
            return completion.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error calling AI: {e}")
            return "Xin lỗi, tôi gặp lỗi khi tạo phản hồi. Vui lòng thử lại."
    
    def _stream_ai(self, prompt: str):
        """
        Gọi AI với streaming response (backward compatible - không có history)
        """
        return self._stream_ai_with_history(prompt, None)
    
    def _stream_ai_with_history(self, question: str, conversation_history: Optional[List[Dict[str, str]]] = None):
        """
        Gọi AI với streaming response và conversation history
        """
        try:
            # Build messages array
            messages = [
                {
                    "role": "system", 
                    "content": (
                        "Bạn là trợ lý AI hỗ trợ người học lập trình, nói tiếng Việt. "
                        "Bạn có thể trả lời các câu hỏi về lập trình, thuật toán, công nghệ, "
                        "và các chủ đề liên quan đến học lập trình. "
                        "Hãy trả lời một cách thân thiện, chi tiết và hữu ích. "
                        "Nếu không biết câu trả lời chính xác, hãy đưa ra gợi ý hoặc hướng dẫn tìm hiểu thêm. "
                        "Bạn có thể nhớ và tham khảo các câu hỏi và câu trả lời trước đó trong cuộc hội thoại."
                    )
                }
            ]
            
            # Thêm conversation history nếu có (giới hạn 20 messages gần nhất)
            if conversation_history and len(conversation_history) > 0:
                logger.info(f"[_stream_ai_with_history] Adding {len(conversation_history)} messages to conversation history")
                recent_history = conversation_history[-20:] if len(conversation_history) > 20 else conversation_history
                added_count = 0
                for msg in recent_history:
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    if role in ["user", "assistant"] and content and content.strip():
                        messages.append({
                            "role": role,
                            "content": content.strip()
                        })
                        added_count += 1
                        logger.info(f"[_stream_ai_with_history] Added message #{added_count}: {role} - {content[:100]}...")
                logger.info(f"[_stream_ai_with_history] Total messages added: {added_count}")
            else:
                logger.info("[_stream_ai_with_history] No conversation history provided")
            
            # Thêm câu hỏi hiện tại
            messages.append({
                "role": "user",
                "content": question
            })
            
            logger.info(f"[_stream_ai_with_history] Total messages sent to GPT: {len(messages)}")
            logger.info(f"[_stream_ai_with_history] Messages structure: {[{'role': m['role'], 'content_length': len(m['content'])} for m in messages]}")
            
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
            
            logger.info(f"[_stream_ai_with_history] Streaming completed successfully")
                    
        except Exception as e:
            logger.error(f"Error streaming AI with history: {e}", exc_info=True)
            yield "Xin lỗi, tôi gặp lỗi khi tạo phản hồi. Vui lòng thử lại."
    
    def format_answer_from_query(self, question: str, query_result: list, query_info: Optional[Dict[str, Any]] = None, conversation_history: Optional[List[Dict[str, str]]] = None) -> str:
        """
        Format câu trả lời từ kết quả query database
        """
        try:
            if not query_result or len(query_result) == 0:
                return "Không tìm thấy dữ liệu phù hợp với câu hỏi của bạn."
            
            # Xử lý đặc biệt cho COUNT(*) queries
            first_result = query_result[0]
            if isinstance(first_result, dict) and 'total' in first_result:
                # Đây là kết quả COUNT(*)
                total = first_result.get('total', 0)
                logger.info(f"Formatting COUNT result: total={total}")
                
                # Format trực tiếp cho COUNT queries
                if 'khóa học' in question.lower() or 'course' in question.lower():
                    return f"Hiện tại hệ thống có **{total}** khóa học."
                elif 'bài tập' in question.lower() or 'problem' in question.lower():
                    return f"Hiện tại hệ thống có **{total}** bài tập."
                elif 'tài liệu' in question.lower() or 'document' in question.lower():
                    return f"Hiện tại hệ thống có **{total}** tài liệu."
                elif 'người dùng' in question.lower() or 'user' in question.lower():
                    return f"Hiện tại hệ thống có **{total}** người dùng."
                else:
                    return f"Dựa trên dữ liệu từ hệ thống, có **{total}** kết quả."
            
            # Xử lý cho các queries khác (danh sách, etc.)
            result_summary = json.dumps(query_result[:20], ensure_ascii=False, indent=2)  # Chỉ lấy 20 rows đầu
            
            # Build messages với conversation history
            messages = [
                {
                    "role": "system",
                    "content": (
                        "Bạn là trợ lý AI hỗ trợ người học lập trình, nói tiếng Việt. "
                        "Bạn có thể nhớ và tham khảo các câu hỏi và câu trả lời trước đó trong cuộc hội thoại."
                    )
                }
            ]
            
            # Thêm conversation history nếu có
            if conversation_history:
                recent_history = conversation_history[-5:] if len(conversation_history) > 5 else conversation_history
                for msg in recent_history:
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    if role in ["user", "assistant"] and content:
                        messages.append({
                            "role": role,
                            "content": content
                        })
            
            # Thêm câu hỏi và kết quả query
            messages.append({
                "role": "user",
                "content": (
                    f"Người dùng đã hỏi: {question}\n\n"
                    f"Kết quả từ database:\n{result_summary}\n\n"
                    f"Hãy trả lời câu hỏi dựa trên dữ liệu trên một cách thân thiện, chi tiết và hữu ích bằng tiếng Việt. "
                    f"Hãy trình bày thông tin một cách dễ hiểu và có cấu trúc."
                )
            })
            
            try:
                completion = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages,
                    temperature=0.7,
                    max_tokens=1000
                )
                formatted_answer = completion.choices[0].message.content
            except Exception as e:
                logger.error(f"Error calling AI for formatting: {e}")
                # Fallback
                formatted_answer = f"Dựa trên dữ liệu từ hệ thống:\n\n{result_summary}"
            return formatted_answer
            
        except Exception as e:
            logger.error(f"Error formatting answer: {e}", exc_info=True)
            # Fallback: format đơn giản
            if query_result and len(query_result) > 0:
                first_result = query_result[0]
                if isinstance(first_result, dict) and 'total' in first_result:
                    total = first_result.get('total', 0)
                    return f"Hiện tại hệ thống có {total} kết quả."
                else:
                    return f"Dựa trên dữ liệu từ hệ thống, tìm thấy {len(query_result)} kết quả."
            else:
                return "Không tìm thấy dữ liệu phù hợp với câu hỏi của bạn."

# Khởi tạo service
chat_ai_service = ChatAIService()

@app.post("/ask")
async def ask(request: ChatRequest):
    """
    API endpoint chính để xử lý câu hỏi chat (non-streaming - giữ lại để tương thích)
    """
    try:
        question = request.question.strip()
        
        if not question:
            return {
                "answer": "Xin chào! Tôi là trợ lý AI hỗ trợ học lập trình. Bạn muốn hỏi gì?",
                "data_source": "ai"
            }
        
        # Lấy conversation history từ request
        conversation_history = None
        if hasattr(request, 'conversation_history') and request.conversation_history:
            conversation_history = [
                {"role": msg.role, "content": msg.content}
                for msg in request.conversation_history
            ]
            logger.info(f"[/ask] Received conversation_history: {len(conversation_history)} messages")
            if len(conversation_history) > 0:
                logger.info(f"[/ask] First message: {conversation_history[0]}")
                logger.info(f"[/ask] Last message: {conversation_history[-1]}")
        else:
            logger.info(f"[/ask] No conversation_history in request")
        
        # Xử lý câu hỏi thông qua ChatAI service
        result = chat_ai_service.process_question(question, conversation_history)
        
        return result
        
    except Exception as e:
        logger.error(f"Error in ask endpoint: {e}")
        return {
            "answer": "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.",
            "error": str(e)
        }

@app.post("/ask-stream")
async def ask_stream(request: ChatRequest):
    """
    API endpoint streaming để xử lý câu hỏi chat với streaming response
    """
    try:
        question = request.question.strip()
        
        if not question:
            def empty_response():
                yield json.dumps({"type": "error", "content": "Câu hỏi không được để trống"}) + "\n"
            return StreamingResponse(empty_response(), media_type="text/event-stream")
        
        # Lấy conversation history từ request
        conversation_history = None
        if hasattr(request, 'conversation_history') and request.conversation_history:
            conversation_history = [
                {"role": msg.role, "content": msg.content}
                for msg in request.conversation_history
            ]
            logger.info(f"[/ask-stream] Received conversation_history: {len(conversation_history)} messages")
            if len(conversation_history) > 0:
                logger.info(f"[/ask-stream] First message: {conversation_history[0]}")
                logger.info(f"[/ask-stream] Last message: {conversation_history[-1]}")
        else:
            logger.info(f"[/ask-stream] No conversation_history in request")
        
        def generate():
            try:
                for chunk in chat_ai_service._stream_ai_with_history(question, conversation_history):
                    # Gửi từng chunk dưới dạng JSON
                    data = json.dumps({"type": "chunk", "content": chunk}, ensure_ascii=False)
                    yield f"data: {data}\n\n"
                
                # Gửi signal kết thúc
                yield f"data: {json.dumps({'type': 'done'}, ensure_ascii=False)}\n\n"
                
            except Exception as e:
                logger.error(f"Error in stream generation: {e}")
                error_data = json.dumps({"type": "error", "content": "Có lỗi xảy ra khi tạo phản hồi"}, ensure_ascii=False)
                yield f"data: {error_data}\n\n"
        
        return StreamingResponse(generate(), media_type="text/event-stream")
        
    except Exception as e:
        logger.error(f"Error in ask_stream endpoint: {e}")
        def error_response():
            yield json.dumps({"type": "error", "content": "Có lỗi xảy ra. Vui lòng thử lại sau."}, ensure_ascii=False) + "\n"
        return StreamingResponse(error_response(), media_type="text/event-stream")

@app.post("/format-answer")
async def format_answer(request: FormatAnswerRequest):
    """
    Format câu trả lời từ kết quả query database
    """
    try:
        # Lấy conversation history từ request
        conversation_history = None
        if request.conversation_history:
            conversation_history = [
                {"role": msg.role, "content": msg.content}
                for msg in request.conversation_history
            ]
            logger.info(f"[/format-answer] Received conversation_history: {len(conversation_history)} messages")
            if len(conversation_history) > 0:
                logger.info(f"[/format-answer] First message: {conversation_history[0]}")
                logger.info(f"[/format-answer] Last message: {conversation_history[-1]}")
        else:
            logger.info(f"[/format-answer] No conversation_history in request")
        
        formatted = chat_ai_service.format_answer_from_query(
            request.question,
            request.query_result,
            request.query_info,
            conversation_history
        )
        
        return {
            "answer": formatted,
            "data_source": "database"
        }
        
    except Exception as e:
        logger.error(f"Error in format_answer endpoint: {e}")
        return {
            "answer": "Xin lỗi, có lỗi xảy ra khi format câu trả lời.",
            "error": str(e)
        }

@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    try:
        # Kiểm tra kết nối AI
        test_response = chat_ai_service._call_ai("Test")
        
        return {
            "status": "healthy",
            "ai_client": "active",
            "message": "AI service is running"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "message": "AI service is not available"
        }
