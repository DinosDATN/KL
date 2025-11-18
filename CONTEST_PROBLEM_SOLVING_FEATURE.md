# ✨ Tính Năng Mới: Làm Bài Tập Trong Cuộc Thi

## 🎯 Mô Tả
Người dùng đã đăng ký cuộc thi có thể làm bài tập trực tiếp khi cuộc thi đang diễn ra.

## ✅ Tính Năng Đã Thêm

### 1. Nút "Làm Bài Tập" Trong Contest Detail
**File:** `cli/src/app/features/contests/contest-detail/contest-detail.component.html`

**Hiển thị:**
- ✅ Nút "Làm bài tập" (màu xanh lá) - Khi user đã đăng ký và contest đang active
- ✅ Nút "Xem chi tiết" (màu xanh dương) - Khi user chưa đăng ký hoặc contest chưa active

**Logic:**
```typescript
canStartProblem(): boolean {
  // User must be authenticated, registered, and contest must be active
  return this.authService.isAuthenticated() && 
         this.contest?.is_registered === true && 
         this.contest?.status === 'active';
}
```

### 2. Navigation Với Contest Context
**File:** `cli/src/app/features/contests/contest-detail/contest-detail.component.ts`

Khi nhấn "Làm bài tập", navigate đến problem detail với query params:
```typescript
this.router.navigate(['/problems', contestProblem.Problem.id], {
  queryParams: {
    contest_id: this.contest.id,
    contest_problem_id: contestProblem.id
  }
});
```

### 3. Contest Mode Banner
**File:** `cli/src/app/features/problems/problem-detail/problem-detail.component.html`

Hiển thị banner màu tím-xanh ở đầu trang khi đang trong contest mode:
- 🏆 Icon và text "Chế độ thi đấu"
- 📝 "Bạn đang làm bài trong cuộc thi"
- 🔙 Nút "Quay lại cuộc thi"

### 4. Contest Submission
**File:** `cli/src/app/features/problems/problem-detail/components/code-editor/code-editor.component.ts`

Khi submit code trong contest mode:
- ✅ Gọi API `contestService.submitToContest()` thay vì `problemsService.submitCode()`
- ✅ Truyền `contest_id` và `problem_id`
- ✅ Nhận kết quả execution và điểm số
- ✅ Hiển thị notification với điểm số contest

## 📋 Luồng Hoạt Động

### Bước 1: Xem Danh Sách Cuộc Thi
```
User -> /contests
     -> Click vào một cuộc thi
     -> /contests/:id
```

### Bước 2: Đăng Ký Cuộc Thi
```
User -> Click "Tham gia cuộc thi"
     -> API: POST /api/v1/contests/:id/register
     -> Nút chuyển thành "Hủy tham gia"
```

### Bước 3: Xem Danh Sách Bài Tập
```
User -> Xem danh sách bài tập (không cần đăng ký)
     -> Mỗi bài tập hiển thị:
        - Tên bài
        - Độ khó
        - Điểm số
        - Nút "Làm bài tập" (nếu đã đăng ký và contest active)
```

### Bước 4: Làm Bài Tập
```
User -> Click "Làm bài tập"
     -> Navigate: /problems/:id?contest_id=X&contest_problem_id=Y
     -> Hiển thị banner "Chế độ thi đấu"
     -> Code editor với contest context
```

### Bước 5: Submit Code
```
User -> Viết code
     -> Click "Submit"
     -> API: POST /api/v1/contests/:contest_id/problems/:problem_id/submit
     -> Nhận kết quả:
        - Execution result (passed/failed)
        - Score (điểm số)
        - Test cases results
     -> Hiển thị notification
```

## 🎨 UI/UX

### Contest Detail Page
```
┌─────────────────────────────────────────────────┐
│ Contest Header                                   │
│ - Title, Description, Stats                     │
│ - Nút "Tham gia" / "Hủy tham gia"              │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ Bài tập cuộc thi                                │
├─────────────────────────────────────────────────┤
│ #1  Two Sum                    [Easy]  100 điểm │
│     Thời gian ước tính: 15 phút                 │
│                          [🟢 Làm bài tập]       │
├─────────────────────────────────────────────────┤
│ #2  Add Two Numbers          [Medium]  150 điểm │
│     Thời gian ước tính: 30 phút                 │
│                          [🟢 Làm bài tập]       │
└─────────────────────────────────────────────────┘
```

### Problem Detail Page (Contest Mode)
```
┌─────────────────────────────────────────────────┐
│ 🏆 Chế độ thi đấu                               │
│    Bạn đang làm bài trong cuộc thi              │
│                        [Quay lại cuộc thi]      │
└─────────────────────────────────────────────────┘
┌──────────────────┬──────────────────────────────┐
│ Problem          │ Code Editor                  │
│ Description      │                              │
│                  │ [Language Selector]          │
│ Examples         │                              │
│                  │ [Code Area]                  │
│                  │                              │
│                  │ [Run] [Submit]               │
└──────────────────┴──────────────────────────────┘
```

## 🔐 Quyền Truy Cập

### Xem Danh Sách Bài Tập
- ✅ Mọi người (không cần đăng nhập)
- ✅ Không cần đăng ký cuộc thi

### Nút "Làm Bài Tập"
- ✅ Phải đăng nhập
- ✅ Phải đăng ký cuộc thi
- ✅ Cuộc thi phải đang active

