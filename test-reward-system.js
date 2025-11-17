/**
 * Script test hệ thống điểm thưởng
 * 
 * Cách chạy:
 * 1. Đảm bảo server đang chạy
 * 2. Thay YOUR_AUTH_TOKEN bằng token thật
 * 3. node test-reward-system.js
 */

const API_BASE_URL = 'http://localhost:3000/api/v1';
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN'; // Thay bằng token thật

// Helper function để gọi API
async function apiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error('API Error:', error.message);
    return { status: 500, error: error.message };
  }
}

// Test functions
async function testGetCurrentPoints() {
  console.log('\n=== Test 1: Lấy điểm thưởng hiện tại ===');
  const result = await apiCall('/rewards/points');
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
}

async function testGetRewardConfig() {
  console.log('\n=== Test 2: Lấy cấu hình điểm thưởng ===');
  const result = await apiCall('/rewards/config');
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
}

async function testGetRewardHistory() {
  console.log('\n=== Test 3: Lấy lịch sử giao dịch ===');
  const result = await apiCall('/rewards/history?page=1&limit=10');
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
}

async function testGetRewardStats() {
  console.log('\n=== Test 4: Lấy thống kê điểm thưởng ===');
  const result = await apiCall('/rewards/stats');
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
}

async function testSubmitProblem() {
  console.log('\n=== Test 5: Submit bài tập (giả lập) ===');
  console.log('Lưu ý: Cần có problem_id và code hợp lệ để test thực tế');
  console.log('Ví dụ endpoint: POST /problems/1/submit');
  console.log('Body: { sourceCode: "...", language: "javascript", userId: 1 }');
}

async function testSudokuComplete() {
  console.log('\n=== Test 6: Hoàn thành Sudoku (giả lập) ===');
  console.log('Lưu ý: Cần có solution hợp lệ để test thực tế');
  console.log('Ví dụ endpoint: POST /games/sudoku/validate');
  console.log('Body: { solution: [[...]], gameId: 1, levelId: 1, timeSpent: 240 }');
}

// Chạy tất cả tests
async function runAllTests() {
  console.log('🚀 Bắt đầu test hệ thống điểm thưởng...\n');
  console.log('API Base URL:', API_BASE_URL);
  console.log('Auth Token:', AUTH_TOKEN === 'YOUR_AUTH_TOKEN' ? '⚠️  CHƯA CẤU HÌNH' : '✅ Đã cấu hình');

  if (AUTH_TOKEN === 'YOUR_AUTH_TOKEN') {
    console.log('\n❌ Vui lòng thay YOUR_AUTH_TOKEN bằng token thật trong file này!');
    console.log('Cách lấy token:');
    console.log('1. Đăng nhập vào hệ thống');
    console.log('2. Mở Developer Tools > Application > Local Storage');
    console.log('3. Tìm key "token" hoặc "auth_token"');
    console.log('4. Copy giá trị và thay vào biến AUTH_TOKEN\n');
    return;
  }

  await testGetCurrentPoints();
  await testGetRewardConfig();
  await testGetRewardHistory();
  await testGetRewardStats();
  await testSubmitProblem();
  await testSudokuComplete();

  console.log('\n✅ Hoàn thành tất cả tests!');
  console.log('\n📝 Hướng dẫn test đầy đủ:');
  console.log('1. Test giải bài tập: Submit một bài tập và kiểm tra điểm tăng');
  console.log('2. Test Sudoku: Hoàn thành một game Sudoku và kiểm tra điểm');
  console.log('3. Kiểm tra lịch sử giao dịch để xem chi tiết');
  console.log('4. Xem thống kê để biết tổng điểm từ mỗi loại hoạt động');
}

// Chạy tests
runAllTests().catch(console.error);
