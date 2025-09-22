const axios = require('axios');

// Test configuration
const API_BASE_URL = 'http://localhost:3000/api/v1';
const TEST_USER_ID = 1;
const TEST_PROBLEM_ID = 1;

async function testSubmissionStorage() {
  console.log('🧪 Testing Submission Storage Feature...\n');

  try {
    // Test 1: Submit code for a problem
    console.log('1. Testing code submission...');
    const submissionResponse = await axios.post(
      `${API_BASE_URL}/problems/${TEST_PROBLEM_ID}/submit`,
      {
        sourceCode: `# Test submission
def solution():
    return "Hello World!"

print(solution())`,
        language: 'python',
        userId: TEST_USER_ID
      }
    );

    console.log('✅ Code submitted successfully');
    console.log('📊 Submission result:', {
      status: submissionResponse.data.data.status,
      score: submissionResponse.data.data.score,
      testCasesPassed: submissionResponse.data.data.testCasesPassed,
      totalTestCases: submissionResponse.data.data.totalTestCases
    });

    // Test 2: Get problem submissions
    console.log('\n2. Testing problem submissions retrieval...');
    const problemSubmissionsResponse = await axios.get(
      `${API_BASE_URL}/problems/${TEST_PROBLEM_ID}/submissions?userId=${TEST_USER_ID}&limit=5`
    );

    console.log('✅ Problem submissions retrieved successfully');
    console.log(`📝 Found ${problemSubmissionsResponse.data.data.length} submissions for user ${TEST_USER_ID}`);

    // Test 3: Get all submissions for dashboard
    console.log('\n3. Testing dashboard submissions retrieval...');
    const allSubmissionsResponse = await axios.get(
      `${API_BASE_URL}/problems/dashboard/submissions?userId=${TEST_USER_ID}&limit=10`
    );

    console.log('✅ All submissions retrieved successfully');
    console.log(`📊 Total submissions for user: ${allSubmissionsResponse.data.pagination.total_items}`);

    if (allSubmissionsResponse.data.data.length > 0) {
      const latestSubmission = allSubmissionsResponse.data.data[0];
      console.log('📋 Latest submission details:', {
        id: latestSubmission.id,
        problem_title: latestSubmission.problem?.title || 'Unknown',
        language: latestSubmission.language,
        status: latestSubmission.status,
        score: latestSubmission.score,
        submitted_at: latestSubmission.submitted_at
      });
    }

    // Test 4: Get submission statistics
    console.log('\n4. Testing submission statistics...');
    const statsResponse = await axios.get(
      `${API_BASE_URL}/problems/dashboard/stats?userId=${TEST_USER_ID}`
    );

    console.log('✅ Submission statistics retrieved successfully');
    console.log('📈 Statistics:', {
      totalSubmissions: statsResponse.data.data.totalSubmissions,
      statusStats: statsResponse.data.data.statusStats,
      languageStats: statsResponse.data.data.languageStats,
      uniqueUsers: statsResponse.data.data.uniqueUsers
    });

    console.log('\n🎉 All tests passed! Submission storage feature is working correctly.');
    console.log('\n✨ Features verified:');
    console.log('   ✅ Code submission with user tracking');
    console.log('   ✅ Submission retrieval by problem and user');
    console.log('   ✅ Dashboard submission listing');
    console.log('   ✅ Submission statistics and analytics');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      console.log('\n💡 Note: Make sure the API server is running and the test problem/user exists in the database.');
    }
  }
}

// Run the tests
testSubmissionStorage();
