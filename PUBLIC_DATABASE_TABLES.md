# Danh Sách Các Bảng Dữ Liệu Công Khai

Tài liệu này liệt kê tất cả các bảng dữ liệu mà **bất kỳ người dùng nào** (kể cả chưa đăng nhập) cũng có quyền truy cập và xem thông tin.

## 📋 Tổng Quan

Có **44 bảng dữ liệu công khai** được phân loại theo các nhóm chức năng chính.

---

## 1. 📚 Khóa Học (Courses) - 9 bảng

### 1.1. `courses`

- **Mô tả**: Thông tin khóa học công khai
- **Dữ liệu công khai**:
  - `id`, `title`, `description`, `thumbnail`
  - `rating`, `students`, `level`, `duration`
  - `price`, `original_price`, `discount`
  - `status` (chỉ hiển thị khi = 'published')
  - `is_premium`, `is_free`
  - `publish_date`, `created_at`
- **Lưu ý**: Chỉ hiển thị khóa học có `status = 'published'` và `is_deleted = FALSE`

### 1.2. `course_categories`

- **Mô tả**: Danh mục phân loại khóa học
- **Dữ liệu công khai**: `id`, `name`, `description`, `created_at`

### 1.3. `course_reviews`

- **Mô tả**: Đánh giá và nhận xét về khóa học
- **Dữ liệu công khai**:
  - `id`, `course_id`, `user_id`, `rating`, `comment`
  - `helpful`, `not_helpful`, `verified`
  - `created_at`
- **Lưu ý**: Chỉ hiển thị reviews đã được verify

### 1.4. `related_courses`

- **Mô tả**: Khóa học liên quan được đề xuất
- **Dữ liệu công khai**: `id`, `course_id`, `related_course_id`, `created_at`

### 1.5. `course_languages`

- **Mô tả**: Ngôn ngữ được hỗ trợ trong khóa học
- **Dữ liệu công khai**: `id`, `course_id`, `language`, `created_at`

### 1.6. `course_modules`

- **Mô tả**: Module/chương của khóa học
- **Dữ liệu công khai**: `id`, `course_id`, `title`, `position`, `created_at`
- **Lưu ý**: Chỉ hiển thị preview, không có full content

### 1.7. `course_lessons`

- **Mô tả**: Bài học trong module
- **Dữ liệu công khai**:
  - `id`, `module_id`, `title`, `type`, `duration`, `position`
  - `created_at`
- **Lưu ý**: Không hiển thị `content` đầy đủ cho người chưa đăng ký

### 1.8. `testimonials`

- **Mô tả**: Đánh giá từ học viên về giảng viên
- **Dữ liệu công khai**:
  - `id`, `instructor_id`, `student_name`, `student_avatar`
  - `rating`, `comment`, `course_title`, `date`, `created_at`

### 1.9. `instructor_qualifications`

- **Mô tả**: Trình độ và bằng cấp của giảng viên
- **Dữ liệu công khai**:
  - `id`, `user_id`, `title`, `institution`, `date`
  - `credential_url`, `created_at`

---

## 2. 📄 Tài Liệu (Documents) - 7 bảng

### 2.1. `documents`

- **Mô tả**: Tài liệu học tập công khai
- **Dữ liệu công khai**:
  - `id`, `title`, `description`, `content`
  - `level`, `duration`, `students`, `rating`
  - `thumbnail_url`, `created_at`
- **Lưu ý**: Chỉ hiển thị khi `is_deleted = FALSE`

### 2.2. `document_categories`

- **Mô tả**: Danh mục phân loại tài liệu
- **Dữ liệu công khai**: `id`, `name`, `description`, `created_at`

### 2.3. `topics`

- **Mô tả**: Chủ đề của tài liệu
- **Dữ liệu công khai**: `id`, `name`, `created_at`

### 2.4. `document_category_links`

- **Mô tả**: Liên kết tài liệu với danh mục
- **Dữ liệu công khai**: `id`, `document_id`, `category_id`, `created_at`

