-- ===============================
-- Problem System Seed Data
-- ===============================
USE lfysdb;

-- Insert problem categories
INSERT INTO problem_categories (id, name, description, created_at, updated_at) VALUES
(1, 'Array', 'Các bài tập về mảng', NOW(), NOW()),
(2, 'String', 'Các bài tập về chuỗi', NOW(), NOW()),
(3, 'Linked List', 'Các bài tập về danh sách liên kết', NOW(), NOW()),
(4, 'Tree', 'Các bài tập về cây', NOW(), NOW()),
(5, 'Dynamic Programming', 'Các bài tập về quy hoạch động', NOW(), NOW());

-- Insert tags
INSERT INTO tags (id, name, created_at, updated_at) VALUES
(1, 'Two Pointers', NOW(), NOW()),
(2, 'Hash Table', NOW(), NOW()),
(3, 'Binary Search', NOW(), NOW()),
(4, 'Sliding Window', NOW(), NOW()),
(5, 'BFS', NOW(), NOW()),
(6, 'DFS', NOW(), NOW()),
(7, 'Recursion', NOW(), NOW()),
(8, 'Sorting', NOW(), NOW());

-- Insert users for testing (if not exists)
INSERT IGNORE INTO users (id, name, email, password, role, created_at, updated_at) VALUES
(1, 'Admin User', 'admin@example.com', 'hashed_password', 'admin', NOW(), NOW()),
(2, 'Test Creator', 'creator@example.com', 'hashed_password', 'creator', NOW(), NOW());

-- Insert problems
INSERT INTO problems (id, title, description, difficulty, estimated_time, likes, dislikes, acceptance, total_submissions, solved_count, is_new, is_popular, is_premium, category_id, created_by, is_deleted, created_at, updated_at) VALUES
(1, 'Tổng các phần tử mảng', 'Tính tổng các phần tử trong mảng số nguyên.', 'Easy', '10 phút', 120, 5, 95.50, 500, 480, true, true, false, 1, 1, false, '2024-06-01 09:00:00', '2024-06-01 09:00:00'),
(2, 'Đảo ngược chuỗi', 'Viết hàm đảo ngược một chuỗi ký tự.', 'Easy', '8 phút', 85, 2, 98.20, 300, 295, false, true, false, 2, 2, false, '2024-06-02 10:00:00', '2024-06-02 10:00:00'),
(3, 'Two Sum', 'Tìm hai số trong mảng có tổng bằng target.', 'Easy', '15 phút', 200, 8, 87.30, 1200, 1050, false, true, false, 1, 1, false, '2024-06-03 11:00:00', '2024-06-03 11:00:00');

-- Insert problem tags
INSERT INTO problem_tags (problem_id, tag_id) VALUES
(1, 8), -- Array + Sorting
(2, 1), -- String + Two Pointers
(3, 2), -- Two Sum + Hash Table
(3, 1); -- Two Sum + Two Pointers

-- Insert problem examples
INSERT INTO problem_examples (id, problem_id, input, output, explanation, created_at, updated_at) VALUES
(1, 1, 'arr = [1,2,3]', '6', '1+2+3=6', '2024-06-01 09:10:00', '2024-06-01 09:10:00'),
(2, 2, 's = "abc"', 'cba', 'Đảo ngược chuỗi', '2024-06-02 10:10:00', '2024-06-02 10:10:00'),
(3, 3, 'nums = [2,7,11,15], target = 9', '[0,1]', 'nums[0] + nums[1] = 2 + 7 = 9', '2024-06-03 11:10:00', '2024-06-03 11:10:00');

-- Insert problem constraints
INSERT INTO problem_constraints (id, problem_id, constraint_text, created_at, updated_at) VALUES
(1, 1, '1 <= arr.length <= 1000', '2024-06-01 09:15:00', '2024-06-01 09:15:00'),
(2, 1, '-1000 <= arr[i] <= 1000', '2024-06-01 09:15:00', '2024-06-01 09:15:00'),
(3, 2, '1 <= s.length <= 1000', '2024-06-02 10:15:00', '2024-06-02 10:15:00'),
(4, 3, '2 <= nums.length <= 10^4', '2024-06-03 11:15:00', '2024-06-03 11:15:00'),
(5, 3, '-10^9 <= nums[i] <= 10^9', '2024-06-03 11:15:00', '2024-06-03 11:15:00');

