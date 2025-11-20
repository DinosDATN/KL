const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

// Test credentials - replace with actual admin credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'admin123'
};

let authToken = '';

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null) => {
  try {
    const config = {
      method,
      url: `${API_URL}${url}`,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error in ${method} ${url}:`, error.response?.data || error.message);
    throw error;
  }
};

// Test functions
async function testLogin() {
  console.log('\n📝 Testing Admin Login...');
  try {
    const response = await makeRequest('POST', '/auth/login', ADMIN_CREDENTIALS);
    console.log('✅ Login successful');
    console.log('User:', response.user);
    return true;
  } catch (error) {
    console.error('❌ Login failed');
    return false;
  }
}

async function testGetInstructorStatistics() {
  console.log('\n📊 Testing Get Instructor Statistics...');
  try {
    const response = await makeRequest('GET', '/admin/instructors/statistics');
    console.log('✅ Statistics retrieved successfully');
    console.log('Statistics:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Failed to get statistics');
    return false;
  }
}

async function testGetAllInstructors() {
  console.log('\n👥 Testing Get All Instructors...');
  try {
    const response = await makeRequest('GET', '/admin/instructors?page=1&limit=10');
    console.log('✅ Instructors retrieved successfully');
    console.log(`Found ${response.data.length} instructors`);
    console.log('Pagination:', response.pagination);
    return response.data[0]?.id; // Return first instructor ID for further tests
  } catch (error) {
    console.error('❌ Failed to get instructors');
    return null;
  }
}

async function testGetInstructorById(instructorId) {
  if (!instructorId) {
    console.log('\n⚠️  Skipping Get Instructor By ID (no instructor ID available)');
    return false;
  }

  console.log(`\n🔍 Testing Get Instructor By ID (${instructorId})...`);
  try {
    const response = await makeRequest('GET', `/admin/instructors/${instructorId}`);
    console.log('✅ Instructor details retrieved successfully');
    console.log('Instructor:', response.data.instructor.name);
    console.log('Courses:', response.data.courses.length);
    console.log('Statistics:', response.data.statistics);
    return true;
  } catch (error) {
    console.error('❌ Failed to get instructor details');
    return false;
  }
}

async function testUpdateInstructor(instructorId) {
  if (!instructorId) {
    console.log('\n⚠️  Skipping Update Instructor (no instructor ID available)');
    return false;
  }

  console.log(`\n✏️  Testing Update Instructor (${instructorId})...`);
  try {
    const updateData = {
      subscription_status: 'premium'
    };
    const response = await makeRequest('PUT', `/admin/instructors/${instructorId}`, updateData);
    console.log('✅ Instructor updated successfully');
    console.log('Updated instructor:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Failed to update instructor');
    return false;
  }
}

async function testToggleInstructorStatus(instructorId) {
  if (!instructorId) {
    console.log('\n⚠️  Skipping Toggle Instructor Status (no instructor ID available)');
    return false;
  }

  console.log(`\n🔄 Testing Toggle Instructor Status (${instructorId})...`);
  try {
    const response = await makeRequest('PATCH', `/admin/instructors/${instructorId}/status`);
    console.log('✅ Instructor status toggled successfully');
    console.log('New status:', response.data.is_active ? 'Active' : 'Inactive');
    return true;
  } catch (error) {
    console.error('❌ Failed to toggle instructor status');
    return false;
  }
}

async function testCreateQualification(instructorId) {
  if (!instructorId) {
    console.log('\n⚠️  Skipping Create Qualification (no instructor ID available)');
    return null;
  }

  console.log(`\n➕ Testing Create Qualification for Instructor (${instructorId})...`);
  try {
    const qualificationData = {
      title: 'Test Qualification',
      institution: 'Test University',
      date: '2020-01-01',
      credential_url: 'https://example.com/credential'
    };
    const response = await makeRequest('POST', `/admin/instructors/${instructorId}/qualifications`, qualificationData);
    console.log('✅ Qualification created successfully');
    console.log('Qualification:', response.data);
    return response.data.id;
  } catch (error) {
    console.error('❌ Failed to create qualification');
    return null;
  }
}

async function testUpdateQualification(instructorId, qualificationId) {
  if (!instructorId || !qualificationId) {
    console.log('\n⚠️  Skipping Update Qualification (missing IDs)');
    return false;
  }

  console.log(`\n✏️  Testing Update Qualification (${qualificationId})...`);
  try {
    const updateData = {
      title: 'Updated Test Qualification'
    };
    const response = await makeRequest('PUT', `/admin/instructors/${instructorId}/qualifications/${qualificationId}`, updateData);
    console.log('✅ Qualification updated successfully');
    console.log('Updated qualification:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Failed to update qualification');
    return false;
  }
}

async function testDeleteQualification(instructorId, qualificationId) {
  if (!instructorId || !qualificationId) {
    console.log('\n⚠️  Skipping Delete Qualification (missing IDs)');
    return false;
  }

  console.log(`\n🗑️  Testing Delete Qualification (${qualificationId})...`);
  try {
    const response = await makeRequest('DELETE', `/admin/instructors/${instructorId}/qualifications/${qualificationId}`);
    console.log('✅ Qualification deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to delete qualification');
    return false;
  }
}

async function testFilterInstructors() {
  console.log('\n🔍 Testing Filter Instructors...');
  try {
    // Test with various filters
    const filters = [
      { name: 'Active instructors', params: 'is_active=true' },
      { name: 'Instructors with courses', params: 'has_courses=true' },
      { name: 'Min 1 course', params: 'min_courses=1' },
      { name: 'Sort by rating', params: 'sortBy=avg_rating' }
    ];

    for (const filter of filters) {
      console.log(`\n  Testing filter: ${filter.name}`);
      const response = await makeRequest('GET', `/admin/instructors?${filter.params}`);
      console.log(`  ✅ Found ${response.data.length} instructors`);
    }
    return true;
  } catch (error) {
    console.error('❌ Failed to filter instructors');
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Instructor Management API Tests\n');
  console.log('='.repeat(50));

  try {
    // Login first
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
      console.log('\n❌ Cannot proceed without successful login');
      return;
    }

    // Run tests
    await testGetInstructorStatistics();
    const instructorId = await testGetAllInstructors();
    await testGetInstructorById(instructorId);
    await testFilterInstructors();
    await testUpdateInstructor(instructorId);
    await testToggleInstructorStatus(instructorId);
    
    // Test qualifications
    const qualificationId = await testCreateQualification(instructorId);
    await testUpdateQualification(instructorId, qualificationId);
    await testDeleteQualification(instructorId, qualificationId);

    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests completed!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
}

// Run the tests
runTests();
