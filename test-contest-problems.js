/**
 * Script kiểm tra API Contest Problems
 * Kiểm tra xem có thể lấy danh sách bài tập của cuộc thi không cần đăng nhập
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

// Màu sắc cho console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testGetContestProblemsWithoutAuth() {
  log('\n=== Test 1: Lấy danh sách bài tập KHÔNG CẦN đăng nhập ===', 'cyan');
  
  try {
    const response = await axios.get(`${API_URL}/contests/1/problems`);
    
    if (response.data.success) {
      log('✓ Thành công! Có thể lấy danh sách bài tập không cần đăng nhập', 'green');
      log(`  Số lượng bài tập: ${response.data.data.length}`, 'blue');
      
      if (response.data.data.length > 0) {
        log('  Bài tập đầu tiên:', 'blue');
        const firstProblem = response.data.data[0];
        log(`    - ID: ${firstProblem.id}`, 'blue');
        log(`    - Problem ID: ${firstProblem.problem_id}`, 'blue');
        log(`    - Score: ${firstProblem.score}`, 'blue');
        if (firstProblem.Problem) {
          log(`    - Title: ${firstProblem.Problem.title}`, 'blue');
          log(`    - Difficulty: ${firstProblem.Problem.difficulty}`, 'blue');
        }
      }
      return true;
    } else {
      log('✗ Lỗi: API trả về success = false', 'red');
      log(`  Message: ${response.data.message}`, 'red');
      return false;
    }
  } catch (error) {
    log('✗ Lỗi khi gọi API:', 'red');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Message: ${error.response.data.message || 'Unknown error'}`, 'red');
    } else {
      log(`  Error: ${error.message}`, 'red');
    }
    return false;
  }
}

async function testGetContestProblemsWithAuth() {
  log('\n=== Test 2: Lấy danh sách bài tập VỚI đăng nhập ===', 'cyan');
  
  // Đăng nhập để lấy token
  try {
    log('Đang đăng nhập...', 'yellow');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@lfys.com',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success) {
      log('✗ Không thể đăng nhập', 'red');
      return false;
    }
    
    const token = loginResponse.data.data.token;
    log('✓ Đăng nhập thành công', 'green');
    
    // Lấy danh sách bài tập với token
    const response = await axios.get(`${API_URL}/contests/1/problems`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      log('✓ Thành công! Có thể lấy danh sách bài tập với đăng nhập', 'green');
      log(`  Số lượng bài tập: ${response.data.data.length}`, 'blue');
      return true;
    } else {
      log('✗ Lỗi: API trả về success = false', 'red');
      log(`  Message: ${response.data.message}`, 'red');
      return false;
    }
  } catch (error) {
    log('✗ Lỗi khi gọi API:', 'red');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Message: ${error.response.data.message || 'Unknown error'}`, 'red');
    } else {
      log(`  Error: ${error.message}`, 'red');
    }
    return false;
  }
}

async function testGetAllContests() {
  log('\n=== Test 3: Lấy danh sách tất cả cuộc thi ===', 'cyan');
  
  try {
    const response = await axios.get(`${API_URL}/contests?page=1&limit=5`);
    
    if (response.data.success) {
      log('✓ Thành công! Có thể lấy danh sách cuộc thi', 'green');
      log(`  Số lượng cuộc thi: ${response.data.data.length}`, 'blue');
      log(`  Tổng số cuộc thi: ${response.data.pagination.total_items}`, 'blue');
      
      if (response.data.data.length > 0) {
        log('  Cuộc thi đầu tiên:', 'blue');
        const firstContest = response.data.data[0];
        log(`    - ID: ${firstContest.id}`, 'blue');
        log(`    - Title: ${firstContest.title}`, 'blue');
        log(`    - Status: ${firstContest.status}`, 'blue');
        log(`    - Problem Count: ${firstContest.problem_count}`, 'blue');
        log(`    - Participant Count: ${firstContest.participant_count}`, 'blue');
      }
      return true;
    } else {
      log('✗ Lỗi: API trả về success = false', 'red');
      log(`  Message: ${response.data.message}`, 'red');
      return false;
    }
  } catch (error) {
    log('✗ Lỗi khi gọi API:', 'red');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Message: ${error.response.data.message || 'Unknown error'}`, 'red');
    } else {
      log(`  Error: ${error.message}`, 'red');
    }
    return false;
  }
}

async function testGetContestById() {
  log('\n=== Test 4: Lấy chi tiết cuộc thi ===', 'cyan');
  
  try {
    const response = await axios.get(`${API_URL}/contests/1`);
    
    if (response.data.success) {
      log('✓ Thành công! Có thể lấy chi tiết cuộc thi', 'green');
      const contest = response.data.data;
      log(`  ID: ${contest.id}`, 'blue');
      log(`  Title: ${contest.title}`, 'blue');
      log(`  Description: ${contest.description}`, 'blue');
      log(`  Status: ${contest.status}`, 'blue');
      log(`  Duration: ${contest.duration} minutes`, 'blue');
      log(`  Problem Count: ${contest.problem_count}`, 'blue');
      log(`  Participant Count: ${contest.participant_count}`, 'blue');
      return true;
    } else {
      log('✗ Lỗi: API trả về success = false', 'red');
      log(`  Message: ${response.data.message}`, 'red');
      return false;
    }
  } catch (error) {
    log('✗ Lỗi khi gọi API:', 'red');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Message: ${error.response.data.message || 'Unknown error'}`, 'red');
    } else {
      log(`  Error: ${error.message}`, 'red');
    }
    return false;
  }
}

async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║     KIỂM TRA API CONTEST - HIỂN THỊ BÀI TẬP          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');
  
  const results = [];
  
  // Chạy các test
  results.push(await testGetAllContests());
  results.push(await testGetContestById());
  results.push(await testGetContestProblemsWithoutAuth());
  results.push(await testGetContestProblemsWithAuth());
  
  // Tổng kết
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║                    TỔNG KẾT                           ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  if (passed === total) {
    log(`\n✓ Tất cả ${total} test đều PASS!`, 'green');
    log('  Hệ thống hoạt động bình thường.', 'green');
  } else {
    log(`\n✗ ${passed}/${total} test PASS`, 'yellow');
    log(`  ${total - passed} test FAILED`, 'red');
    log('  Vui lòng kiểm tra lại server và database.', 'yellow');
  }
  
  log('\n');
}

// Chạy tất cả các test
runAllTests().catch(error => {
  log('\n✗ Lỗi nghiêm trọng:', 'red');
  log(error.message, 'red');
  process.exit(1);
});
