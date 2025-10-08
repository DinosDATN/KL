from typing import Dict, List, Any, Optional, Tuple
from database_service import DatabaseService
from query_parser import QueryType

class SQLQueryBuilder:
    """
    Builder class để tạo các câu truy vấn SQL an toàn
    Chỉ cho phép tạo query cho các bảng được phép
    """
    
    def __init__(self, db_service: DatabaseService):
        self.db_service = db_service
        
        # Mapping giữa QueryType và method tương ứng
        self.query_handlers = {
            QueryType.COURSE: self._handle_course_query,
            QueryType.PROBLEM: self._handle_problem_query,
            QueryType.DOCUMENT: self._handle_document_query,
            QueryType.CONTEST: self._handle_contest_query,
            QueryType.STATISTICS: self._handle_statistics_query,
            QueryType.SEARCH: self._handle_search_query
        }
    
    def execute_parsed_query(self, parsed_query: Dict[str, Any]) -> Dict[str, Any]:
        """
        Thực thi query đã được parse
        """
        results = {}
        
        # Nếu không có query types, return empty
        if not parsed_query['query_types']:
            return results
        
        # Thực thi từng loại query
        for query_type in parsed_query['query_types']:
            if query_type in self.query_handlers:
                handler = self.query_handlers[query_type]
                try:
                    result = handler(parsed_query)
                    if result:
                        results[query_type.value] = result
                except Exception as e:
                    print(f"Error executing {query_type.value} query: {e}")
                    results[query_type.value] = []
        
        return results
    
    def _handle_course_query(self, parsed_query: Dict[str, Any]) -> List[Dict]:
        """Xử lý truy vấn courses"""
        operation = parsed_query['operation']
        filters = parsed_query['filters']
        search_keywords = parsed_query['search_keywords']
        
        # Xử lý search
        if operation == 'search' and search_keywords:
            results = self.db_service.get_courses(filters, 20)
            # Lọc theo từ khóa tìm kiếm
            filtered_results = []
            for course in results:
                for keyword in search_keywords:
                    if (keyword in course.get('title', '').lower() or 
                        keyword in course.get('description', '').lower() or
                        keyword in course.get('category_name', '').lower() or
                        keyword in course.get('instructor_name', '').lower()):
                        filtered_results.append(course)
                        break
            return filtered_results
        
        # Xử lý list/filter
        elif operation in ['list', 'filter']:
            limit = 10 if operation == 'list' else 20
            return self.db_service.get_courses(filters, limit)
        
        return []
    
    def _handle_problem_query(self, parsed_query: Dict[str, Any]) -> List[Dict]:
        """Xử lý truy vấn problems"""
        operation = parsed_query['operation']
        filters = parsed_query['filters']
        search_keywords = parsed_query['search_keywords']
        
        # Xử lý search
        if operation == 'search' and search_keywords:
            results = self.db_service.get_problems(filters, 20)
            # Lọc theo từ khóa tìm kiếm
            filtered_results = []
            for problem in results:
                for keyword in search_keywords:
                    if (keyword in problem.get('title', '').lower() or 
                        keyword in problem.get('description', '').lower() or
                        keyword in problem.get('category_name', '').lower()):
                        filtered_results.append(problem)
                        break
            return filtered_results
        
        # Xử lý list/filter
        elif operation in ['list', 'filter']:
            limit = 10 if operation == 'list' else 20
            return self.db_service.get_problems(filters, limit)
        
        return []
    
    def _handle_document_query(self, parsed_query: Dict[str, Any]) -> List[Dict]:
        """Xử lý truy vấn documents"""
        operation = parsed_query['operation']
        filters = parsed_query['filters']
        search_keywords = parsed_query['search_keywords']
        
        # Xử lý search
        if operation == 'search' and search_keywords:
            results = self.db_service.get_documents(filters, 20)
            # Lọc theo từ khóa tìm kiếm
            filtered_results = []
            for doc in results:
                for keyword in search_keywords:
                    if (keyword in doc.get('title', '').lower() or 
                        keyword in doc.get('description', '').lower() or
                        keyword in doc.get('topic_name', '').lower() or
                        keyword in doc.get('author_name', '').lower()):
                        filtered_results.append(doc)
                        break
            return filtered_results
        
        # Xử lý list/filter
        elif operation in ['list', 'filter']:
            limit = 10 if operation == 'list' else 20
            return self.db_service.get_documents(filters, limit)
        
        return []
    
    def _handle_contest_query(self, parsed_query: Dict[str, Any]) -> List[Dict]:
        """Xử lý truy vấn contests"""
        operation = parsed_query['operation']
        filters = parsed_query['filters']
        search_keywords = parsed_query['search_keywords']
        
        # Xử lý search
        if operation == 'search' and search_keywords:
            results = self.db_service.get_contests(filters, 20)
            # Lọc theo từ khóa tìm kiếm
            filtered_results = []
            for contest in results:
                for keyword in search_keywords:
                    if (keyword in contest.get('title', '').lower() or 
                        keyword in contest.get('description', '').lower() or
                        keyword in contest.get('creator_name', '').lower()):
                        filtered_results.append(contest)
                        break
            return filtered_results
        
        # Xử lý list/filter
        elif operation in ['list', 'filter']:
            limit = 10 if operation == 'list' else 20
            return self.db_service.get_contests(filters, limit)
        
        return []
    
    def _handle_statistics_query(self, parsed_query: Dict[str, Any]) -> Dict[str, Any]:
        """Xử lý truy vấn thống kê"""
        return self.db_service.get_statistics()
    
    def _handle_search_query(self, parsed_query: Dict[str, Any]) -> Dict[str, List]:
        """Xử lý tìm kiếm tổng hợp"""
        search_keywords = parsed_query['search_keywords']
        
        if not search_keywords:
            return {}
        
        # Tìm kiếm trên tất cả bảng
        keyword = " ".join(search_keywords)
        return self.db_service.search_all(keyword, 5)
    
    def format_results_for_ai(self, results: Dict[str, Any]) -> str:
        """
        Format kết quả để AI có thể hiểu và trả lời
        """
        if not results:
            return "Không tìm thấy dữ liệu phù hợp với yêu cầu của bạn."
        
        formatted_parts = []
        
        # Format courses
        if 'courses' in results and results['courses']:
            courses = results['courses']
            formatted_parts.append("**KHÓA HỌC:**")
            for i, course in enumerate(courses[:5], 1):  # Giới hạn 5 kết quả đầu
                formatted_parts.append(
                    f"{i}. {course.get('title', 'N/A')} - "
                    f"Level: {course.get('level', 'N/A')}, "
                    f"Rating: {course.get('rating', 0)}/5, "
                    f"Học viên: {course.get('students', 0)}, "
                    f"Giảng viên: {course.get('instructor_name', 'N/A')}"
                )
        
        # Format problems
        if 'problems' in results and results['problems']:
            problems = results['problems']
            formatted_parts.append("\n**BÀI TẬP:**")
            for i, problem in enumerate(problems[:5], 1):
                formatted_parts.append(
                    f"{i}. {problem.get('title', 'N/A')} - "
                    f"Độ khó: {problem.get('difficulty', 'N/A')}, "
                    f"Tỷ lệ AC: {problem.get('acceptance', 0)}%, "
                    f"Lượt thích: {problem.get('likes', 0)}, "
                    f"Đã giải: {problem.get('solved_count', 0)}"
                )
        
        # Format documents
        if 'documents' in results and results['documents']:
            documents = results['documents']
            formatted_parts.append("\n**TÀI LIỆU:**")
            for i, doc in enumerate(documents[:5], 1):
                formatted_parts.append(
                    f"{i}. {doc.get('title', 'N/A')} - "
                    f"Level: {doc.get('level', 'N/A')}, "
                    f"Rating: {doc.get('rating', 0)}/5, "
                    f"Chủ đề: {doc.get('topic_name', 'N/A')}, "
                    f"Tác giả: {doc.get('author_name', 'N/A')}"
                )
        
        # Format contests
        if 'contests' in results and results['contests']:
            contests = results['contests']
            formatted_parts.append("\n**CUỘC THI:**")
            for i, contest in enumerate(contests[:5], 1):
                formatted_parts.append(
                    f"{i}. {contest.get('title', 'N/A')} - "
                    f"Bắt đầu: {contest.get('start_time', 'N/A')}, "
                    f"Kết thúc: {contest.get('end_time', 'N/A')}, "
                    f"Người tạo: {contest.get('creator_name', 'N/A')}"
                )
        
        # Format statistics
        if 'statistics' in results and results['statistics']:
            stats = results['statistics']
            formatted_parts.append("\n**THỐNG KÊ:**")
            if 'courses' in stats:
                formatted_parts.append(
                    f"- Khóa học: {stats['courses'].get('total', 0)} khóa học "
                    f"(Rating TB: {stats['courses'].get('average_rating', 0)}/5)"
                )
            if 'problems' in stats:
                formatted_parts.append(
                    f"- Bài tập: {stats['problems'].get('total', 0)} bài tập "
                    f"(Tỷ lệ AC TB: {stats['problems'].get('average_acceptance', 0)}%)"
                )
            if 'documents' in stats:
                formatted_parts.append(
                    f"- Tài liệu: {stats['documents'].get('total', 0)} tài liệu "
                    f"(Rating TB: {stats['documents'].get('average_rating', 0)}/5)"
                )
            if 'contests' in stats:
                formatted_parts.append(
                    f"- Cuộc thi: {stats['contests'].get('total', 0)} cuộc thi"
                )
        
        return "\n".join(formatted_parts)
    
    def get_query_suggestions(self, parsed_query: Dict[str, Any]) -> List[str]:
        """
        Đề xuất các câu hỏi liên quan
        """
        suggestions = []
        query_types = parsed_query['query_types']
        
        if QueryType.COURSE in query_types:
            suggestions.extend([
                "Có những khóa học nâng cao nào?",
                "Khóa học nào có rating cao nhất?",
                "Những khóa học miễn phí có gì?"
            ])
        
        if QueryType.PROBLEM in query_types:
            suggestions.extend([
                "Có bài tập dễ nào để luyện tập?",
                "Bài tập nào có tỷ lệ AC cao?",
                "Những bài tập thuật toán khó có gì?"
            ])
        
        if QueryType.DOCUMENT in query_types:
            suggestions.extend([
                "Tài liệu học Python cơ bản có gì?",
                "Có hướng dẫn về cấu trúc dữ liệu không?",
                "Tài liệu về lập trình web có không?"
            ])
        
        if QueryType.CONTEST in query_types:
            suggestions.extend([
                "Có cuộc thi nào sắp diễn ra?",
                "Cuộc thi đang diễn ra có gì?",
                "Lịch sử các cuộc thi như thế nào?"
            ])
        
        return suggestions[:3]  # Giới hạn 3 đề xuất