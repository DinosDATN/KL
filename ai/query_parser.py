import re
from typing import Dict, List, Optional, Any
from enum import Enum

class QueryIntent(Enum):
    """Các loại intent của câu hỏi"""
    GENERAL_CHAT = "general_chat"  # Câu hỏi chung
    DATABASE_QUERY = "database_query"  # Câu hỏi liên quan database
    MIXED = "mixed"  # Câu hỏi kết hợp

class QueryType(Enum):
    """Các loại truy vấn database"""
    COURSE = "courses"
    PROBLEM = "problems" 
    DOCUMENT = "documents"
    CONTEST = "contests"
    STATISTICS = "statistics"
    SEARCH = "search"

class QueryParser:
    """
    Parser để phân tích câu hỏi và xác định intent
    """
    
    def __init__(self):
        # Từ khóa liên quan đến các bảng
        self.keywords = {
            'courses': [
                'khóa học', 'course', 'khoá học', 'học phí', 'giá khóa học', 'instructor', 'giảng viên', 
                'học', 'đăng ký', 'tham gia khóa học', 'rating khóa học', 'đánh giá khóa học', 
                'premium', 'miễn phí', 'trả phí', 'beginner', 'intermediate', 'advanced', 'cơ bản', 'nâng cao'
            ],
            'problems': [
                'bài tập', 'problem', 'exercise', 'coding', 'lập trình', 'giải thuật', 'algorithm',
                'easy', 'medium', 'hard', 'dễ', 'trung bình', 'khó', 'submission', 'nộp bài',
                'acceptance', 'tỷ lệ chấp nhận', 'like', 'dislike', 'bài toán', 'challenge'
            ],
            'documents': [
                'tài liệu', 'document', 'doc', 'hướng dẫn', 'tutorial', 'lesson', 'bài học',
                'topic', 'chủ đề', 'module', 'content', 'nội dung', 'đọc', 'nghiên cứu', 'tham khảo'
            ],
            'contests': [
                'cuộc thi', 'contest', 'competition', 'thi đấu', 'thử thách', 'sự kiện',
                'đăng ký thi', 'tham gia cuộc thi', 'bảng xếp hạng', 'ranking', 'giải thưởng'
            ]
        }
        
        # Từ khóa cho các loại truy vấn
        self.query_patterns = {
            'list': ['danh sách', 'list', 'tất cả', 'all', 'có những', 'có gì', 'show', 'hiển thị'],
            'search': ['tìm', 'search', 'find', 'tìm kiếm', 'tra cứu', 'lookup'],
            'filter': ['lọc', 'filter', 'theo', 'với điều kiện', 'where', 'có', 'là'],
            'statistics': ['thống kê', 'stats', 'số lượng', 'count', 'bao nhiêu', 'tổng', 'trung bình', 'average'],
            'detail': ['chi tiết', 'detail', 'thông tin', 'info', 'về']
        }
        
        # Từ khóa cho bộ lọc
        self.filter_patterns = {
            'level': {
                'beginner': ['beginner', 'cơ bản', 'dễ', 'mới bắt đầu', 'người mới'],
                'intermediate': ['intermediate', 'trung bình', 'vừa phải'],
                'advanced': ['advanced', 'nâng cao', 'khó', 'chuyên sâu']
            },
            'difficulty': {
                'Easy': ['easy', 'dễ', 'đơn giản'],
                'Medium': ['medium', 'trung bình', 'vừa phải'],
                'Hard': ['hard', 'khó', 'phức tạp']
            },
            'status': {
                'published': ['published', 'đã xuất bản', 'công khai'],
                'ongoing': ['ongoing', 'đang diễn ra', 'hiện tại'],
                'upcoming': ['upcoming', 'sắp tới', 'tương lai'],
                'finished': ['finished', 'đã kết thúc', 'hoàn thành']
            },
            'premium': {
                True: ['premium', 'trả phí', 'có phí'],
                False: ['free', 'miễn phí', 'không phí']
            }
        }

    def parse_query(self, question: str) -> Dict[str, Any]:
        """
        Phân tích câu hỏi và trả về thông tin intent
        """
        question = question.lower().strip()
        
        # Xác định intent chính
        intent = self._determine_intent(question)
        
        # Xác định loại truy vấn
        query_types = self._determine_query_types(question)
        
        # Xác định loại operation
        operation = self._determine_operation(question)
        
        # Trích xuất bộ lọc
        filters = self._extract_filters(question)
        
        # Trích xuất từ khóa tìm kiếm
        search_keywords = self._extract_search_keywords(question)
        
        return {
            'intent': intent,
            'query_types': query_types,
            'operation': operation,
            'filters': filters,
            'search_keywords': search_keywords,
            'original_question': question
        }

    def _determine_intent(self, question: str) -> QueryIntent:
        """Xác định intent chính của câu hỏi"""
        database_score = 0
        total_keywords = sum(len(keywords) for keywords in self.keywords.values())
        
        # Đếm số từ khóa database xuất hiện
        for category, keywords in self.keywords.items():
            for keyword in keywords:
                if keyword in question:
                    database_score += 1
        
        # Nếu có nhiều từ khóa database, có thể là database query
        if database_score >= 1:
            return QueryIntent.DATABASE_QUERY
        
        return QueryIntent.GENERAL_CHAT

    def _determine_query_types(self, question: str) -> List[QueryType]:
        """Xác định loại truy vấn database"""
        query_types = []
        
        for category, keywords in self.keywords.items():
            for keyword in keywords:
                if keyword in question:
                    if category == 'courses':
                        query_types.append(QueryType.COURSE)
                    elif category == 'problems':
                        query_types.append(QueryType.PROBLEM)
                    elif category == 'documents':
                        query_types.append(QueryType.DOCUMENT)
                    elif category == 'contests':
                        query_types.append(QueryType.CONTEST)
                    break
        
        # Kiểm tra thống kê
        for keyword in self.query_patterns['statistics']:
            if keyword in question:
                query_types.append(QueryType.STATISTICS)
                break
        
        # Kiểm tra tìm kiếm tổng hợp
        for keyword in self.query_patterns['search']:
            if keyword in question and len(query_types) == 0:
                query_types.append(QueryType.SEARCH)
                break
        
        # Loại bỏ trùng lặp
        return list(set(query_types))

    def _determine_operation(self, question: str) -> str:
        """Xác định loại operation"""
        for operation, keywords in self.query_patterns.items():
            for keyword in keywords:
                if keyword in question:
                    return operation
        
        return 'list'  # Mặc định là list

    def _extract_filters(self, question: str) -> Dict[str, Any]:
        """Trích xuất các bộ lọc từ câu hỏi"""
        filters = {}
        
        # Trích xuất level
        for level, keywords in self.filter_patterns['level'].items():
            for keyword in keywords:
                if keyword in question:
                    filters['level'] = level.title()
                    break
        
        # Trích xuất difficulty
        for difficulty, keywords in self.filter_patterns['difficulty'].items():
            for keyword in keywords:
                if keyword in question:
                    filters['difficulty'] = difficulty
                    break
        
        # Trích xuất status
        for status, keywords in self.filter_patterns['status'].items():
            for keyword in keywords:
                if keyword in question:
                    filters['status'] = status
                    break
        
        # Trích xuất premium
        for premium_status, keywords in self.filter_patterns['premium'].items():
            for keyword in keywords:
                if keyword in question:
                    filters['is_premium'] = premium_status
                    break
        
        # Trích xuất rating tối thiểu
        rating_pattern = r'rating\s*>=?\s*(\d+(?:\.\d+)?)|đánh giá\s*>=?\s*(\d+(?:\.\d+)?)|từ\s*(\d+(?:\.\d+)?)\s*sao'
        rating_match = re.search(rating_pattern, question)
        if rating_match:
            rating = float(rating_match.group(1) or rating_match.group(2) or rating_match.group(3))
            filters['min_rating'] = rating
        
        return filters

    def _extract_search_keywords(self, question: str) -> List[str]:
        """Trích xuất từ khóa tìm kiếm"""
        # Loại bỏ stop words và từ khóa hệ thống
        stop_words = [
            'tìm', 'search', 'find', 'tìm kiếm', 'về', 'cho', 'tôi', 'mình', 'có', 'là',
            'của', 'và', 'hoặc', 'với', 'trong', 'trên', 'dưới', 'theo', 'từ', 'đến',
            'danh sách', 'list', 'all', 'tất cả', 'những', 'các', 'một', 'some'
        ]
        
        # Loại bỏ tất cả từ khóa hệ thống
        system_keywords = []
        for keywords in self.keywords.values():
            system_keywords.extend(keywords)
        for keywords in self.query_patterns.values():
            system_keywords.extend(keywords)
        
        words = question.split()
        search_keywords = []
        
        for word in words:
            # Bỏ qua stop words và system keywords
            if word not in stop_words and word not in system_keywords:
                # Bỏ qua các từ quá ngắn
                if len(word) > 2:
                    search_keywords.append(word)
        
        return search_keywords

    def should_use_database(self, parsed_query: Dict[str, Any]) -> bool:
        """Kiểm tra xem có nên sử dụng database không"""
        return (
            parsed_query['intent'] == QueryIntent.DATABASE_QUERY or
            len(parsed_query['query_types']) > 0 or
            len(parsed_query['filters']) > 0 or
            parsed_query['operation'] in ['search', 'statistics', 'list', 'filter']
        )

    def generate_prompt_context(self, parsed_query: Dict[str, Any], db_results: Dict[str, Any]) -> str:
        """Tạo context cho AI dựa trên kết quả database"""
        if not db_results:
            return ""
        
        context_parts = []
        
        # Thêm thông tin về kết quả truy vấn
        if 'courses' in db_results and db_results['courses']:
            context_parts.append(f"Thông tin khóa học: {db_results['courses']}")
        
        if 'problems' in db_results and db_results['problems']:
            context_parts.append(f"Thông tin bài tập: {db_results['problems']}")
        
        if 'documents' in db_results and db_results['documents']:
            context_parts.append(f"Thông tin tài liệu: {db_results['documents']}")
        
        if 'contests' in db_results and db_results['contests']:
            context_parts.append(f"Thông tin cuộc thi: {db_results['contests']}")
        
        if 'statistics' in db_results and db_results['statistics']:
            context_parts.append(f"Thống kê: {db_results['statistics']}")
        
        return "\n".join(context_parts)