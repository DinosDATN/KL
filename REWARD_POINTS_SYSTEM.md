# Hệ thống Điểm thưởng (Reward Points System)

## Tổng quan

Hệ thống điểm thưởng cho phép người dùng nhận điểm khi hoàn thành các hoạt động như giải bài tập, chơi game Sudoku, và các thành tích khác.

## Cấu trúc Database

### 1. Bảng `user_stats`
- Thêm cột `reward_points` (INT, mặc định 0) để lưu tổng điểm thưởng của người dùng

### 2. Bảng `reward_transactions`
Lưu lịch sử tất cả các giao dịch điểm thưởng:
- `user_id`: ID người dùng
- `points`: Số điểm (dương = nhận, âm = tiêu)
- `transaction_type`: Loại giao dịch (problem_solved, sudoku_completed, etc.)
- `reference_type`: Loại tham chiếu (problem, game, achievement)
- `reference_id`: ID của đối tượng tham chiếu
- `metadata`: Thông tin bổ sung (JSON)
- `description`: Mô tả giao dịch

### 3. Bảng `reward_config`
Cấu hình điểm thưởng cho các hoạt động:
- `config_key`: Khóa cấu hình (ví dụ: problem_easy, sudoku_hard_base)
- `config_value`: Giá trị điểm thưởng
- `description`: Mô tả
- `is_active`: Trạng thái kích hoạt

## Cấu hình Điểm thưởng Mặc định

### Bài tập (Problems)
- **Easy**: 10 điểm
- **Medium**: 25 điểm
- **Hard**: 50 điểm

### Sudoku
**Điểm cơ bản:**
- **Easy**: 15 điểm
- **Medium**: 30 điểm
- **Hard**: 60 điểm

**Bonus theo thời gian:**
- **< 5 phút**: +50% điểm cơ bản
- **5-10 phút**: +25% điểm cơ bản
- **> 10 phút**: +0% điểm cơ bản

**Ví dụ:**
- Hoàn thành Sudoku Hard trong 4 phút: 60 + (60 × 50%) = 90 điểm
- Hoàn thành Sudoku Medium trong 7 phút: 30 + (30 × 25%) = 37 điểm

### Khác
- **Đăng nhập hàng ngày**: 5 điểm
- **Hoàn thành khóa học**: 100 điểm
- **Thành tích Common**: 20 điểm
- **Thành tích Rare**: 50 điểm
- **Thành tích Epic**: 100 điểm
- **Thành tích Legendary**: 200 điểm

## API Endpoints

### 1. Lấy điểm thưởng hiện tại
```
GET /api/v1/rewards/points
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "rewardPoints": 150
  }
}
```

### 2. Lấy lịch sử giao dịch
```
GET /api/v1/rewards/history?page=1&limit=20&type=problem_solved
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Trang hiện tại (mặc định: 1)
- `limit`: Số lượng mỗi trang (mặc định: 20)
- `type`: Lọc theo loại giao dịch (tùy chọn)

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": 1,
        "user_id": 1,
        "points": 50,
        "transaction_type": "problem_solved",
        "reference_type": "problem",
        "reference_id": 123,
        "metadata": {
          "difficulty": "Hard",
          "language": "javascript",
          "score": 100
        },
        "description": "Giải bài tập Hard thành công",
        "created_at": "2025-11-17T10:30:00.000Z"
      }
    ],
    "currentBalance": 150,
    "stats": [
      {
        "type": "problem_solved",
        "count": 5,
        "total_points": 125
      },
      {
        "type": "sudoku_completed",
        "count": 2,
        "total_points": 75
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 7
    }
  }
}
```

### 3. Lấy thống kê điểm thưởng
```
GET /api/v1/rewards/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currentBalance": 150,
    "stats": [
      {
        "type": "problem_solved",
        "count": 5,
        "total_points": 125
      },
      {
        "type": "sudoku_completed",
        "count": 2,
        "total_points": 75
      }
    ]
  }
}
```

### 4. Lấy cấu hình điểm thưởng (Public)
```
GET /api/v1/rewards/config
```

**Response:**
```json
{
  "success": true,
  "data": {
    "problem_easy": 10,
    "problem_medium": 25,
    "problem_hard": 50,
    "sudoku_easy_base": 15,
    "sudoku_medium_base": 30,
    "sudoku_hard_base": 60,
    "sudoku_time_bonus_fast": 50,
    "sudoku_time_bonus_normal": 25,
    "sudoku_time_bonus_slow": 0
  }
}
```

