const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api'; // Adjust this to your API base URL
const PROBLEM_ID = 1; // Change this to an existing problem ID with examples

// Sample test data
const testPayload = {
  sourceCode: `
def solution():
    # Simple test code
    numbers = input().split()
    a, b = int(numbers[0]), int(numbers[1])
    return a + b

result = solution()
print(result)
  `.trim(),
  language: 'python'
};

async function testExampleExecution() {
  try {
    console.log('🧪 Testing Example Execution API...');
    console.log('📡 API URL:', `${API_BASE_URL}/problems/${PROBLEM_ID}/execute-examples`);
    console.log('📝 Payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await axios.post(
      `${API_BASE_URL}/problems/${PROBLEM_ID}/execute-examples`,
      testPayload,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      }
    );
    
    console.log('✅ Success! Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Analyze results
    if (response.data.success) {
      const data = response.data.data;
      console.log('\n📊 Analysis:');
      console.log(`- Overall Status: ${data.overallStatus}`);
      console.log(`- Passed: ${data.passedCount}/${data.totalCount} examples`);
      console.log(`- Average Execution Time: ${data.averageExecutionTime}ms`);
      console.log(`- Max Memory Used: ${data.maxMemoryUsed}KB`);
      
      console.log('\n📋 Individual Results:');
      data.results.forEach((result, index) => {
        console.log(`Example ${index + 1}:`);
        console.log(`  - Passed: ${result.passed ? '✅' : '❌'}`);
        console.log(`  - Input: "${result.input}"`);
        console.log(`  - Expected: "${result.expectedOutput}"`);
        console.log(`  - Actual: "${result.actualOutput}"`);
        console.log(`  - Time: ${result.executionTime}ms`);
        console.log(`  - Memory: ${result.memoryUsed}KB`);
        if (result.error) {
          console.log(`  - Error: ${result.error}`);
        }
        if (result.explanation) {
          console.log(`  - Explanation: ${result.explanation}`);
        }
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing API:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received. Is the server running?');
      console.error('Request details:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
  }
}

// Alternative test with different language
async function testWithJavaScript() {
  const jsPayload = {
    sourceCode: `
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('', (input) => {
  const numbers = input.split(' ');
  const a = parseInt(numbers[0]);
  const b = parseInt(numbers[1]);
  console.log(a + b);
  rl.close();
});
    `.trim(),
    language: 'javascript'
  };
  
  try {
    console.log('\n🧪 Testing with JavaScript...');
    const response = await axios.post(
      `${API_BASE_URL}/problems/${PROBLEM_ID}/execute-examples`,
      jsPayload,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    console.log('✅ JavaScript test successful!');
    console.log('Status:', response.data.data.overallStatus);
    console.log('Passed:', `${response.data.data.passedCount}/${response.data.data.totalCount}`);
    
  } catch (error) {
    console.error('❌ JavaScript test failed:', error.response?.data || error.message);
  }
}

// First check if examples exist for the problem
async function checkExamples() {
  try {
    console.log('🔍 Checking examples for problem', PROBLEM_ID);
    const response = await axios.get(`${API_BASE_URL}/problems/${PROBLEM_ID}/examples`);
    
    if (response.data.success && response.data.data.length > 0) {
      console.log(`✅ Found ${response.data.data.length} examples:`);
      response.data.data.forEach((example, index) => {
        console.log(`Example ${index + 1}:`);
        console.log(`  Input: "${example.input}"`);
        console.log(`  Output: "${example.output}"`);
        if (example.explanation) {
          console.log(`  Explanation: "${example.explanation}"`);
        }
      });
      return true;
    } else {
      console.log('❌ No examples found for this problem');
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking examples:', error.response?.data || error.message);
    return false;
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting API Tests for Example Execution\n');
  
  // First check if examples exist
  const hasExamples = await checkExamples();
  
  if (hasExamples) {
    console.log('\n' + '='.repeat(50));
    await testExampleExecution();
    
    console.log('\n' + '='.repeat(50));
    await testWithJavaScript();
  } else {
    console.log('Cannot run tests without examples. Please:');
    console.log('1. Create some examples for problem ID', PROBLEM_ID);
    console.log('2. Or change the PROBLEM_ID at the top of this script');
  }
}

// Execute if run directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testExampleExecution,
  testWithJavaScript,
  checkExamples
};
