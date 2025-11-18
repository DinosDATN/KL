/**
 * Test Course Enrollment System
 * 
 * This script tests the new course enrollment and progress tracking features
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';
let authToken = '';
let testUserId = null;
let testCourseId = 1; // Change this to an existing course ID

// Test credentials - update these with your test account
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

// Helper function to make authenticated requests
const authRequest = (method, url, data = null) => {
  const config = {
    method,
    url: `${API_URL}${url}`,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
};

// Test functions
async function testLogin() {
  console.log('\n📝 Test 1: Login');
  console.log('='.repeat(60));
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    authToken = response.data.token;
    testUserId = response.data.user.id;
    
    console.log('✅ Login successful');
    console.log(`User ID: ${testUserId}`);
    console.log(`Token: ${authToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testEnrollCourse() {
  console.log('\n📝 Test 2: Enroll in Course');
  console.log('='.repeat(60));
  
  try {
    const response = await authRequest('POST', `/course-enrollments/${testCourseId}/enroll`);
    
    console.log('✅ Enrollment successful');
    console.log('Enrollment data:', JSON.stringify(response.data.data, null, 2));
    return true;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already enrolled')) {
      console.log('ℹ️  Already enrolled in this course');
      return true;
    }
    console.error('❌ Enrollment failed:', error.response?.data || error.message);
    return false;
  }
}

async function testCheckEnrollment() {
  console.log('\n📝 Test 3: Check Enrollment Status');
  console.log('='.repeat(60));
  
  try {
    const response = await authRequest('GET', `/course-enrollments/${testCourseId}/check`);
    
    console.log('✅ Check enrollment successful');
    console.log(`Is Enrolled: ${response.data.data.isEnrolled}`);
    if (response.data.data.enrollment) {
      console.log('Enrollment details:', JSON.stringify(response.data.data.enrollment, null, 2));
    }
    return true;
  } catch (error) {
    console.error('❌ Check enrollment failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGetMyEnrollments() {
  console.log('\n📝 Test 4: Get My Enrollments');
  console.log('='.repeat(60));
  
  try {
    const response = await authRequest('GET', '/course-enrollments/my-enrollments');
    
    console.log('✅ Get enrollments successful');
    console.log(`Total enrollments: ${response.data.data.length}`);
    response.data.data.forEach((enrollment, index) => {
      console.log(`\n${index + 1}. ${enrollment.Course.title}`);
      console.log(`   Progress: ${enrollment.progress}%`);
      console.log(`   Status: ${enrollment.status}`);
    });
    return true;
  } catch (error) {
    console.error('❌ Get enrollments failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGetCourseProgress() {
  console.log('\n📝 Test 5: Get Course Progress');
  console.log('='.repeat(60));
  
  try {
    const response = await authRequest('GET', `/course-enrollments/${testCourseId}/progress`);
    
    console.log('✅ Get progress successful');
    console.log('\nProgress Summary:');
    console.log(`  Total Lessons: ${response.data.data.progress.totalLessons}`);
    console.log(`  Completed Lessons: ${response.data.data.progress.completedLessons}`);
    console.log(`  Progress: ${response.data.data.progress.progressPercentage}%`);
    console.log(`  Total Duration: ${response.data.data.progress.totalDuration} minutes`);
    console.log(`  Completed Duration: ${response.data.data.progress.completedDuration} minutes`);
    
    if (response.data.data.progress.nextLesson) {
      console.log('\nNext Lesson:');
      console.log(`  ${response.data.data.progress.nextLesson.title}`);
      console.log(`  Type: ${response.data.data.progress.nextLesson.type}`);
    }
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Get progress failed:', error.response?.data || error.message);
    return null;
  }
}

async function testGetCourseLessons() {
  console.log('\n📝 Test 6: Get Course Lessons (Protected)');
  console.log('='.repeat(60));
  
  try {
    const response = await authRequest('GET', `/courses/${testCourseId}/lessons`);
    
    console.log('✅ Get lessons successful');
    console.log(`Total lessons: ${response.data.data.length}`);
    
    if (response.data.data.length > 0) {
      console.log('\nFirst 3 lessons:');
      response.data.data.slice(0, 3).forEach((lesson, index) => {
        console.log(`${index + 1}. ${lesson.title} (${lesson.type})`);
      });
    }
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Get lessons failed:', error.response?.data || error.message);
    return null;
  }
}

async function testCompleteLesson(lessonId) {
  console.log('\n📝 Test 7: Complete a Lesson');
  console.log('='.repeat(60));
  
  try {
    const response = await authRequest(
      'POST',
      `/course-enrollments/${testCourseId}/lessons/${lessonId}/complete`,
      { timeSpent: 300 } // 5 minutes
    );
    
    console.log('✅ Lesson completion successful');
    console.log(`Message: ${response.data.message}`);
    console.log(`New Progress: ${response.data.data.enrollment.progress}%`);
    console.log(`Status: ${response.data.data.enrollment.status}`);
    return true;
  } catch (error) {
    console.error('❌ Complete lesson failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGetLearningDashboard() {
  console.log('\n📝 Test 8: Get Learning Dashboard');
  console.log('='.repeat(60));
  
  try {
    const response = await authRequest('GET', '/course-enrollments/dashboard');
    
    console.log('✅ Get dashboard successful');
    console.log('\nDashboard Summary:');
    console.log(`  Total Courses: ${response.data.data.summary.totalCourses}`);
    console.log(`  Completed: ${response.data.data.summary.completedCourses}`);
    console.log(`  In Progress: ${response.data.data.summary.inProgressCourses}`);
    console.log(`  Average Progress: ${response.data.data.summary.averageProgress}%`);
    
    if (response.data.data.nextSteps.length > 0) {
      console.log('\nNext Steps:');
      response.data.data.nextSteps.forEach((step, index) => {
        console.log(`  ${index + 1}. ${step.courseTitle} (${step.progress}%)`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Get dashboard failed:', error.response?.data || error.message);
    return false;
  }
}

async function testAccessWithoutEnrollment() {
  console.log('\n📝 Test 9: Try to Access Content Without Enrollment');
  console.log('='.repeat(60));
  
  const unenrolledCourseId = 999; // Non-existent or unenrolled course
  
  try {
    await authRequest('GET', `/courses/${unenrolledCourseId}/lessons`);
    console.log('❌ Should have been blocked!');
    return false;
  } catch (error) {
    if (error.response?.status === 403 || error.response?.status === 404) {
      console.log('✅ Access correctly blocked');
      console.log(`Message: ${error.response.data.message}`);
      return true;
    }
    console.error('❌ Unexpected error:', error.response?.data || error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n🚀 Starting Course Enrollment System Tests');
  console.log('='.repeat(60));
  console.log(`API URL: ${API_URL}`);
  console.log(`Test Course ID: ${testCourseId}`);
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };
  
  // Test 1: Login
  results.total++;
  if (await testLogin()) {
    results.passed++;
  } else {
    results.failed++;
    console.log('\n❌ Cannot continue without login');
    return;
  }
  
  // Test 2: Enroll in course
  results.total++;
  if (await testEnrollCourse()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Test 3: Check enrollment
  results.total++;
  if (await testCheckEnrollment()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Test 4: Get my enrollments
  results.total++;
  if (await testGetMyEnrollments()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Test 5: Get course progress
  results.total++;
  const progressData = await testGetCourseProgress();
  if (progressData) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Test 6: Get course lessons
  results.total++;
  const lessons = await testGetCourseLessons();
  if (lessons) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Test 7: Complete a lesson (if lessons exist)
  if (lessons && lessons.length > 0) {
    results.total++;
    if (await testCompleteLesson(lessons[0].id)) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
  
  // Test 8: Get learning dashboard
  results.total++;
  if (await testGetLearningDashboard()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Test 9: Try to access without enrollment
  results.total++;
  if (await testAccessWithoutEnrollment()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);
  console.log('='.repeat(60));
}

// Run tests
runAllTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
