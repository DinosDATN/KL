const axios = require('axios');
const https = require('https');

class JudgeService {
  constructor() {
    // Judge0 API configuration
    this.baseURL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
    this.apiHost = process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com';
    this.apiKey = process.env.JUDGE0_API_KEY || '';
    
    // Judge0 settings
    this.maxWaitTime = parseInt(process.env.JUDGE0_MAX_WAIT_TIME) || 30000;
    this.timeout = parseInt(process.env.JUDGE0_TIMEOUT) || 15;
    this.memoryLimit = parseInt(process.env.JUDGE0_MEMORY_LIMIT) || 128000;
    
    // Common headers for RapidAPI
    this.headers = {
      'Content-Type': 'application/json',
      'X-RapidAPI-Host': this.apiHost,
      'X-RapidAPI-Key': this.apiKey
    };
    
    // Enhanced language mapping for Judge0
    this.languageMap = {
      'python': 71,      // Python 3.8.1
      'python3': 71,     // Python 3.8.1 (alias)
      'javascript': 63,  // JavaScript (Node.js 12.14.0)
      'js': 63,          // JavaScript (alias)
      'java': 62,        // Java (OpenJDK 13.0.1)
      'cpp': 54,         // C++ (GCC 9.2.0)
      'c++': 54,         // C++ (alias)
      'c': 50,           // C (GCC 9.2.0)
      'csharp': 51,      // C# (Mono 6.6.0.161)
      'go': 60,          // Go (1.13.5)
      'rust': 73,        // Rust (1.40.0)
      'php': 68,         // PHP (7.4.1)
      'ruby': 72,        // Ruby (2.7.0)
      'kotlin': 78,      // Kotlin (1.3.70)
      'swift': 79,       // Swift (5.2.3)
      'typescript': 74   // TypeScript (3.7.4)
    };
    
    // Status descriptions
    this.statusMap = {
      1: { name: 'In Queue', description: 'Submission is in queue' },
      2: { name: 'Processing', description: 'Submission is being processed' },
      3: { name: 'Accepted', description: 'Submission is accepted' },
      4: { name: 'Wrong Answer', description: 'Wrong answer' },
      5: { name: 'Time Limit Exceeded', description: 'Time limit exceeded' },
      6: { name: 'Compilation Error', description: 'Compilation error' },
      7: { name: 'Runtime Error (SIGSEGV)', description: 'Segmentation fault' },
      8: { name: 'Runtime Error (SIGXFSZ)', description: 'File size limit exceeded' },
      9: { name: 'Runtime Error (SIGFPE)', description: 'Floating point exception' },
      10: { name: 'Runtime Error (SIGABRT)', description: 'Process aborted' },
      11: { name: 'Runtime Error (NZEC)', description: 'Non-zero exit code' },
      12: { name: 'Runtime Error (Other)', description: 'Runtime error' },
      13: { name: 'Internal Error', description: 'Internal error' },
      14: { name: 'Exec Format Error', description: 'Executable format error' }
    };
  }

