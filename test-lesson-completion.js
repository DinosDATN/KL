/**
 * Test Lesson Completion and Progress Update
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';
let authToken = '';
let userId = null;
const courseId = 1; // Change to your test course ID

// Test credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

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

async function login() {
  console.log('\n🔐 Logging in...');
  try {
    const response = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    authToken = response.data.token;
    userId = response.data.user.id;
    console.log('✅ Login successful');
    console.log(`User ID: ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function enrollIfNeeded() {
  console.log('\n📝 Checking enrollment...');
  try {
    const checkResponse = await authRequest('GET', `/course-enrollments/${courseId}/check`);
    
    if (checkResponse.data.data.isEnrolled) {
      console.log('✅ Already enrolled');
      return true;
    }
    
    console.log('📝 Enrolling in course...');
    await authRequest('POST', `/course-enrollments/${courseId}/enroll`);
    console.log('✅ Enrollment successful');
    return true;
  } catch (error) {
    console.error('❌ Enrollment check/create failed:', error.response?.data || error.message);
    return false;
  }
}

async function getProgressBefore() {
  console.log('\n📊 Getting progress BEFORE completing lesson...');
  try {
    const response = await authRequest('GET', `/course-enrollments/${courseId}/progress`);
    const data = response.data.data;
    
    console.log('Current Progress:');
    console.log(`  - Progress: ${data.enrollment.progress}%`);
    console.log(`  - Status: ${data.enrollment.status}`);
    console.log(`  - Completed Lessons: ${data.progress.completedLessons}/${data.progress.totalLessons}`);
    console.log(`  - Completed Lesson IDs: [${data.completedLessonIds.join(', ')}]`);
    
    return data;
  } catch (error) {
    console.error('❌ Failed to get progress:', error.response?.data || error.message);
    return null;
  }
}

async function getLessons() {
  console.log('\n📚 Getting course lessons...');
  try {
    const response = await authRequest('GET', `/courses/${courseId}/lessons`);
    const lessons = response.data.data;
    console.log(`✅ Found ${lessons.length} lessons`);
    
    if (lessons.length > 0) {
      console.log('\nFirst 3 lessons:');
      lessons.slice(0, 3).forEach((lesson, index) => {
        console.log(`  ${index + 1}. ID: ${lesson.id} - ${lesson.title}`);
      });
    }
    
    return lessons;
  } catch (error) {
    console.error('❌ Failed to get lessons:', error.response?.data || error.message);
    return [];
  }
}

async function completeLesson(lessonId) {
  console.log(`\n✅ Completing lesson ${lessonId}...`);
  try {
    const response = await authRequest(
      'POST',
      `/course-enrollments/${courseId}/lessons/${lessonId}/complete`,
      { timeSpent: 300 }
    );
    
    const data = response.data.data;
    console.log('✅ Lesson completion response:');
    console.log(`  - Message: ${response.data.message}`);
    console.log(`  - Completion ID: ${data.completion.id}`);
    console.log(`  - Completed At: ${data.completion.completed_at}`);
    console.log(`  - Time Spent: ${data.completion.time_spent}s`);
    console.log('\n📊 Updated Enrollment:');
    console.log(`  - Progress: ${data.enrollment.progress}%`);
    console.log(`  - Status: ${data.enrollment.status}`);
    console.log('\n📈 Progress Details:');
    console.log(`  - Completed: ${data.progress.completedLessons}/${data.progress.totalLessons}`);
    console.log(`  - Percentage: ${data.progress.progressPercentage}%`);
    
    return data;
  } catch (error) {
    console.error('❌ Failed to complete lesson:', error.response?.data || error.message);
    return null;
  }
}

async function getProgressAfter() {
  console.log('\n📊 Getting progress AFTER completing lesson...');
  try {
    const response = await authRequest('GET', `/course-enrollments/${courseId}/progress`);
    const data = response.data.data;
    
    console.log('Updated Progress:');
    console.log(`  - Progress: ${data.enrollment.progress}%`);
    console.log(`  - Status: ${data.enrollment.status}`);
    console.log(`  - Completed Lessons: ${data.progress.completedLessons}/${data.progress.totalLessons}`);
    console.log(`  - Completed Lesson IDs: [${data.completedLessonIds.join(', ')}]`);
    
    return data;
  } catch (error) {
    console.error('❌ Failed to get progress:', error.response?.data || error.message);
    return null;
  }
}

async function checkDatabase() {
  console.log('\n💾 To verify in database, run these SQL queries:');
  console.log('\n-- Check enrollment record:');
  console.log(`SELECT * FROM course_enrollments WHERE user_id = ${userId} AND course_id = ${courseId};`);
  console.log('\n-- Check lesson completions:');
  console.log(`SELECT * FROM course_lesson_completions WHERE user_id = ${userId} AND course_id = ${courseId};`);
  console.log('\n-- Check progress calculation:');
  console.log(`
SELECT 
  ce.id,
  ce.progress,
  ce.status,
  COUNT(clc.id) as completed_lessons,
  (SELECT COUNT(*) FROM course_lessons cl 
   JOIN course_modules cm ON cl.module_id = cm.id 
   WHERE cm.course_id = ${courseId}) as total_lessons
FROM course_enrollments ce
LEFT JOIN course_lesson_completions clc ON ce.user_id = clc.user_id AND ce.course_id = clc.course_id
WHERE ce.user_id = ${userId} AND ce.course_id = ${courseId}
GROUP BY ce.id;
  `);
}

async function runTest() {
  console.log('🚀 Starting Lesson Completion Test');
  console.log('='.repeat(60));
  
  // Step 1: Login
  if (!await login()) {
    console.log('\n❌ Cannot continue without login');
    return;
  }
  
  // Step 2: Enroll if needed
  if (!await enrollIfNeeded()) {
    console.log('\n❌ Cannot continue without enrollment');
    return;
  }
  
  // Step 3: Get progress before
  const progressBefore = await getProgressBefore();
  if (!progressBefore) {
    console.log('\n❌ Cannot get initial progress');
    return;
  }
  
  // Step 4: Get lessons
  const lessons = await getLessons();
  if (lessons.length === 0) {
    console.log('\n❌ No lessons found in course');
    return;
  }
  
  // Step 5: Complete first lesson
  const firstLesson = lessons[0];
  console.log(`\n🎯 Will complete lesson: ${firstLesson.id} - ${firstLesson.title}`);
  
  const completionResult = await completeLesson(firstLesson.id);
  if (!completionResult) {
    console.log('\n❌ Failed to complete lesson');
    return;
  }
  
  // Step 6: Get progress after
  const progressAfter = await getProgressAfter();
  if (!progressAfter) {
    console.log('\n❌ Cannot get updated progress');
    return;
  }
  
  // Step 7: Compare results
  console.log('\n' + '='.repeat(60));
  console.log('📊 COMPARISON');
  console.log('='.repeat(60));
  console.log(`Progress Before: ${progressBefore.enrollment.progress}%`);
  console.log(`Progress After:  ${progressAfter.enrollment.progress}%`);
  console.log(`Change: +${progressAfter.enrollment.progress - progressBefore.enrollment.progress}%`);
  console.log('');
  console.log(`Status Before: ${progressBefore.enrollment.status}`);
  console.log(`Status After:  ${progressAfter.enrollment.status}`);
  console.log('');
  console.log(`Completed Before: ${progressBefore.progress.completedLessons}`);
  console.log(`Completed After:  ${progressAfter.progress.completedLessons}`);
  console.log('='.repeat(60));
  
  // Step 8: Show database check queries
  await checkDatabase();
  
  // Final result
  if (progressAfter.enrollment.progress > progressBefore.enrollment.progress) {
    console.log('\n✅ SUCCESS: Progress was updated correctly!');
  } else {
    console.log('\n❌ FAILED: Progress was NOT updated!');
  }
}

runTest().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