### 5. Cập nhật cấu hình (Admin only)
```
PUT /api/v1/rewards/config
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "config_key": "problem_hard",
  "config_value": 75
}
```

### 6. Thêm điểm thủ công (Admin only)
```
POST /api/v1/rewards/manual
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "user_id": 1,
  "points": 100,
  "description": "Thưởng đặc biệt cho người dùng xuất sắc"
}
```

## Tích hợp Tự động

### 1. Giải bài tập (Problem Solved)
Khi người dùng submit code và được chấp nhận (status = 'accepted'):
- Hệ thống tự động kiểm tra xem người dùng đã nhận điểm cho bài này chưa
- Nếu chưa, thưởng điểm theo độ khó của bài tập
- Chỉ thưởng 1 lần cho mỗi bài tập

### 2. Hoàn thành Sudoku
Khi người dùng hoàn thành Sudoku thành công:
- Tính điểm cơ bản theo độ khó
- Tính bonus theo thời gian hoàn thành
- Thưởng điểm mỗi lần hoàn thành (có thể chơi lại nhiều lần)

## Cách sử dụng trong Code

### Import Service
```javascript
const rewardService = require('../services/rewardService');
```

### Thưởng điểm cho bài tập
```javascript
const rewardResult = await rewardService.rewardProblemSolved(
  userId,
  problemId,
  difficulty, // 'Easy', 'Medium', 'Hard'
  {
    language: 'javascript',
    score: 100,
    executionTime: 150
  }
);
```

### Thưởng điểm cho Sudoku
```javascript
const rewardResult = await rewardService.rewardSudokuCompleted(
  userId,
  gameId,
  levelId,
  difficulty, // 'easy', 'medium', 'hard'
  timeSpent // thời gian tính bằng giây
);
```

### Thêm điểm thủ công
```javascript
const result = await rewardService.addRewardPoints(
  userId,
  points, // số điểm (có thể âm)
  'manual_adjustment',
  {
    description: 'Mô tả',
    metadata: { /* dữ liệu bổ sung */ }
  }
);
```

### Kiểm tra đã nhận điểm chưa
```javascript
const hasReward = await rewardService.hasReceivedReward(
  userId,
  'problem',
  problemId,
  'problem_solved'
);
```

### Lấy điểm hiện tại
```javascript
const points = await rewardService.getUserRewardPoints(userId);
```

## Migration Database

Chạy script SQL để tạo bảng và cấu hình:
```bash
mysql -u root -p lfysdb < api/sql-scripts/004-add-reward-points-system.sql
```

## Testing

### 1. Test giải bài tập
```bash
# Submit một bài tập và kiểm tra điểm thưởng
curl -X POST http://localhost:3000/api/v1/problems/1/submit \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCode": "...",
    "language": "javascript",
    "userId": 1
  }'

# Kiểm tra điểm
curl -X GET http://localhost:3000/api/v1/rewards/points \
  -H "Authorization: Bearer <token>"
```

### 2. Test Sudoku
```bash
# Validate Sudoku solution
curl -X POST http://localhost:3000/api/v1/games/sudoku/validate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "solution": [[...]],
    "gameId": 1,
    "levelId": 1,
    "timeSpent": 240
  }'

# Kiểm tra điểm
curl -X GET http://localhost:3000/api/v1/rewards/points \
  -H "Authorization: Bearer <token>"
```

## Lưu ý

1. **Bài tập chỉ thưởng 1 lần**: Người dùng chỉ nhận điểm lần đầu tiên giải đúng bài tập
2. **Sudoku thưởng nhiều lần**: Người dùng có thể chơi lại và nhận điểm mỗi lần
3. **Transaction an toàn**: Sử dụng database transaction để đảm bảo tính nhất quán
4. **Cache config**: Cấu hình điểm thưởng được cache 5 phút để tối ưu hiệu suất
5. **Error handling**: Lỗi khi thưởng điểm không làm fail request chính

## Mở rộng trong tương lai

- Thêm shop để đổi điểm lấy vật phẩm
- Thêm bảng xếp hạng theo điểm thưởng
- Thêm nhiệm vụ hàng ngày/tuần
- Thêm hệ thống streak bonus
- Thêm điểm thưởng cho hoạt động cộng đồng (comment, review, etc.)
