const judgeService = require('../services/judgeService');

class Judge0Controller {
  /**
   * Execute code - For quick testing and debugging
   */
  async executeCode(req, res) {
    try {
      const { source_code, language, stdin } = req.body;

      // Validate required fields
      if (!source_code || !language) {
        return res.status(400).json({
          success: false,
          message: 'Source code and language are required'
        });
      }

      // Execute code using Judge0 service
      const result = await judgeService.executeCode(
        source_code,
        language,
        stdin || ''
      );

      res.status(200).json({
        success: true,
        data: {
          output: result.stdout || '',
          error: result.stderr || result.error || null,
          status: result.success ? 'completed' : 'error',
          execution_time: result.executionTime,
          memory_used: result.memoryUsed
        }
      });

    } catch (error) {
      console.error('Error in executeCode:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to execute code',
        error: error.message
      });
    }
  }

  /**
   * Submit code for evaluation against test cases
   */
  async submitCode(req, res) {
    try {
      const { source_code, language, test_cases } = req.body;

      // Validate required fields
      if (!source_code || !language || !test_cases || !Array.isArray(test_cases)) {
        return res.status(400).json({
          success: false,
          message: 'Source code, language, and test_cases array are required'
        });
      }

      // Validate test cases format
      for (const testCase of test_cases) {
        if (!testCase.hasOwnProperty('input') || !testCase.hasOwnProperty('expected_output')) {
          return res.status(400).json({
            success: false,
            message: 'Each test case must have input and expected_output properties'
          });
        }
      }

      // Submit code using Judge0 service
      const result = await judgeService.submitCode(
        source_code,
        language,
        test_cases
      );

      res.status(200).json({
        success: true,
        data: {
          submission_id: result.submissionId,
          status: result.status,
          score: result.score,
          execution_time: result.executionTime,
          memory_used: result.memoryUsed,
          test_cases_passed: result.testCasesPassed,
          total_test_cases: result.totalTestCases,
          test_results: result.testCaseResults,
          error: result.error || null
        }
      });

    } catch (error) {
      console.error('Error in submitCode:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit code',
        error: error.message
      });
    }
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages(req, res) {
    try {
      const languages = judgeService.getSupportedLanguages();

      res.status(200).json({
        success: true,
        data: languages
      });

    } catch (error) {
      console.error('Error in getSupportedLanguages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get supported languages',
        error: error.message
      });
    }
  }

  /**
   * Health check for Judge0 service
   */
  async healthCheck(req, res) {
    try {
      // Try to execute a simple test to check if Judge0 is working
      const testResult = await judgeService.executeCode(
        'console.log("Hello, Judge0!");',
        'javascript',
        ''
      );

      const isHealthy = testResult.success && testResult.stdout.includes('Hello, Judge0!');

      res.status(isHealthy ? 200 : 503).json({
        success: isHealthy,
        message: isHealthy ? 'Judge0 service is healthy' : 'Judge0 service is not responding properly',
        data: {
          judge0_available: isHealthy,
          test_execution_time: testResult.executionTime || 0,
          last_check: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error in Judge0 health check:', error);
      res.status(503).json({
        success: false,
        message: 'Judge0 service is not available',
        error: error.message,
        data: {
          judge0_available: false,
          last_check: new Date().toISOString()
        }
      });
    }
  }
}

module.exports = new Judge0Controller();
