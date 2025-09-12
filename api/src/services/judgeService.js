const axios = require('axios');

class JudgeService {
  constructor() {
    // Judge0 API configuration
    this.baseURL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
    this.headers = {
      'Content-Type': 'application/json',
      'X-RapidAPI-Host': process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com',
      'X-RapidAPI-Key': process.env.JUDGE0_API_KEY || ''
    };
    
    // Language mapping for Judge0
    this.languageMap = {
      'python': 71,      // Python 3.8.1
      'javascript': 63,  // JavaScript (Node.js 12.14.0)
      'java': 62,        // Java (OpenJDK 13.0.1)
      'cpp': 54,         // C++ (GCC 9.2.0)
      'c': 50            // C (GCC 9.2.0)
    };
  }

  /**
   * Execute code with Judge0 API
   */
  async executeCode(sourceCode, language, stdin = '', expectedOutput = null) {
    try {
      const languageId = this.languageMap[language.toLowerCase()];
      if (!languageId) {
        throw new Error(`Unsupported language: ${language}`);
      }

      // Create submission
      const submissionData = {
        source_code: sourceCode,
        language_id: languageId,
        stdin: stdin || '',
        expected_output: expectedOutput || undefined
      };

      const response = await axios.post(
        `${this.baseURL}/submissions?base64_encoded=false&wait=true`,
        submissionData,
        { headers: this.headers }
      );

      return this.formatExecutionResult(response.data);
    } catch (error) {
      console.error('Judge0 execution error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        executionTime: 0,
        memoryUsed: 0
      };
    }
  }

  /**
   * Submit code and run against test cases
   */
  async submitCode(sourceCode, language, testCases) {
    try {
      const languageId = this.languageMap[language.toLowerCase()];
      if (!languageId) {
        throw new Error(`Unsupported language: ${language}`);
      }

      const results = [];
      let passedCount = 0;
      let totalExecutionTime = 0;
      let maxMemoryUsed = 0;

      // Run code against each test case
      for (const testCase of testCases) {
        const result = await this.executeCode(
          sourceCode,
          language,
          testCase.input,
          testCase.expected_output
        );

        const passed = result.success && 
                      result.stdout && 
                      result.stdout.trim() === testCase.expected_output.trim();

        if (passed) passedCount++;
        
        totalExecutionTime += result.executionTime || 0;
        maxMemoryUsed = Math.max(maxMemoryUsed, result.memoryUsed || 0);

        results.push({
          input: testCase.input,
          expectedOutput: testCase.expected_output,
          actualOutput: result.stdout || '',
          passed: passed,
          executionTime: result.executionTime || 0,
          error: result.error || result.stderr || null
        });
      }

      // Calculate final status and score
      const score = Math.floor((passedCount / testCases.length) * 100);
      let status = 'accepted';
      
      if (score === 0) {
        status = 'wrong';
      } else if (score < 100) {
        status = 'wrong';
      }

      // Check for runtime errors
      if (results.some(r => r.error && !r.passed)) {
        status = 'error';
      }

      return {
        submissionId: 'SUB_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        status: status,
        score: score,
        executionTime: Math.floor(totalExecutionTime / testCases.length),
        memoryUsed: maxMemoryUsed,
        testCasesPassed: passedCount,
        totalTestCases: testCases.length,
        testCaseResults: results
      };

    } catch (error) {
      console.error('Judge0 submission error:', error);
      return {
        submissionId: 'ERR_' + Date.now(),
        status: 'error',
        score: 0,
        executionTime: 0,
        memoryUsed: 0,
        testCasesPassed: 0,
        totalTestCases: testCases.length,
        error: error.message,
        testCaseResults: []
      };
    }
  }

  /**
   * Format Judge0 API response
   */
  formatExecutionResult(data) {
    const result = {
      success: data.status?.id === 3, // Accepted
      stdout: data.stdout || '',
      stderr: data.stderr || '',
      error: data.compile_output || data.message || null,
      executionTime: parseFloat(data.time) * 1000 || 0, // Convert to milliseconds
      memoryUsed: parseInt(data.memory) || 0 // In KB
    };

    // Handle different status codes
    switch (data.status?.id) {
      case 1: // In Queue
      case 2: // Processing
        result.error = 'Execution in progress';
        result.success = false;
        break;
      case 3: // Accepted
        result.success = true;
        break;
      case 4: // Wrong Answer
        result.success = false;
        result.error = 'Wrong Answer';
        break;
      case 5: // Time Limit Exceeded
        result.success = false;
        result.error = 'Time Limit Exceeded';
        break;
      case 6: // Compilation Error
        result.success = false;
        result.error = data.compile_output || 'Compilation Error';
        break;
      case 7: // Runtime Error (SIGSEGV)
      case 8: // Runtime Error (SIGXFSZ)
      case 9: // Runtime Error (SIGFPE)
      case 10: // Runtime Error (SIGABRT)
      case 11: // Runtime Error (NZEC)
      case 12: // Runtime Error (Other)
        result.success = false;
        result.error = data.stderr || 'Runtime Error';
        break;
      case 13: // Internal Error
        result.success = false;
        result.error = 'Internal Error';
        break;
      case 14: // Exec Format Error
        result.success = false;
        result.error = 'Exec Format Error';
        break;
      default:
        result.success = false;
        result.error = data.status?.description || 'Unknown error';
    }

    return result;
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return Object.keys(this.languageMap).map(lang => ({
      id: lang,
      name: this.getLanguageDisplayName(lang),
      judgeId: this.languageMap[lang]
    }));
  }

  /**
   * Get display name for language
   */
  getLanguageDisplayName(language) {
    const displayNames = {
      'python': 'Python 3',
      'javascript': 'JavaScript (Node.js)',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C'
    };
    return displayNames[language] || language;
  }
}

module.exports = new JudgeService();
