from fastapi import FastAPI
from pydantic import BaseModel
from openai import OpenAI
import os
import logging
from typing import Dict, Any, Optional

# Import các module mới
from database_service import DatabaseService
from query_parser import QueryParser, QueryIntent
from sql_query_builder import SQLQueryBuilder

app = FastAPI()

# Cấu hình logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 🔹 Dùng OpenRouter endpoint
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY")
)

# Khởi tạo các service
db_service = DatabaseService()
query_parser = QueryParser()
sql_builder = SQLQueryBuilder(db_service)

class ChatRequest(BaseModel):
    question: str

class ChatAIService:
    """
    Service chính xử lý chat AI với khả năng truy vấn database
    """
    
    def __init__(self):
        self.db_service = db_service
        self.query_parser = query_parser
        self.sql_builder = sql_builder
    
    def process_question(self, question: str) -> Dict[str, Any]:
        """
        Xử lý câu hỏi và trả về kết quả
        """
        try:
            # Parse câu hỏi
            parsed_query = self.query_parser.parse_query(question)
            
            # Kiểm tra có cần truy vấn database không
            if self.query_parser.should_use_database(parsed_query):
                return self._handle_database_query(question, parsed_query)
            else:
                return self._handle_general_chat(question)
        
        except Exception as e:
            logger.error(f"Error processing question: {e}")
            return {
                "answer": "Xin lỗi, tôi gặp lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại.",
                "error": str(e)
            }
    
    def _handle_database_query(self, question: str, parsed_query: Dict[str, Any]) -> Dict[str, Any]:
        """
        Xử lý câu hỏi liên quan đến database
        """
        try:
            # Thực thi query
            db_results = self.sql_builder.execute_parsed_query(parsed_query)
            
            # Format kết quả
            formatted_results = self.sql_builder.format_results_for_ai(db_results)
            
            # Tạo prompt cho AI
            context = self._create_database_context(formatted_results, parsed_query)
            prompt = (
                f"Người dùng hỏi: {question}\n"
                f"Dữ liệu từ database:\n{formatted_results}\n\n"
                f"Hãy trả lời câu hỏi dựa trên dữ liệu trên. "
                f"Trả lời bằng tiếng Việt, thân thiện và dễ hiểu. "
                f"Nếu không có dữ liệu phù hợp, hãy thông báo và đưa ra gợi ý."
            )
            
            # Gọi AI
            ai_response = self._call_ai_with_context(prompt)
            
            # Lấy gợi ý câu hỏi
            suggestions = self.sql_builder.get_query_suggestions(parsed_query)
            
            return {
                "answer": ai_response,
                "data_source": "database",
                "query_info": {
                    "intent": parsed_query['intent'].value,
                    "query_types": [qt.value for qt in parsed_query['query_types']],
                    "filters_applied": parsed_query['filters']
                },
                "suggestions": suggestions,
                "raw_data": db_results if db_results else None
            }
            
        except Exception as e:
            logger.error(f"Error handling database query: {e}")
            return self._handle_general_chat(question)
    
    def _handle_general_chat(self, question: str) -> Dict[str, Any]:
        """
        Xử lý câu hỏi chat thông thường
        """
        try:
            prompt = (
                f"Người dùng hỏi: {question}\n"
                f"Hãy trả lời bằng tiếng Việt nếu không có yêu cầu ngôn ngữ cụ thể. "
                f"Bạn là trợ lý AI hỗ trợ người học lập trình."
            )
            
            ai_response = self._call_ai_with_context(prompt)
            
            return {
                "answer": ai_response,
                "data_source": "ai_general",
                "suggestions": [
                    "Bạn có thể hỏi về khóa học, bài tập, tài liệu hoặc cuộc thi",
                    "Ví dụ: 'Có khóa học Python nào không?'",
                    "Hoặc: 'Bài tập dễ về thuật toán có gì?'"
                ]
            }
            
        except Exception as e:
            logger.error(f"Error handling general chat: {e}")
            return {
                "answer": "Xin lỗi, tôi không thể trả lời câu hỏi này lúc này. Vui lòng thử lại sau.",
                "error": str(e)
            }
    
    def _create_database_context(self, formatted_results: str, parsed_query: Dict[str, Any]) -> str:
        """
        Tạo context cho AI dựa trên kết quả database
        """
        context_parts = ["Dữ liệu từ hệ thống:"]
        
        if formatted_results and formatted_results != "Không tìm thấy dữ liệu phù hợp với yêu cầu của bạn.":
            context_parts.append(formatted_results)
        else:
            context_parts.append("Không tìm thấy dữ liệu phù hợp.")
        
        return "\n".join(context_parts)
    
    def _call_ai_with_context(self, prompt: str) -> str:
        """
        Gọi AI với context đã chuẩn bị
        """
        try:
            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system", 
                        "content": (
                            "Bạn là trợ lý AI hỗ trợ người học lập trình, nói tiếng Việt. "
                            "Bạn có thể truy cập thông tin về khóa học, bài tập, tài liệu và cuộc thi. "
                            "Hãy trả lời một cách thân thiện, chi tiết và hữu ích. "
                            "Nếu có dữ liệu cụ thể, hãy tận dụng để đưa ra lời khuyên phù hợp."
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
                "answer": "Xin chào! Tôi có thể giúp bạn tìm hiểu về khóa học, bài tập, tài liệu và cuộc thi. Bạn muốn hỏi gì?",
                "suggestions": [
                    "Có những khóa học nào?",
                    "Bài tập dễ để luyện tập?",
                    "Tài liệu học lập trình có gì?"
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
        # Kiểm tra kết nối database
        stats = db_service.get_statistics()
        return {
            "status": "healthy",
            "database": "connected" if stats else "disconnected",
            "services": {
                "query_parser": "active",
                "sql_builder": "active",
                "ai_client": "active"
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

@app.get("/stats")
async def get_system_stats():
    """
    Lấy thống kê tổng quan hệ thống
    """
    try:
        stats = db_service.get_statistics()
        return {
            "statistics": stats,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        return {
            "error": str(e),
            "status": "error"
        }