  /**
   * Create a submission using RapidAPI format (similar to your sample code)
   */
  async createSubmission(sourceCode, languageId, stdin = '', expectedOutput = null, base64Encoded = false) {
    try {
      const submissionData = {
        source_code: base64Encoded ? Buffer.from(sourceCode).toString('base64') : sourceCode,
        language_id: languageId,
        stdin: base64Encoded ? Buffer.from(stdin || '').toString('base64') : (stdin || ''),
        expected_output: expectedOutput ? (base64Encoded ? Buffer.from(expectedOutput).toString('base64') : expectedOutput) : undefined,
        cpu_time_limit: this.timeout,
        memory_limit: this.memoryLimit
      };

      // Remove undefined properties
      Object.keys(submissionData).forEach(key => {
        if (submissionData[key] === undefined) {
          delete submissionData[key];
        }
      });

      const response = await axios.post(
        `${this.baseURL}/submissions?base64_encoded=${base64Encoded}&wait=false&fields=*`,
        submissionData,
        { 
          headers: this.headers,
          timeout: this.maxWaitTime
        }
      );

      return response.data;
    } catch (error) {
      console.error('Judge0 create submission error:', error.response?.data || error.message);
      throw new Error(`Failed to create submission: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get submission result by token (similar to your GET sample)
   */
  async getSubmission(token, base64Encoded = false) {
    try {
      const response = await axios.get(
        `${this.baseURL}/submissions/${token}?base64_encoded=${base64Encoded}&fields=*`,
        { 
          headers: this.headers,
          timeout: this.maxWaitTime
        }
      );

      return response.data;
    } catch (error) {
      console.error('Judge0 get submission error:', error.response?.data || error.message);
      throw new Error(`Failed to get submission: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Wait for submission completion
   */
  async waitForCompletion(token, base64Encoded = false, maxRetries = 10, interval = 2000) {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        const result = await this.getSubmission(token, base64Encoded);
        
        // Check if processing is complete
        if (result.status && result.status.id > 2) {
          return result;
        }
        
        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, interval));
        retries++;
      } catch (error) {
        console.error(`Retry ${retries + 1} failed:`, error.message);
        retries++;
        
        if (retries >= maxRetries) {
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    throw new Error('Submission timed out - max retries exceeded');
  }

  /**
   * Execute code with Judge0 API (Enhanced version)
   */
  async executeCode(sourceCode, language, stdin = '', expectedOutput = null) {
    try {
      const languageId = this.languageMap[language.toLowerCase()];
      if (!languageId) {
        throw new Error(`Unsupported language: ${language}`);
      }

      // Try direct execution with wait=true first
      try {
        const submissionData = {
          source_code: sourceCode,
          language_id: languageId,
          stdin: stdin || '',
          expected_output: expectedOutput || undefined,
          cpu_time_limit: this.timeout,
          memory_limit: this.memoryLimit
        };

        // Remove undefined properties
        Object.keys(submissionData).forEach(key => {
          if (submissionData[key] === undefined) {
            delete submissionData[key];
          }
        });

        const response = await axios.post(
          `${this.baseURL}/submissions?base64_encoded=false&wait=true`,
          submissionData,
          { 
            headers: this.headers,
            timeout: this.maxWaitTime
          }
        );

        return this.formatExecutionResult(response.data);
      } catch (waitError) {
        // If wait=true fails, fall back to async approach
        console.log('Direct execution failed, falling back to async approach');
        
        const submission = await this.createSubmission(sourceCode, languageId, stdin, expectedOutput, false);
        const result = await this.waitForCompletion(submission.token, false);
        
        return this.formatExecutionResult(result);
      }
    } catch (error) {
      console.error('Judge0 execution error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        executionTime: 0,
        memoryUsed: 0,
        stdout: '',
        stderr: ''
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
      'python': 'Python 3.8.1',
      'python3': 'Python 3.8.1',
      'javascript': 'JavaScript (Node.js 12.14.0)',
      'js': 'JavaScript (Node.js 12.14.0)',
      'java': 'Java (OpenJDK 13.0.1)',
      'cpp': 'C++ (GCC 9.2.0)',
      'c++': 'C++ (GCC 9.2.0)',
      'c': 'C (GCC 9.2.0)',
      'csharp': 'C# (Mono 6.6.0.161)',
      'go': 'Go (1.13.5)',
      'rust': 'Rust (1.40.0)',
      'php': 'PHP (7.4.1)',
      'ruby': 'Ruby (2.7.0)',
      'kotlin': 'Kotlin (1.3.70)',
      'swift': 'Swift (5.2.3)',
      'typescript': 'TypeScript (3.7.4)'
    };
    return displayNames[language] || language;
  }

  /**
   * Validate language support
   */
  isLanguageSupported(language) {
    return !!this.languageMap[language.toLowerCase()];
  }

  /**
   * Get language ID by name
   */
  getLanguageId(language) {
    return this.languageMap[language.toLowerCase()] || null;
  }

  /**
   * Get status information
   */
  getStatusInfo(statusId) {
    return this.statusMap[statusId] || { name: 'Unknown', description: 'Unknown status' };
  }

  /**
   * Batch create submissions for multiple test cases
   */
  async batchSubmissions(sourceCode, languageId, testCases, base64Encoded = false) {
    try {
      const submissions = [];
      
      // Create all submissions
      for (const testCase of testCases) {
        const submission = await this.createSubmission(
          sourceCode,
          languageId,
          testCase.input,
          testCase.expected_output,
          base64Encoded
        );
        submissions.push({ ...submission, testCase });
      }
      
      // Wait for all to complete
      const results = [];
      for (const submission of submissions) {
        try {
          const result = await this.waitForCompletion(submission.token, base64Encoded);
          results.push({ result, testCase: submission.testCase });
        } catch (error) {
          console.error(`Failed to get result for submission ${submission.token}:`, error);
          results.push({ 
            error: error.message, 
            testCase: submission.testCase 
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Batch submission error:', error);
      throw error;
    }
  }

  /**
   * Health check for Judge0 API
   */
  async healthCheck() {
    try {
      const response = await axios.get(
        `${this.baseURL}/system_info`,
        { 
          headers: this.headers,
          timeout: 5000
        }
      );
      
      return {
        status: 'healthy',
        info: response.data
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = new JudgeService();
