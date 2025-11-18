/**
 * Test script to check course lessons data
 * Run: node test-course-lessons.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
const COURSE_ID = 1;

async function testCourseLessons() {
  console.log('🧪 Testing Course Lessons Data\n');
  console.log('='.repeat(50));
  
  try {
    // Test 1: Get course details
    console.log('\n📋 Test 1: Get Course Details');
    console.log('-'.repeat(50));
    
    const detailsResponse = await axios.get(`${API_URL}/courses/${COURSE_ID}/details`);
    
    if (detailsResponse.data.success) {
      const { course, modules, lessons } = detailsResponse.data.data;
      
      console.log('✅ Course found:', course.title);
      console.log(`📚 Modules: ${modules.length}`);
      console.log(`📖 Lessons: ${lessons.length}`);
      
      console.log('\n📊 Modules:');
      modules.forEach((module, index) => {
        console.log(`  ${index + 1}. [ID: ${module.id}] ${module.title} (Position: ${module.position})`);
      });
      
      console.log('\n📖 Lessons:');
      if (lessons.length === 0) {
        console.log('  ⚠️  NO LESSONS FOUND!');
      } else {
        lessons.forEach((lesson, index) => {
          const module = modules.find(m => m.id === lesson.module_id);
          console.log(`  ${index + 1}. [ID: ${lesson.id}] ${lesson.title}`);
          console.log(`     Module: ${module ? module.title : 'NOT FOUND (ID: ' + lesson.module_id + ')'}`);
          console.log(`     Type: ${lesson.type}, Duration: ${lesson.duration}min, Position: ${lesson.position}`);
        });
      }
      
      // Check for orphaned lessons (lessons without valid module)
      console.log('\n🔍 Checking for orphaned lessons:');
      const orphanedLessons = lessons.filter(lesson => {
        return !modules.find(m => m.id === lesson.module_id);
      });
      
      if (orphanedLessons.length > 0) {
        console.log(`  ⚠️  Found ${orphanedLessons.length} orphaned lessons:`);
        orphanedLessons.forEach(lesson => {
          console.log(`    - [ID: ${lesson.id}] ${lesson.title} (module_id: ${lesson.module_id})`);
        });
      } else {
        console.log('  ✅ All lessons have valid modules');
      }
      
    } else {
      console.log('❌ Failed to get course details:', detailsResponse.data.message);
    }
    
    // Test 2: Try to access a specific lesson
    console.log('\n\n📋 Test 2: Access Specific Lesson');
    console.log('-'.repeat(50));
    
    const lessonId = 1;
    console.log(`Trying to access lesson ID: ${lessonId}`);
    
    const { lessons } = detailsResponse.data.data;
    const lesson = lessons.find(l => l.id === lessonId);
    
    if (lesson) {
      console.log('✅ Lesson found:');
      console.log(`  ID: ${lesson.id}`);
      console.log(`  Title: ${lesson.title}`);
      console.log(`  Module ID: ${lesson.module_id}`);
      console.log(`  Type: ${lesson.type}`);
      console.log(`  Duration: ${lesson.duration}min`);
      console.log(`  Position: ${lesson.position}`);
      console.log(`\n  URL: http://localhost:4200/courses/${COURSE_ID}/lessons/${lessonId}`);
    } else {
      console.log(`❌ Lesson with ID ${lessonId} not found in course ${COURSE_ID}`);
      console.log('\n  Available lesson IDs:', lessons.map(l => l.id).join(', '));
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Test completed\n');
}

// Run the test
testCourseLessons();
