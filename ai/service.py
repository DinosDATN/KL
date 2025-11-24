from fastapi import FastAPI
from pydantic import BaseModel
from openai import OpenAI
import os
import logging
from typing import Dict, Any

app = FastAPI()

# Cấu hình logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 🔹 Dùng OpenRouter endpoint
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY")
)

class ChatRequest(BaseModel):
    question: str

class ChatAIService:
    """
    Service chính xử lý chat AI - chỉ sử dụng AI để trả lời câu hỏi
    """
    
    def __init__(self):
        pass
    
    def process_question(self, question: str) -> Dict[str, Any]:
        """
        Xử lý câu hỏi và trả về kết quả từ AI
        """
        try:
            # Tạo prompt cho AI
            prompt = (
                f"Người dùng hỏi: {question}\n\n"
                f"Hãy trả lời câu hỏi một cách thân thiện, chi tiết và hữu ích bằng tiếng Việt. "
                f"Bạn là trợ lý AI hỗ trợ người học lập trình."
            )
            
            # Gọi AI
            ai_response = self._call_ai(prompt)
            
            return {
                "answer": ai_response,
                "data_source": "ai"
            }
            
        except Exception as e:
            logger.error(f"Error processing question: {e}")
            return {
                "answer": "Xin lỗi, tôi gặp lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại.",
                "error": str(e)
            }
    
    def _call_ai(self, prompt: str) -> str:
        """
        Gọi AI để trả lời câu hỏi
        """
        try:
            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system", 
                        "content": (
                            "Bạn là trợ lý AI hỗ trợ người học lập trình, nói tiếng Việt. "
                            "Bạn có thể trả lời các câu hỏi về lập trình, thuật toán, công nghệ, "
                            "và các chủ đề liên quan đến học lập trình. "
                            "Hãy trả lời một cách thân thiện, chi tiết và hữu ích. "
                            "Nếu không biết câu trả lời chính xác, hãy đưa ra gợi ý hoặc hướng dẫn tìm hiểu thêm."
                        )
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            return completion.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error calling AI: {e}")
            return "Xin lỗi, tôi gặp lỗi khi tạo phản hồi. Vui lòng thử lại."

# Khởi tạo service
chat_ai_service = ChatAIService()

@app.post("/ask")
async def ask(request: ChatRequest):
    """
    API endpoint chính để xử lý câu hỏi chat
    """
    try:
        question = request.question.strip()
        
        if not question:
            return {
                "answer": "Xin chào! Tôi là trợ lý AI hỗ trợ học lập trình. Bạn muốn hỏi gì?",
                "suggestions": [
                    "Làm thế nào để bắt đầu học lập trình?",
                    "Python là gì?",
                    "Các khái niệm cơ bản về thuật toán",
                    "Cách debug code hiệu quả"
                ]
            }
        
        # Xử lý câu hỏi thông qua ChatAI service
        result = chat_ai_service.process_question(question)
        
        return result
        
    except Exception as e:
        logger.error(f"Error in ask endpoint: {e}")
        return {
            "answer": "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.",
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