### 2.5. `document_modules`

- **Mô tả**: Module của tài liệu
- **Dữ liệu công khai**: `id`, `document_id`, `title`, `position`, `created_at`

### 2.6. `document_lessons`

- **Mô tả**: Bài học trong tài liệu
- **Dữ liệu công khai**:
  - `id`, `module_id`, `title`, `content`, `code_example`
  - `position`, `created_at`

### 2.7. `animations`

- **Mô tả**: Hoạt hình minh họa cho tài liệu
- **Dữ liệu công khai**:
  - `id`, `document_id`, `lesson_id`, `title`, `type`
  - `description`, `embed_code`, `created_at`

---

## 3. 💻 Bài Tập (Problems) - 9 bảng

### 3.1. `problems`

- **Mô tả**: Bài tập lập trình công khai
- **Dữ liệu công khai**:
  - `id`, `title`, `description`, `difficulty`
  - `estimated_time`, `likes`, `dislikes`, `acceptance`
  - `total_submissions`, `solved_count`
  - `is_new`, `is_popular`, `created_at`
- **Lưu ý**: Chỉ hiển thị khi `is_premium = FALSE` và `is_deleted = FALSE`

### 3.2. `problem_categories`

- **Mô tả**: Danh mục phân loại bài tập
- **Dữ liệu công khai**: `id`, `name`, `description`, `created_at`

### 3.3. `tags`

- **Mô tả**: Thẻ gắn cho bài tập
- **Dữ liệu công khai**: `id`, `name`, `created_at`

### 3.4. `problem_tags`

- **Mô tả**: Liên kết bài tập với thẻ
- **Dữ liệu công khai**: `problem_id`, `tag_id`

### 3.5. `problem_examples`

- **Mô tả**: Ví dụ input/output của bài tập
- **Dữ liệu công khai**:
  - `id`, `problem_id`, `input`, `output`, `explanation`
  - `created_at`

### 3.6. `problem_constraints`

- **Mô tả**: Ràng buộc của bài tập
- **Dữ liệu công khai**: `id`, `problem_id`, `constraint_text`, `created_at`

### 3.7. `test_cases`

- **Mô tả**: Test cases mẫu
- **Dữ liệu công khai**:
  - `id`, `problem_id`, `input`, `expected_output`
  - `is_sample`, `created_at`
- **Lưu ý**: Chỉ hiển thị khi `is_sample = TRUE`

### 3.8. `starter_codes`

- **Mô tả**: Mã khởi đầu cho bài tập
- **Dữ liệu công khai**: `id`, `problem_id`, `language`, `code`, `created_at`

### 3.9. `problem_comments`

- **Mô tả**: Bình luận công khai về bài tập
- **Dữ liệu công khai**:
  - `id`, `user_id`, `problem_id`, `content`
  - `created_at`, `updated_at`

---

## 4. 🏆 Cuộc Thi (Contests) - 2 bảng

### 4.1. `contests`

- **Mô tả**: Thông tin cuộc thi lập trình
- **Dữ liệu công khai**:
  - `id`, `title`, `description`
  - `start_time`, `end_time`, `created_at`
- **Lưu ý**: Chỉ hiển thị khi `is_deleted = FALSE`

### 4.2. `contest_problems`

- **Mô tả**: Bài tập trong cuộc thi
- **Dữ liệu công khai**:
  - `id`, `contest_id`, `problem_id`, `score`
  - `created_at`
- **Lưu ý**: Chỉ hiển thị sau khi contest đã bắt đầu

---

## 5. 🎮 Gamification (Công Khai) - 5 bảng

### 5.1. `badge_categories`

- **Mô tả**: Danh mục huy hiệu
- **Dữ liệu công khai**: `id`, `name`, `description`, `created_at`

### 5.2. `badges`

- **Mô tả**: Danh sách huy hiệu có thể đạt được
- **Dữ liệu công khai**:
  - `id`, `name`, `description`, `icon`
  - `rarity`, `category_id`, `created_at`

### 5.3. `levels`

