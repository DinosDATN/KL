/**
 * Direct test of progress update logic
 */

require('dotenv').config({ path: './api/.env' });
const { sequelize } = require('./api/src/config/sequelize');
const CourseEnrollment = require('./api/src/models/CourseEnrollment');
const CourseLessonCompletion = require('./api/src/models/CourseLessonCompletion');
const CourseLesson = require('./api/src/models/CourseLesson');
const CourseModule = require('./api/src/models/CourseModule');
const courseContentService = require('./api/src/services/courseContentService');

async function testProgressUpdate(userId, courseId, lessonId) {
  try {
    console.log('\n🧪 Testing Progress Update Logic');
    console.log('='.repeat(60));
    console.log(`User ID: ${userId}`);
    console.log(`Course ID: ${courseId}`);
    console.log(`Lesson ID: ${lessonId}`);
    
    // Step 1: Get enrollment
    console.log('\n📝 Step 1: Getting enrollment...');
    let enrollment = await CourseEnrollment.findOne({
      where: { user_id: userId, course_id: courseId }
    });
    
    if (!enrollment) {
      console.log('❌ No enrollment found. Creating one...');
      enrollment = await CourseEnrollment.create({
        user_id: userId,
        course_id: courseId,
        progress: 0,
        status: 'not-started',
        start_date: new Date()
      });
      console.log('✅ Enrollment created');
    }
    
    console.log(`Current progress: ${enrollment.progress}%`);
    console.log(`Current status: ${enrollment.status}`);
    
    // Step 2: Verify lesson exists
    console.log('\n📚 Step 2: Verifying lesson...');
    const lesson = await CourseLesson.findOne({
      include: [{
        model: CourseModule,
        as: 'Module',
        where: { course_id: courseId }
      }],
      where: { id: lessonId }
    });
    
    if (!lesson) {
      console.log('❌ Lesson not found in this course!');
      return;
    }
    
    console.log(`✅ Lesson found: ${lesson.title}`);
    
    // Step 3: Create completion record
    console.log('\n✅ Step 3: Creating completion record...');
    const [completion, created] = await CourseLessonCompletion.findOrCreate({
      where: { user_id: userId, lesson_id: lessonId },
      defaults: {
        user_id: userId,
        course_id: courseId,
        lesson_id: lessonId,
        time_spent: 300,
        completed_at: new Date()
      }
    });
    
    if (created) {
      console.log(`✅ Completion record created with ID: ${completion.id}`);
    } else {
      console.log(`ℹ️  Completion record already exists (ID: ${completion.id})`);
    }
    
    // Step 4: Get completed lesson IDs
    console.log('\n📊 Step 4: Getting completed lessons...');
    const completedLessonIds = await CourseLessonCompletion.getCompletedLessonIds(userId, courseId);
    console.log(`Completed lesson IDs: [${completedLessonIds.join(', ')}]`);
    console.log(`Total completed: ${completedLessonIds.length}`);
    
    // Step 5: Calculate progress
    console.log('\n🔢 Step 5: Calculating progress...');
    const progress = await courseContentService.calculateCourseProgress(userId, courseId, completedLessonIds);
    console.log('Progress calculation result:');
    console.log(`  - Total Lessons: ${progress.totalLessons}`);
    console.log(`  - Completed Lessons: ${progress.completedLessons}`);
    console.log(`  - Progress Percentage: ${progress.progressPercentage}%`);
    console.log(`  - Total Duration: ${progress.totalDuration} min`);
    console.log(`  - Completed Duration: ${progress.completedDuration} min`);
    
    // Step 6: Update enrollment
    console.log('\n💾 Step 6: Updating enrollment...');
    const oldProgress = enrollment.progress;
    const oldStatus = enrollment.status;
    
    enrollment.progress = progress.progressPercentage;
    
    if (enrollment.status === 'not-started') {
      enrollment.status = 'in-progress';
    }
    
    if (progress.progressPercentage === 100) {
      enrollment.status = 'completed';
      enrollment.completion_date = new Date();
    }
    
    console.log(`Updating progress from ${oldProgress}% to ${enrollment.progress}%`);
    console.log(`Updating status from ${oldStatus} to ${enrollment.status}`);
    
    await enrollment.save();
    console.log('✅ Enrollment saved');
    
    // Step 7: Verify in database
    console.log('\n🔍 Step 7: Verifying in database...');
    await enrollment.reload();
    console.log(`Progress in DB: ${enrollment.progress}%`);
    console.log(`Status in DB: ${enrollment.status}`);
    
    // Step 8: Direct SQL check
    console.log('\n💾 Step 8: Direct SQL verification...');
    const [results] = await sequelize.query(`
      SELECT 
        ce.id,
        ce.progress,
        ce.status,
        ce.updated_at,
        COUNT(clc.id) as completed_count
      FROM course_enrollments ce
      LEFT JOIN course_lesson_completions clc 
        ON ce.user_id = clc.user_id AND ce.course_id = clc.course_id
      WHERE ce.user_id = ${userId} AND ce.course_id = ${courseId}
      GROUP BY ce.id
    `);
    
    if (results.length > 0) {
      const dbResult = results[0];
      console.log('Direct SQL result:');
      console.log(`  - Enrollment ID: ${dbResult.id}`);
      console.log(`  - Progress: ${dbResult.progress}%`);
      console.log(`  - Status: ${dbResult.status}`);
      console.log(`  - Completed Count: ${dbResult.completed_count}`);
      console.log(`  - Updated At: ${dbResult.updated_at}`);
      
      if (dbResult.progress === progress.progressPercentage) {
        console.log('\n✅ SUCCESS: Progress was saved correctly to database!');
      } else {
        console.log('\n❌ FAILED: Progress in database does not match!');
        console.log(`   Expected: ${progress.progressPercentage}%`);
        console.log(`   Got: ${dbResult.progress}%`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Test completed');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

// Get command line arguments
const userId = parseInt(process.argv[2]) || 1;
const courseId = parseInt(process.argv[3]) || 1;
const lessonId = parseInt(process.argv[4]) || 1;

console.log('🚀 Starting Progress Update Test');
console.log('Usage: node test-progress-update.js <userId> <courseId> <lessonId>');

testProgressUpdate(userId, courseId, lessonId);
