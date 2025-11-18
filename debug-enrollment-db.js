/**
 * Debug script to check enrollment and completion data in database
 */

require('dotenv').config({ path: './api/.env' });
const { sequelize } = require('./api/src/config/sequelize');
const CourseEnrollment = require('./api/src/models/CourseEnrollment');
const CourseLessonCompletion = require('./api/src/models/CourseLessonCompletion');
const CourseLesson = require('./api/src/models/CourseLesson');
const CourseModule = require('./api/src/models/CourseModule');

async function debugEnrollment(userId, courseId) {
  try {
    console.log('\n🔍 Debugging Enrollment Data');
    console.log('='.repeat(60));
    console.log(`User ID: ${userId}`);
    console.log(`Course ID: ${courseId}`);
    
    // Check enrollment
    console.log('\n📝 Checking enrollment...');
    const enrollment = await CourseEnrollment.findOne({
      where: { user_id: userId, course_id: courseId }
    });
    
    if (!enrollment) {
      console.log('❌ No enrollment found!');
      return;
    }
    
    console.log('✅ Enrollment found:');
    console.log(`  - ID: ${enrollment.id}`);
    console.log(`  - Progress: ${enrollment.progress}%`);
    console.log(`  - Status: ${enrollment.status}`);
    console.log(`  - Start Date: ${enrollment.start_date}`);
    console.log(`  - Completion Date: ${enrollment.completion_date}`);
    console.log(`  - Created: ${enrollment.created_at}`);
    console.log(`  - Updated: ${enrollment.updated_at}`);
    
    // Check lesson completions
    console.log('\n📚 Checking lesson completions...');
    const completions = await CourseLessonCompletion.findAll({
      where: { user_id: userId, course_id: courseId },
      order: [['completed_at', 'DESC']]
    });
    
    console.log(`✅ Found ${completions.length} completed lessons:`);
    completions.forEach((completion, index) => {
      console.log(`  ${index + 1}. Lesson ID: ${completion.lesson_id}`);
      console.log(`     - Time Spent: ${completion.time_spent}s`);
      console.log(`     - Completed At: ${completion.completed_at}`);
    });
    
    // Get all lessons in course
    console.log('\n📖 Checking total lessons in course...');
    const lessons = await CourseLesson.findAll({
      include: [{
        model: CourseModule,
        as: 'Module',
        where: { course_id: courseId }
      }]
    });
    
    console.log(`✅ Total lessons in course: ${lessons.length}`);
    
    // Calculate expected progress
    const expectedProgress = lessons.length > 0 
      ? Math.round((completions.length / lessons.length) * 100) 
      : 0;
    
    console.log('\n📊 Progress Calculation:');
    console.log(`  - Completed Lessons: ${completions.length}`);
    console.log(`  - Total Lessons: ${lessons.length}`);
    console.log(`  - Expected Progress: ${expectedProgress}%`);
    console.log(`  - Actual Progress in DB: ${enrollment.progress}%`);
    
    if (expectedProgress !== enrollment.progress) {
      console.log('\n⚠️  WARNING: Progress mismatch!');
      console.log('  The progress in database does not match the calculation.');
      console.log('  This might indicate an issue with the update logic.');
    } else {
      console.log('\n✅ Progress matches calculation!');
    }
    
    // Show raw SQL queries for verification
    console.log('\n💾 SQL Queries for Manual Verification:');
    console.log('\n-- Check enrollment:');
    console.log(`SELECT * FROM course_enrollments WHERE user_id = ${userId} AND course_id = ${courseId};`);
    
    console.log('\n-- Check completions:');
    console.log(`SELECT * FROM course_lesson_completions WHERE user_id = ${userId} AND course_id = ${courseId};`);
    
    console.log('\n-- Calculate progress:');
    console.log(`
SELECT 
  ce.id,
  ce.progress as stored_progress,
  ce.status,
  COUNT(clc.id) as completed_lessons,
  (SELECT COUNT(*) 
   FROM course_lessons cl 
   JOIN course_modules cm ON cl.module_id = cm.id 
   WHERE cm.course_id = ${courseId}) as total_lessons,
  ROUND((COUNT(clc.id) * 100.0 / (SELECT COUNT(*) 
   FROM course_lessons cl 
   JOIN course_modules cm ON cl.module_id = cm.id 
   WHERE cm.course_id = ${courseId})), 0) as calculated_progress
FROM course_enrollments ce
LEFT JOIN course_lesson_completions clc 
  ON ce.user_id = clc.user_id AND ce.course_id = clc.course_id
WHERE ce.user_id = ${userId} AND ce.course_id = ${courseId}
GROUP BY ce.id;
    `);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

// Get command line arguments
const userId = process.argv[2] || 1;
const courseId = process.argv[3] || 1;

console.log('🚀 Starting Enrollment Debug Script');
console.log('Usage: node debug-enrollment-db.js <userId> <courseId>');

debugEnrollment(parseInt(userId), parseInt(courseId));
