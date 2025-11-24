# RAG Public Data API Documentation

API này cung cấp dữ liệu công khai (public data) dưới dạng JSON nested với foreign keys để tích hợp với hệ thống Chat AI RAG (Retrieval-Augmented Generation).

## Tổng Quan

API trả về dữ liệu theo cấu trúc nested JSON tương tự như `cake.json`, với các foreign keys được embed trực tiếp vào object thay vì chỉ trả về ID.

## Base URL

```
/api/v1/rag
```

## Endpoints

### 1. Lấy Tất Cả Dữ Liệu Public

**GET** `/api/v1/rag/public-data`

Trả về tất cả dữ liệu public từ tất cả các bảng.

**Response:**
```json
{
  "success": true,
  "data": {
    "items": {
      "courses": {
        "course": [...]
      },
      "documents": {
        "document": [...]
      },
      "problems": {
        "problem": [...]
      },
      "contests": {
        "contest": [...]
      },
      "gamification": {...},
      "forums": {
        "forum": [...]
      },
      "games": {
        "game": [...]
      },
      "system": {...},
      "users": {
        "user": [...]
      }
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Lấy Dữ Liệu Theo Category

**GET** `/api/v1/rag/public-data/:category`

Lấy dữ liệu public của một category cụ thể.

**Categories hợp lệ:**
- `courses`
- `documents`
- `problems`
- `contests`
- `gamification`
- `forums`
- `games`
- `system`
- `users`

**Ví dụ:**
```
GET /api/v1/rag/public-data/courses
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": {
      "courses": {
        "course": [...]
      }
    }
  },
  "category": "courses",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 3. Lấy Courses

**GET** `/api/v1/rag/courses`

Trả về danh sách courses với nested data:
- Category
- Modules (với Lessons)
- Reviews (với User info)
- Languages
- Related Courses

**Response:**
```json
{
  "success": true,
  "data": {
    "items": {
      "courses": {
        "course": [
          {
            "id": 1,
            "title": "Course Title",
            "description": "Course description",
            "thumbnail": "url",
            "rating": 4.5,
            "students": 100,
            "level": "Beginner",
            "duration": 120,
            "price": 0,
            "original_price": 0,
            "discount": 0,
            "status": "published",
            "is_premium": false,
            "is_free": true,
            "publish_date": "2024-01-01",
            "created_at": "2024-01-01T00:00:00.000Z",
            "category": {
              "id": 1,
              "name": "Category Name",
              "description": "Category description",
              "created_at": "2024-01-01T00:00:00.000Z"
            },
            "modules": [
              {
                "id": 1,
                "title": "Module Title",
                "position": 1,
                "created_at": "2024-01-01T00:00:00.000Z",
                "lessons": [
                  {
                    "id": 1,
                    "title": "Lesson Title",
                    "type": "document",
                    "duration": 30,
                    "position": 1,
                    "created_at": "2024-01-01T00:00:00.000Z"
                  }
                ]
              }
            ],
            "reviews": [
              {
                "id": 1,
                "rating": 5,
                "comment": "Great course!",
                "helpful": 10,
                "not_helpful": 0,
                "created_at": "2024-01-01T00:00:00.000Z",
                "user": {
                  "id": 1,
                  "name": "User Name",
                  "avatar_url": "url"
                }
              }
            ],
            "languages": [
              {
                "id": 1,
                "course_id": 1,
                "language": "Vietnamese",
                "created_at": "2024-01-01T00:00:00.000Z"
              }
            ],
            "related_courses": [
              {
                "id": 1,
                "course_id": 1,
                "related_course_id": 2,
                "created_at": "2024-01-01T00:00:00.000Z"
              }
            ]
          }
        ]
      }
    }
  },
  "count": 10,
  "timestamp": "2024-01-01T00:00:00:00.000Z"
}
```

### 4. Lấy Documents

**GET** `/api/v1/rag/documents`

Trả về danh sách documents với nested data:
- Topic
- Categories
- Modules (với Lessons và Animations)
- Animations