- **Mô tả**: Thông tin các cấp độ
- **Dữ liệu công khai**:
  - `id`, `level`, `name`, `xp_required`, `xp_to_next`
  - `color`, `icon`, `created_at`

### 5.4. `leaderboard_entries`

- **Mô tả**: Bảng xếp hạng công khai
- **Dữ liệu công khai**:
  - `id`, `user_id`, `xp`, `type` (weekly/monthly)
  - `created_at`, `updated_at`

### 5.5. `achievements`

- **Mô tả**: Danh sách thành tích
- **Dữ liệu công khai**:
  - `id`, `title`, `description`, `icon`
  - `category`, `rarity`, `created_at`

---

## 6. 💬 Diễn Đàn (Forums) - 3 bảng

### 6.1. `forums`

- **Mô tả**: Diễn đàn thảo luận
- **Dữ liệu công khai**:
  - `id`, `title`, `description`, `type`
  - `related_id`, `created_at`

### 6.2. `forum_posts`

- **Mô tả**: Bài viết trong diễn đàn
- **Dữ liệu công khai**:
  - `id`, `forum_id`, `user_id`, `content`
  - `votes`, `created_at`, `updated_at`

### 6.3. `forum_votes`

- **Mô tả**: Số lượt vote công khai
- **Dữ liệu công khai**:
  - `id`, `post_id`, `user_id`, `vote_type` (up/down)
  - `created_at`
- **Lưu ý**: Chỉ hiển thị tổng số vote, không hiển thị ai vote

---

## 7. 🎯 Trò Chơi (Games) - 2 bảng

### 7.1. `games`

- **Mô tả**: Thông tin trò chơi
- **Dữ liệu công khai**: `id`, `name`, `description`, `created_at`

### 7.2. `game_levels`

- **Mô tả**: Cấp độ trong trò chơi
- **Dữ liệu công khai**:
  - `id`, `game_id`, `level_number`, `difficulty`
  - `created_at`

---

## 8. ⚙️ Hệ Thống (System) - 3 bảng

### 8.1. `reward_config`

- **Mô tả**: Cấu hình điểm thưởng
- **Dữ liệu công khai**:
  - `id`, `config_key`, `config_value`, `description`
  - `is_active`, `created_at`
- **Lưu ý**: Chỉ hiển thị khi `is_active = TRUE`

### 8.2. `course_coupons`

- **Mô tả**: Mã giảm giá khóa học
- **Dữ liệu công khai**:
  - `id`, `code`, `description`, `discount_type`
  - `discount_value`, `min_purchase_amount`, `max_discount_amount`
  - `valid_from`, `valid_until`, `is_active`
- **Lưu ý**: Chỉ hiển thị mã đang active và còn hiệu lực

### 8.3. `translations`

- **Mô tả**: Bản dịch đa ngôn ngữ
- **Dữ liệu công khai**:
  - `id`, `entity_type`, `entity_id`, `language`
  - `field`, `translated_text`, `created_at`

---

## 9. 👤 Thông Tin Người Dùng (Public Profile) - 4 bảng

### 9.1. `users`

- **Mô tả**: Thông tin cơ bản của người dùng
- **Dữ liệu công khai**:
  - `id`, `name`, `avatar_url`, `role`
  - `is_active`, `created_at`
- **Dữ liệu riêng tư**: `email`, `password`, `is_online`, `last_seen_at`, `subscription_status`

### 9.2. `user_profiles`

- **Mô tả**: Hồ sơ công khai của người dùng
- **Dữ liệu công khai** (khi `visibility_profile = TRUE`):
  - `id`, `user_id`, `bio`, `birthday`, `gender`
  - `website_url`, `github_url`, `linkedin_url`
  - `preferred_language`, `theme_mode`, `layout`
- **Dữ liệu riêng tư**: `phone`, `address`, `notifications`

### 9.3. `user_stats`