-- Insert starter codes
INSERT INTO starter_codes (id, problem_id, language, code, created_at, updated_at) VALUES
-- Problem 1 - Sum Array
(1, 1, 'python', 'def sum_array(arr):
    """
    Tính tổng các phần tử trong mảng
    Args:
        arr: List[int] - Mảng số nguyên
    Returns:
        int - Tổng các phần tử
    """
    # TODO: Implement your solution here
    pass', '2024-06-01 09:20:00', '2024-06-01 09:20:00'),

(2, 1, 'javascript', '/**
 * Tính tổng các phần tử trong mảng
 * @param {number[]} arr - Mảng số nguyên
 * @return {number} - Tổng các phần tử
 */
function sumArray(arr) {
    // TODO: Implement your solution here
}', '2024-06-01 09:20:00', '2024-06-01 09:20:00'),

(3, 1, 'java', 'public class Solution {
    /**
     * Tính tổng các phần tử trong mảng
     * @param arr Mảng số nguyên
     * @return Tổng các phần tử
     */
    public int sumArray(int[] arr) {
        // TODO: Implement your solution here
        return 0;
    }
}', '2024-06-01 09:20:00', '2024-06-01 09:20:00'),

-- Problem 2 - Reverse String
(4, 2, 'python', 'def reverse_string(s):
    """
    Đảo ngược một chuỗi ký tự
    Args:
        s: str - Chuỗi đầu vào
    Returns:
        str - Chuỗi đã đảo ngược
    """
    # TODO: Implement your solution here
    pass', '2024-06-02 10:20:00', '2024-06-02 10:20:00'),

(5, 2, 'javascript', '/**
 * Đảo ngược một chuỗi ký tự
 * @param {string} s - Chuỗi đầu vào
 * @return {string} - Chuỗi đã đảo ngược
 */
function reverseString(s) {
    // TODO: Implement your solution here
}', '2024-06-02 10:20:00', '2024-06-02 10:20:00'),

-- Problem 3 - Two Sum
(6, 3, 'python', 'def two_sum(nums, target):
    """
    Tìm hai số trong mảng có tổng bằng target
    Args:
        nums: List[int] - Mảng số nguyên
        target: int - Giá trị target
    Returns:
        List[int] - Indices của hai số
    """
    # TODO: Implement your solution here
    pass', '2024-06-03 11:20:00', '2024-06-03 11:20:00');

-- Insert test cases
INSERT INTO test_cases (id, problem_id, input, expected_output, is_sample, created_at, updated_at) VALUES
-- Problem 1 test cases
(1, 1, '[1,2,3]', '6', true, '2024-06-01 09:50:00', '2024-06-01 09:50:00'),
(2, 1, '[0,0,0]', '0', false, '2024-06-01 09:51:00', '2024-06-01 09:51:00'),
(3, 1, '[-1,1,2]', '2', false, '2024-06-01 09:52:00', '2024-06-01 09:52:00'),

-- Problem 2 test cases
(4, 2, '"abc"', 'cba', true, '2024-06-02 10:50:00', '2024-06-02 10:50:00'),
(5, 2, '"hello"', 'olleh', false, '2024-06-02 10:51:00', '2024-06-02 10:51:00'),
(6, 2, '"a"', 'a', false, '2024-06-02 10:52:00', '2024-06-02 10:52:00'),

-- Problem 3 test cases
(7, 3, '[2,7,11,15]
9', '[0,1]', true, '2024-06-03 11:50:00', '2024-06-03 11:50:00'),
(8, 3, '[3,2,4]
6', '[1,2]', false, '2024-06-03 11:51:00', '2024-06-03 11:51:00'),
(9, 3, '[3,3]
6', '[0,1]', false, '2024-06-03 11:52:00', '2024-06-03 11:52:00');

-- Insert some sample submission codes and submissions for testing
INSERT INTO submission_codes (id, source_code, created_at, updated_at) VALUES
(1, 'def sum_array(arr):
    return sum(arr)', '2024-06-01 09:30:00', '2024-06-01 09:30:00'),
(2, 'def reverse_string(s):
    return s[::-1]', '2024-06-02 10:30:00', '2024-06-02 10:30:00');

INSERT INTO submissions (id, user_id, problem_id, code_id, language, status, score, exec_time, memory_used, submitted_at) VALUES
(1, 1, 1, 1, 'python', 'accepted', 100, 12, 8, '2024-06-01 09:35:00'),
(2, 2, 2, 2, 'python', 'accepted', 100, 10, 7, '2024-06-02 10:35:00');

-- Insert problem comments
INSERT INTO problem_comments (id, user_id, problem_id, content, created_at, updated_at) VALUES
(1, 1, 1, 'Bài này dễ quá!', '2024-06-01 09:40:00', '2024-06-01 09:40:00'),
(2, 2, 2, 'Có test case nào khó hơn không?', '2024-06-02 10:40:00', '2024-06-02 10:40:00');
