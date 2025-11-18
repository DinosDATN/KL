# Hướng Dẫn Debug Contest - Không Hiển Thị Bài Tập

## Các Bước Debug

### 1. Kiểm Tra API Server
```bash
# Kiểm tra server có đang chạy không
curl http://localhost:3000/api/contests

# Nếu không chạy, khởi động server
cd api
npm start
```

### 2. Kiểm Tra Database
```sql
-- Kiểm tra có dữ liệu contest không
SELECT * FROM contests LIMIT 5;

-- Kiểm tra có dữ liệu contest_problems không
SELECT cp.*, p.title 
FROM contest_problems cp
LEFT JOIN problems p ON cp.problem_id = p.id
WHERE cp.contest_id = 1;

-- Nếu không có dữ liệu, chạy lại script insert
SOURCE api/sql-scripts/002-6-contest-system.sql;
```

### 3. Kiểm Tra API Endpoint
```bash
# Test API lấy danh sách bài tập
curl http://localhost:3000/api/contests/1/problems

# Kết quả mong đợi:
# {
#   "success": true,
#   "data": [
#     {
#       "id": 1,
#       "contest_id": 1,
#       "problem_id": 1,
#       "score": 100,
#       "Problem": {
#         "id": 1,
#         "title": "Two Sum",
#         "difficulty": "Easy"
#       }
#     }
#   ]
# }
```

### 4. Kiểm Tra Browser Console
Mở DevTools (F12) và kiểm tra:

#### Console Tab
```javascript
// Kiểm tra có lỗi JavaScript không
// Tìm các lỗi màu đỏ

// Kiểm tra API call
// Tìm các request đến /api/contests/:id/problems
```

#### Network Tab
1. Mở Network tab
2. Reload trang chi tiết contest
3. Tìm request đến `/api/contests/:id/problems`
4. Kiểm tra:
   - Status Code: Phải là 200
   - Response: Phải có data array
   - Headers: Kiểm tra CORS

**Các lỗi thường gặp:**

| Status Code | Nguyên nhân | Giải pháp |
|-------------|-------------|-----------|
| 401 | Yêu cầu authentication | Đã fix bằng cách thêm optionalAuth |
| 403 | Yêu cầu registration | Đã fix bằng cách xóa kiểm tra registration |
| 404 | Contest không tồn tại | Kiểm tra contest_id có đúng không |
| 500 | Lỗi server | Kiểm tra log server |

### 5. Kiểm Tra Component State
Thêm log vào component để debug:

```typescript
// Trong contest-detail.component.ts
private loadContestProblems(contestId: number): void {
  console.log('Loading problems for contest:', contestId); // ADD THIS
  
  this.contestService.getContestProblems(contestId).subscribe({
    next: (response) => {
      console.log('Problems response:', response); // ADD THIS
      
      if (response.success) {
        this.contestProblems = response.data;
        console.log('Contest problems loaded:', this.contestProblems); // ADD THIS
      }
      this.loading = false;
    },
    error: (error) => {
      console.error('Error loading contest problems:', error);
      this.loading = false;
    }
  });
}
```

### 6. Kiểm Tra Service
Thêm log vào service:

```typescript
// Trong contest.service.ts
getContestProblems(contestId: number): Observable<ApiResponse<ContestProblem[]>> {
  console.log('Calling API for contest problems:', contestId); // ADD THIS
  return this.http.get<ApiResponse<ContestProblem[]>>(`${this.apiUrl}/${contestId}/problems`);
}
```

### 7. Kiểm Tra Environment
```typescript
// Trong cli/src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api' // Đảm bảo URL đúng
};
```

### 8. Kiểm Tra CORS
Nếu có lỗi CORS, kiểm tra file `api/src/index.js`:

```javascript
// Đảm bảo có CORS middleware
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:4200', // Angular dev server
  credentials: true
}));
```

## Các Lỗi Thường Gặp

### Lỗi 1: "You must register for the contest to view problems"
**Nguyên nhân:** Chưa áp dụng fix
**Giải pháp:** Áp dụng fix trong CONTEST_FIX_SUMMARY.md

### Lỗi 2: "Access token is required"
**Nguyên nhân:** Route vẫn yêu cầu authentication
**Giải pháp:** Đảm bảo route sử dụng `optionalAuth` thay vì `authenticateToken`

### Lỗi 3: Danh sách bài tập rỗng
**Nguyên nhân:** 
- Không có dữ liệu trong database
- API không trả về đúng format

**Giải pháp:**
```bash
# Kiểm tra database
mysql -u root -p lfysdb
SELECT * FROM contest_problems WHERE contest_id = 1;

# Nếu rỗng, chạy lại script insert
SOURCE api/sql-scripts/002-6-contest-system.sql;
```

### Lỗi 4: "Cannot read property 'Problem' of undefined"
**Nguyên nhân:** API không include Problem trong response

**Giải pháp:** Kiểm tra controller có include Problem không:
```javascript
include: [{
  model: Problem,
  as: 'Problem',
  attributes: ['id', 'title', 'description', 'difficulty', 'estimated_time']
}]
```

## Checklist Debug

- [ ] API server đang chạy
- [ ] Database có dữ liệu contest và contest_problems
- [ ] API endpoint `/contests/:id/problems` trả về 200
- [ ] Response có format đúng với `success: true` và `data: []`
- [ ] Browser console không có lỗi
- [ ] Network tab hiển thị request thành công
- [ ] Component state `contestProblems` có dữ liệu
- [ ] Template hiển thị đúng với `*ngIf="contestProblems.length > 0"`

## Liên Hệ
Nếu vẫn còn vấn đề sau khi thử tất cả các bước trên, vui lòng cung cấp:
1. Screenshot console errors
2. Screenshot network tab
3. Log từ server
4. Kết quả query database