### Submit Code
- ✅ Phải đăng nhập
- ✅ Phải đăng ký cuộc thi
- ✅ Cuộc thi phải đang active

## 📊 API Endpoints Sử Dụng

### 1. Lấy Danh Sách Bài Tập
```
GET /api/v1/contests/:id/problems
Response: {
  success: true,
  data: [
    {
      id: 1,
      contest_id: 1,
      problem_id: 1,
      score: 100,
      Problem: {
        id: 1,
        title: "Two Sum",
        difficulty: "Easy"
      }
    }
  ]
}
```

### 2. Submit Code Trong Contest
```
POST /api/v1/contests/:contest_id/problems/:problem_id/submit
Body: {
  sourceCode: "...",
  language: "python"
}
Response: {
  success: true,
  data: {
    submission: {
      id: 123,
      status: "accepted",
      score: 100
    },
    execution_result: {
      status: "accepted",
      testResults: [...]
    }
  }
}
```

## 🧪 Testing

### Test Case 1: User Chưa Đăng Nhập
1. Truy cập `/contests/1`
2. Xem danh sách bài tập
3. Kiểm tra: Hiển thị nút "Xem chi tiết" (không phải "Làm bài tập")

### Test Case 2: User Đã Đăng Nhập Nhưng Chưa Đăng Ký
1. Đăng nhập
2. Truy cập `/contests/1`
3. Xem danh sách bài tập
4. Kiểm tra: Hiển thị nút "Xem chi tiết"

### Test Case 3: User Đã Đăng Ký, Contest Active
1. Đăng nhập
2. Đăng ký cuộc thi
3. Xem danh sách bài tập
4. Kiểm tra: Hiển thị nút "Làm bài tập" (màu xanh lá)

### Test Case 4: Làm Bài Tập Trong Contest
1. Click "Làm bài tập"
2. Kiểm tra: Navigate đến `/problems/:id?contest_id=X&contest_problem_id=Y`
3. Kiểm tra: Hiển thị banner "Chế độ thi đấu"
4. Viết code và submit
5. Kiểm tra: Gọi API contest submission
6. Kiểm tra: Hiển thị kết quả và điểm số

### Test Case 5: Contest Chưa Bắt Đầu
1. Đăng ký cuộc thi upcoming
2. Xem danh sách bài tập
3. Kiểm tra: Hiển thị nút "Xem chi tiết" (không cho làm bài)

### Test Case 6: Contest Đã Kết Thúc
1. Xem cuộc thi completed
2. Xem danh sách bài tập
3. Kiểm tra: Hiển thị nút "Xem chi tiết" (không cho làm bài)

## 📝 Files Đã Thay Đổi

### Frontend Components
1. `cli/src/app/features/contests/contest-detail/contest-detail.component.ts`
   - Thêm method `canStartProblem()`
   - Thêm method `onStartProblem()`
   - Thêm method `onViewProblem()`

2. `cli/src/app/features/contests/contest-detail/contest-detail.component.html`
   - Thêm nút "Làm bài tập" / "Xem chi tiết"
   - Thêm logic hiển thị conditional

3. `cli/src/app/features/problems/problem-detail/problem-detail.component.ts`
   - Thêm properties: `contestId`, `contestProblemId`, `isContestMode`
   - Thêm method `checkContestMode()`

4. `cli/src/app/features/problems/problem-detail/problem-detail.component.html`
   - Thêm contest mode banner
   - Truyền contest context vào code editor

5. `cli/src/app/features/problems/problem-detail/components/code-editor/code-editor.component.ts`
   - Thêm Input: `contestId`, `contestProblemId`, `isContestMode`
   - Inject `ContestService`
   - Cập nhật method `onSubmit()` để hỗ trợ contest submission
   - Thêm method `handleSubmissionError()`

## 🚀 Deployment

### Bước 1: Build Frontend
```bash
cd cli
npm run build
```

### Bước 2: Test Locally
```bash
# Start API server
cd api
npm start

# Start frontend
cd cli
npm start

# Test flow
1. Đăng nhập
2. Truy cập /contests
3. Đăng ký cuộc thi active
4. Click "Làm bài tập"
5. Submit code
```

### Bước 3: Verify
- ✅ Nút hiển thị đúng theo điều kiện
- ✅ Navigation với query params
- ✅ Banner contest mode hiển thị
- ✅ Submit code gọi đúng API
- ✅ Kết quả hiển thị đúng

## 💡 Cải Tiến Tương Lai

### 1. Timer Countdown
Hiển thị thời gian còn lại của cuộc thi trong banner

### 2. Auto-Save
Tự động lưu code khi đang làm bài

### 3. Submission History
Xem lịch sử các lần submit trong contest

### 4. Real-time Leaderboard
Cập nhật bảng xếp hạng real-time

### 5. Problem Status Indicator
Hiển thị trạng thái bài tập (chưa làm, đang làm, đã AC)

## 🎉 Kết Luận

Tính năng cho phép người dùng làm bài tập trong cuộc thi đã được implement hoàn chỉnh với:
- ✅ UI/UX trực quan và dễ sử dụng
- ✅ Logic phân quyền rõ ràng
- ✅ Contest context được truyền đúng
- ✅ Submit code trong contest mode
- ✅ Hiển thị kết quả và điểm số

Người dùng giờ có thể tham gia cuộc thi và làm bài tập một cách mượt mà!