**Response:**
```json
{
  "success": true,
  "data": {
    "items": {
      "documents": {
        "document": [
          {
            "id": 1,
            "title": "Document Title",
            "description": "Description",
            "content": "Content...",
            "level": "Beginner",
            "duration": 60,
            "students": 50,
            "rating": 4.0,
            "thumbnail_url": "url",
            "created_at": "2024-01-01T00:00:00.000Z",
            "topic": {
              "id": 1,
              "name": "Topic Name",
              "created_at": "2024-01-01T00:00:00.000Z"
            },
            "categories": [
              {
                "id": 1,
                "name": "Category Name",
                "description": "Description",
                "created_at": "2024-01-01T00:00:00.000Z"
              }
            ],
            "modules": [
              {
                "id": 1,
                "title": "Module Title",
                "position": 1,
                "created_at": "2024-01-01T00:00:00.000Z",
                "lessons": [
                  {
                    "id": 1,
                    "title": "Lesson Title",
                    "content": "Content...",
                    "code_example": "Code...",
                    "position": 1,
                    "created_at": "2024-01-01T00:00:00.000Z",
                    "animations": []
                  }
                ]
              }
            ],
            "animations": []
          }
        ]
      }
    }
  },
  "count": 10,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 5. Lấy Problems

**GET** `/api/v1/rag/problems`

Trả về danh sách problems với nested data:
- Category
- Tags
- Examples
- Constraints
- Test Cases (chỉ sample)
- Starter Codes
- Comments (với User info)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": {
      "problems": {
        "problem": [
          {
            "id": 1,
            "title": "Problem Title",
            "description": "Description",
            "difficulty": "Easy",
            "estimated_time": "30 minutes",
            "likes": 10,
            "dislikes": 0,
            "acceptance": 85.5,
            "total_submissions": 100,
            "solved_count": 85,
            "is_new": false,
            "is_popular": true,
            "created_at": "2024-01-01T00:00:00.000Z",
            "category": {
              "id": 1,
              "name": "Category Name",
              "description": "Description",
              "created_at": "2024-01-01T00:00:00.000Z"
            },
            "tags": [
              {
                "id": 1,
                "name": "Tag Name",
                "created_at": "2024-01-01T00:00:00.000Z"
              }
            ],
            "examples": [
              {
                "id": 1,
                "input": "Input example",
                "output": "Output example",
                "explanation": "Explanation",
                "created_at": "2024-01-01T00:00:00.000Z"
              }
            ],
            "constraints": [
              {
                "id": 1,
                "constraint_text": "Constraint text",
                "created_at": "2024-01-01T00:00:00.000Z"
              }
            ],
            "test_cases": [
              {
                "id": 1,
                "input": "Test input",
                "expected_output": "Expected output",
                "is_sample": true,
                "created_at": "2024-01-01T00:00:00.000Z"
              }
            ],
            "starter_codes": [
              {
                "id": 1,
                "language": "javascript",
                "code": "function solution() {}",
                "created_at": "2024-01-01T00:00:00.000Z"
              }
            ],
            "comments": [
              {
                "id": 1,
                "content": "Comment text",
                "created_at": "2024-01-01T00:00:00.000Z",
                "updated_at": "2024-01-01T00:00:00.000Z",
                "user": {
                  "id": 1,
                  "name": "User Name",
                  "avatar_url": "url"
                }
              }
            ]
          }
        ]
      }
    }
  },
  "count": 10,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 6. Lấy Contests

**GET** `/api/v1/rag/contests`

Trả về danh sách contests với nested problems.

**Response:**
```json
{
  "success": true,
  "data": {
    "items": {
      "contests": {
        "contest": [
          {
            "id": 1,
            "title": "Contest Title",
            "description": "Description",
            "start_time": "2024-01-01T00:00:00.000Z",
            "end_time": "2024-01-02T00:00:00.000Z",
            "created_at": "2024-01-01T00:00:00.000Z",
            "problems": [
              {
                "id": 1,
                "problem_id": 1,
                "score": 100,
                "created_at": "2024-01-01T00:00:00.000Z",
                "problem": {
                  "id": 1,
                  "title": "Problem Title",
                  "difficulty": "Easy",
                  "description": "Description"
                }
              }
            ]
          }
        ]
      }
    }
  },
  "count": 5,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Điều Kiện Lọc Dữ Liệu

### Courses
- Chỉ trả về courses có `status = 'published'` và `is_deleted = false`
- Reviews chỉ trả về những review đã được `verified = true`

### Documents
- Chỉ trả về documents có `is_deleted = false`

### Problems
- Chỉ trả về problems có `is_premium = false` và `is_deleted = false`
- Test cases chỉ trả về những case có `is_sample = true`

### Contests
- Chỉ trả về contests có `is_deleted = false`

### Users
- Chỉ trả về users có `is_active = true`
- Profile chỉ trả về khi `visibility_profile = true`
- Stats chỉ trả về khi `visibility_progress = true`
- Achievements chỉ trả về khi `visibility_achievements = true`

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid category. Valid categories are: courses, documents, problems, ..."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to fetch public data",
  "error": "Error details (only in development)"
}
```

## Ghi Chú

1. Tất cả các endpoints này là **public** - không cần authentication
2. Dữ liệu được format theo cấu trúc nested JSON để dễ dàng tích hợp với RAG system
3. Foreign keys được embed trực tiếp vào object thay vì chỉ trả về ID
4. API có thể trả về lượng dữ liệu lớn, nên cân nhắc sử dụng pagination trong tương lai
5. Một số model có thể chưa tồn tại (như Forum, Translation) - service sẽ sử dụng raw SQL queries để lấy dữ liệu

## Sử Dụng Với RAG System

Dữ liệu từ API này có thể được sử dụng để:
1. Tạo JSON file cho jsonQueryRAG system
2. Feed vào vector database cho semantic search
3. Sử dụng với LLM để trả lời câu hỏi về hệ thống

**Ví dụ sử dụng:**
```javascript
// Fetch all public data
const response = await fetch('/api/v1/rag/public-data');
const data = await response.json();

// Save to JSON file for RAG
fs.writeFileSync('public-data.json', JSON.stringify(data.data, null, 2));

// Use with jsonQueryRAG
const dataLoader = new DataLoader();
dataLoader.json_path = 'public-data.json';
const jsonValue = dataLoader.load_json();
```

