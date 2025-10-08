import mysql.connector
from typing import List, Dict, Any, Optional
import logging

# Cấu hình logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseService:
    """
    Service class để xử lý các truy vấn database một cách an toàn
    Chỉ cho phép truy vấn các bảng: Courses, Problems, Documents, Contests
    """
    
    # Các bảng được phép truy vấn
    ALLOWED_TABLES = {
        'courses': {
            'main_table': 'courses',
            'allowed_columns': ['id', 'title', 'description', 'level', 'duration', 'students', 'rating', 'status', 'price', 'is_premium'],
            'joins': {
                'course_categories': 'courses.category_id = course_categories.id',
                'users': 'courses.instructor_id = users.id'
            }
        },
        'problems': {
            'main_table': 'problems',
            'allowed_columns': ['id', 'title', 'description', 'difficulty', 'estimated_time', 'likes', 'dislikes', 'acceptance', 'total_submissions', 'solved_count'],
            'joins': {
                'problem_categories': 'problems.category_id = problem_categories.id',
                'tags': 'problems.id = problem_tags.problem_id AND problem_tags.tag_id = tags.id'
            }
        },
        'documents': {
            'main_table': 'documents',
            'allowed_columns': ['id', 'title', 'description', 'content', 'level', 'duration', 'students', 'rating', 'thumbnail_url'],
            'joins': {
                'topics': 'documents.topic_id = topics.id',
                'users': 'documents.created_by = users.id'
            }
        },
        'contests': {
            'main_table': 'contests',
            'allowed_columns': ['id', 'title', 'description', 'start_time', 'end_time'],
            'joins': {
                'users': 'contests.created_by = users.id'
            }
        }
    }
    
    def __init__(self):
        self.db_config = {
            'host': 'localhost',
            'user': 'api_user',
            'password': 'api_password',
            'database': 'lfysdb',
            'charset': 'utf8mb4'
        }
    
    def _get_connection(self):
        """Tạo kết nối đến database"""
        try:
            return mysql.connector.connect(**self.db_config)
        except mysql.connector.Error as e:
            logger.error(f"Database connection error: {e}")
            raise
    
    def _validate_table(self, table_name: str) -> bool:
        """Kiểm tra xem bảng có được phép truy vấn không"""
        return table_name.lower() in self.ALLOWED_TABLES
    
    def _validate_columns(self, table_name: str, columns: List[str]) -> bool:
        """Kiểm tra xem các cột có được phép truy vấn không"""
        if not self._validate_table(table_name):
            return False
        
        allowed_columns = self.ALLOWED_TABLES[table_name.lower()]['allowed_columns']
        return all(col in allowed_columns for col in columns)
    
    def get_courses(self, filters: Dict[str, Any] = None, limit: int = 10) -> List[Dict]:
        """
        Lấy danh sách khóa học với các bộ lọc
        """
        try:
            connection = self._get_connection()
            cursor = connection.cursor(dictionary=True)
            
            # Base query
            query = """
            SELECT c.id, c.title, c.description, c.level, c.duration, 
                   c.students, c.rating, c.status, c.price, c.is_premium,
                   cc.name as category_name, u.username as instructor_name
            FROM courses c
            LEFT JOIN course_categories cc ON c.category_id = cc.id
            LEFT JOIN users u ON c.instructor_id = u.id
            WHERE c.is_deleted = FALSE
            """
            
            params = []
            
            # Thêm các điều kiện lọc
            if filters:
                if 'level' in filters:
                    query += " AND c.level = %s"
                    params.append(filters['level'])
                
                if 'status' in filters:
                    query += " AND c.status = %s"
                    params.append(filters['status'])
                
                if 'is_premium' in filters:
                    query += " AND c.is_premium = %s"
                    params.append(filters['is_premium'])
                
                if 'min_rating' in filters:
                    query += " AND c.rating >= %s"
                    params.append(filters['min_rating'])
            
            query += " ORDER BY c.created_at DESC LIMIT %s"
            params.append(limit)
            
            cursor.execute(query, params)
            result = cursor.fetchall()
            
            cursor.close()
            connection.close()
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting courses: {e}")
            return []
    
    def get_problems(self, filters: Dict[str, Any] = None, limit: int = 10) -> List[Dict]:
        """
        Lấy danh sách bài tập với các bộ lọc
        """
        try:
            connection = self._get_connection()
            cursor = connection.cursor(dictionary=True)
            
            query = """
            SELECT p.id, p.title, p.description, p.difficulty, p.estimated_time,
                   p.likes, p.dislikes, p.acceptance, p.total_submissions, p.solved_count,
                   pc.name as category_name
            FROM problems p
            LEFT JOIN problem_categories pc ON p.category_id = pc.id
            WHERE p.is_deleted = FALSE
            """
            
            params = []
            
            if filters:
                if 'difficulty' in filters:
                    query += " AND p.difficulty = %s"
                    params.append(filters['difficulty'])
                
                if 'is_popular' in filters:
                    query += " AND p.is_popular = %s"
                    params.append(filters['is_popular'])
                
                if 'min_acceptance' in filters:
                    query += " AND p.acceptance >= %s"
                    params.append(filters['min_acceptance'])
            
            query += " ORDER BY p.created_at DESC LIMIT %s"
            params.append(limit)
            
            cursor.execute(query, params)
            result = cursor.fetchall()
            
            cursor.close()
            connection.close()
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting problems: {e}")
            return []
    
    def get_documents(self, filters: Dict[str, Any] = None, limit: int = 10) -> List[Dict]:
        """
        Lấy danh sách tài liệu với các bộ lọc
        """
        try:
            connection = self._get_connection()
            cursor = connection.cursor(dictionary=True)
            
            query = """
            SELECT d.id, d.title, d.description, d.level, d.duration,
                   d.students, d.rating, d.thumbnail_url,
                   t.name as topic_name, u.username as author_name
            FROM documents d
            LEFT JOIN topics t ON d.topic_id = t.id
            LEFT JOIN users u ON d.created_by = u.id
            WHERE d.is_deleted = FALSE
            """
            
            params = []
            
            if filters:
                if 'level' in filters:
                    query += " AND d.level = %s"
                    params.append(filters['level'])
                
                if 'topic_id' in filters:
                    query += " AND d.topic_id = %s"
                    params.append(filters['topic_id'])
                
                if 'min_rating' in filters:
                    query += " AND d.rating >= %s"
                    params.append(filters['min_rating'])
            
            query += " ORDER BY d.created_at DESC LIMIT %s"
            params.append(limit)
            
            cursor.execute(query, params)
            result = cursor.fetchall()
            
            cursor.close()
            connection.close()
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting documents: {e}")
            return []
    
    def get_contests(self, filters: Dict[str, Any] = None, limit: int = 10) -> List[Dict]:
        """
        Lấy danh sách cuộc thi với các bộ lọc
        """
        try:
            connection = self._get_connection()
            cursor = connection.cursor(dictionary=True)
            
            query = """
            SELECT c.id, c.title, c.description, c.start_time, c.end_time,
                   u.username as creator_name
            FROM contests c
            LEFT JOIN users u ON c.created_by = u.id
            WHERE 1=1
            """
            
            params = []
            
            if filters:
                if 'status' in filters:
                    if filters['status'] == 'ongoing':
                        query += " AND NOW() BETWEEN c.start_time AND c.end_time"
                    elif filters['status'] == 'upcoming':
                        query += " AND c.start_time > NOW()"
                    elif filters['status'] == 'finished':
                        query += " AND c.end_time < NOW()"
            
            query += " ORDER BY c.start_time DESC LIMIT %s"
            params.append(limit)
            
            cursor.execute(query, params)
            result = cursor.fetchall()
            
            cursor.close()
            connection.close()
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting contests: {e}")
            return []
    
    def search_all(self, keyword: str, limit: int = 5) -> Dict[str, List]:
        """
        Tìm kiếm tổng hợp trên tất cả các bảng được phép
        """
        results = {
            'courses': [],
            'problems': [],
            'documents': [],
            'contests': []
        }
        
        # Tìm kiếm courses
        course_filters = {}
        if keyword:
            courses_data = self.get_courses(course_filters, limit)
            results['courses'] = [c for c in courses_data if keyword.lower() in c.get('title', '').lower() or keyword.lower() in c.get('description', '').lower()]
        
        # Tìm kiếm problems
        problem_filters = {}
        if keyword:
            problems_data = self.get_problems(problem_filters, limit)
            results['problems'] = [p for p in problems_data if keyword.lower() in p.get('title', '').lower() or keyword.lower() in p.get('description', '').lower()]
        
        # Tìm kiếm documents
        document_filters = {}
        if keyword:
            documents_data = self.get_documents(document_filters, limit)
            results['documents'] = [d for d in documents_data if keyword.lower() in d.get('title', '').lower() or keyword.lower() in d.get('description', '').lower()]
        
        # Tìm kiếm contests
        contest_filters = {}
        if keyword:
            contests_data = self.get_contests(contest_filters, limit)
            results['contests'] = [c for c in contests_data if keyword.lower() in c.get('title', '').lower() or keyword.lower() in c.get('description', '').lower()]
        
        return results
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Lấy thống kê tổng quan
        """
        try:
            connection = self._get_connection()
            cursor = connection.cursor(dictionary=True)
            
            stats = {}
            
            # Thống kê courses
            cursor.execute("SELECT COUNT(*) as total, AVG(rating) as avg_rating FROM courses WHERE is_deleted = FALSE AND status = 'published'")
            course_stats = cursor.fetchone()
            stats['courses'] = {
                'total': course_stats['total'],
                'average_rating': round(float(course_stats['avg_rating'] or 0), 2)
            }
            
            # Thống kê problems
            cursor.execute("SELECT COUNT(*) as total, AVG(acceptance) as avg_acceptance FROM problems WHERE is_deleted = FALSE")
            problem_stats = cursor.fetchone()
            stats['problems'] = {
                'total': problem_stats['total'],
                'average_acceptance': round(float(problem_stats['avg_acceptance'] or 0), 2)
            }
            
            # Thống kê documents
            cursor.execute("SELECT COUNT(*) as total, AVG(rating) as avg_rating FROM documents WHERE is_deleted = FALSE")
            document_stats = cursor.fetchone()
            stats['documents'] = {
                'total': document_stats['total'],
                'average_rating': round(float(document_stats['avg_rating'] or 0), 2)
            }
            
            # Thống kê contests
            cursor.execute("SELECT COUNT(*) as total FROM contests")
            contest_stats = cursor.fetchone()
            stats['contests'] = {
                'total': contest_stats['total']
            }
            
            cursor.close()
            connection.close()
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting statistics: {e}")
            return {}