- **Mô tả**: Thống kê công khai của người dùng
- **Dữ liệu công khai** (khi `visibility_progress = TRUE`):
  - `id`, `user_id`, `xp`, `level`, `rank`
  - `courses_completed`, `hours_learned`, `problems_solved`
  - `current_streak`, `longest_streak`, `average_score`
  - `reward_points`

### 9.4. `user_achievements`

- **Mô tả**: Thành tích công khai của người dùng
- **Dữ liệu công khai** (khi `visibility_achievements = TRUE`):
  - `id`, `user_id`, `achievement_id`, `date_earned`
  - `created_at`

---

## 📊 Tổng Kết

| Nhóm         | Số Bảng | Mô Tả                                    |
| ------------ | ------- | ---------------------------------------- |
| Khóa Học     | 9       | Thông tin khóa học, đánh giá, giảng viên |
| Tài Liệu     | 7       | Tài liệu học tập và hoạt hình            |
| Bài Tập      | 9       | Bài tập lập trình và test cases          |
| Cuộc Thi     | 2       | Thông tin cuộc thi và bài tập            |
| Gamification | 5       | Huy hiệu, cấp độ, bảng xếp hạng          |
| Diễn Đàn     | 3       | Diễn đàn và bài viết công khai           |
| Trò Chơi     | 2       | Thông tin trò chơi và cấp độ             |
| Hệ Thống     | 3       | Cấu hình và mã giảm giá                  |
| Người Dùng   | 4       | Thông tin công khai của người dùng       |
| **TỔNG**     | **44**  | **Tất cả bảng công khai**                |

---

## 🔒 Lưu Ý Quan Trọng

### Quyền Truy Cập

- ✅ **Public**: Bất kỳ ai cũng có thể xem (kể cả chưa đăng nhập)
- 🔐 **Authenticated**: Cần đăng nhập để xem
- 👑 **Admin Only**: Chỉ quản trị viên mới có quyền truy cập

### Điều Kiện Hiển Thị

1. **Khóa học**: Chỉ hiển thị khi `status = 'published'` và `is_deleted = FALSE`
2. **Bài tập**: Chỉ hiển thị khi `is_premium = FALSE` và `is_deleted = FALSE`
3. **Tài liệu**: Chỉ hiển thị khi `is_deleted = FALSE`
4. **Cuộc thi**: Chỉ hiển thị khi `is_deleted = FALSE`
5. **Mã giảm giá**: Chỉ hiển thị khi `is_active = TRUE` và trong thời gian hiệu lực
6. **Hồ sơ người dùng**: Phụ thuộc vào cài đặt `visibility_*` trong `user_profiles`

### Bảo Mật Dữ Liệu

- ❌ **KHÔNG** hiển thị: `email`, `password`, `phone`, `address`
- ❌ **KHÔNG** hiển thị: Thông tin thanh toán, lịch sử giao dịch
- ❌ **KHÔNG** hiển thị: Tin nhắn riêng tư, chat rooms
- ❌ **KHÔNG** hiển thị: Submissions của người dùng khác
- ❌ **KHÔNG** hiển thị: Thông tin admin, reports

---

## 📝 Ghi Chú Kỹ Thuật

### API Endpoints Công Khai

Các endpoint sau không yêu cầu authentication:

- `GET /api/courses` - Danh sách khóa học
- `GET /api/courses/:id` - Chi tiết khóa học
- `GET /api/problems` - Danh sách bài tập
- `GET /api/problems/:id` - Chi tiết bài tập
- `GET /api/documents` - Danh sách tài liệu
- `GET /api/contests` - Danh sách cuộc thi
- `GET /api/leaderboard` - Bảng xếp hạng
- `GET /api/forums` - Diễn đàn

### Database Queries

Khi query các bảng công khai, luôn thêm điều kiện:

```sql
-- Ví dụ với courses
SELECT * FROM courses
WHERE status = 'published'
  AND is_deleted = FALSE;

-- Ví dụ với problems
SELECT * FROM problems
WHERE is_premium = FALSE
  AND is_deleted = FALSE;
```

---

**Cập nhật lần cuối**: 2024
**Phiên bản**: 1.0
