# Judge0 Integration Guide

## Overview

This document provides comprehensive information about the Judge0 API integration for code evaluation in the LFYS platform.

## Features

- **Code Execution**: Run code snippets with custom input
- **Code Submission**: Submit solutions and test against problem test cases
- **Batch Processing**: Execute multiple test cases efficiently
- **Async Operations**: Handle long-running submissions with token-based polling
- **Rate Limiting**: Prevent abuse with configurable rate limits
- **Security**: Input validation, output sanitization, and security headers
- **Monitoring**: Comprehensive logging and health checks

## Supported Languages

| Language | ID | Judge0 ID | Version |
|----------|----|-----------|---------| 
| Python | python | 71 | 3.8.1 |
| JavaScript | javascript | 63 | Node.js 12.14.0 |
| Java | java | 62 | OpenJDK 13.0.1 |
| C++ | cpp | 54 | GCC 9.2.0 |
| C | c | 50 | GCC 9.2.0 |
| C# | csharp | 51 | Mono 6.6.0.161 |
| Go | go | 60 | 1.13.5 |
| Rust | rust | 73 | 1.40.0 |
| PHP | php | 68 | 7.4.1 |
| Ruby | ruby | 72 | 2.7.0 |
| Kotlin | kotlin | 78 | 1.3.70 |
| Swift | swift | 79 | 5.2.3 |
| TypeScript | typescript | 74 | 3.7.4 |

## API Endpoints

### 1. Execute Code (Run)
**POST** `/api/v1/problems/execute`

Execute code with custom input for testing purposes.

**Request Body:**
```json
{
  "sourceCode": "print('Hello, World!')",
  "language": "python",
  "input": ""
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "stdout": "Hello, World!\n",
    "stderr": "",
    "error": null,
    "executionTime": 0.023,
    "memoryUsed": 3072
  }
}
```

**Rate Limit:** 5 requests per minute per IP

### 2. Submit Code
**POST** `/api/v1/problems/:id/submit`

Submit code solution for a specific problem and test against all test cases.

**Request Body:**
```json
{
  "sourceCode": "n = int(input())\nprint(n * 2)",
  "language": "python",
  "userId": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "submissionId": "SUB_1640995200000_abc123",
    "status": "accepted",
    "score": 100,
    "executionTime": 0.025,
    "memoryUsed": 3072,
    "testCasesPassed": 5,
    "totalTestCases": 5,
    "testCaseResults": [
      {
        "input": "5",
        "expectedOutput": "10",
        "actualOutput": "10",
        "passed": true,
        "executionTime": 0.025,
        "error": null
      }
    ]
  }
}
```

**Rate Limit:** 10 requests per minute per IP

### 3. Batch Submit (Enhanced)
**POST** `/api/v1/problems/:id/batch-submit`

Submit code with optimized batch processing for better performance.

**Request Body:** Same as submit code
**Response:** Same as submit code

**Rate Limit:** 3 requests per minute per IP

### 4. Async Submit
**POST** `/api/v1/problems/async-submit`

Create an async submission and get a token for polling.

**Request Body:**
```json
{
  "sourceCode": "console.log('Hello');",
  "language": "javascript",
  "input": "",
  "expectedOutput": "Hello",
  "base64Encoded": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "550e8400-e29b-41d4-a716-446655440000",
    "message": "Submission created successfully. Use the token to check status."
  }
}
```

### 5. Get Submission Result
**GET** `/api/v1/problems/submission/:token`

Get the result of an async submission using the token.

**Query Parameters:**
- `base64_encoded`: boolean (default: false)

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "550e8400-e29b-41d4-a716-446655440000",
    "rawResult": {
      "status": {"id": 3, "description": "Accepted"},
      "stdout": "Hello\n",
      "stderr": null,
      "time": "0.023",
      "memory": 3072
    },
    "formattedResult": {
      "success": true,
      "stdout": "Hello\n",
      "stderr": "",
      "error": null,
      "executionTime": 23,
      "memoryUsed": 3072
    }
  }
}
```

### 6. Get Supported Languages
**GET** `/api/v1/problems/data/languages`

Get list of all supported programming languages.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "python",
      "name": "Python 3.8.1",
      "judgeId": 71
    }
  ]
}
```

### 7. Health Check
**GET** `/api/v1/problems/judge/health`

Check the health status of the Judge0 API service.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "info": {
      "version": "1.13.0",
      "maintainer": "Herman Zvonimir Došilović",
      "homepage": "https://judge0.com"
    }
  }
}
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Judge0 Configuration (RapidAPI)
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_HOST=judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your_rapidapi_key_here

# Judge0 Settings
JUDGE0_MAX_WAIT_TIME=30000
JUDGE0_TIMEOUT=15
JUDGE0_MEMORY_LIMIT=128000
```

### Rate Limiting

Rate limits are implemented to prevent abuse:

- **Execute**: 5 requests/minute
- **Submit**: 10 requests/minute  
- **Batch Submit**: 3 requests/minute
- **Async Submit**: 10 requests/minute

### Security Features

1. **Input Validation**
   - Source code max size: 64KB
   - Input data max size: 10KB
   - Language validation

2. **Output Sanitization**
   - Path information removal
   - Sensitive token removal

3. **Security Headers**
   - Cache-Control: no-store
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block

4. **Error Handling**
   - Internal errors are not exposed in production
   - Comprehensive logging for debugging

## Database Models

### JudgeSubmission Model

Tracks detailed information about Judge0 submissions:

```javascript
{
  id: BIGINT,
  token: STRING, // Judge0 submission token
  user_id: BIGINT,
  problem_id: BIGINT,
  source_code: TEXT,
  language: STRING,
  language_id: INTEGER,
  stdin: TEXT,
  expected_output: TEXT,
  stdout: TEXT,
  stderr: TEXT,
  compile_output: TEXT,
  status_id: INTEGER,
  status_description: STRING,
  execution_time: FLOAT,
  memory_used: INTEGER,
  is_base64_encoded: BOOLEAN,
  submission_type: ENUM('execute', 'submit', 'test'),
  is_completed: BOOLEAN,
  raw_response: JSON,
  created_at: DATE,
  updated_at: DATE
}
```

## Error Handling

### Common Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Source code is required | Missing source code in request |
| 400 | Programming language is required | Missing language in request |
| 400 | Unsupported language | Language not in supported list |
| 400 | Source code is too long | Code exceeds 64KB limit |
| 400 | Input data is too long | Input exceeds 10KB limit |
| 429 | Too many requests | Rate limit exceeded |
| 503 | Service temporarily unavailable | Judge0 API is down |

### Status Mapping

Judge0 status codes are mapped to user-friendly messages:

| ID | Status | Description |
|----|--------|-------------|
| 1 | In Queue | Submission is queued |
| 2 | Processing | Being processed |
| 3 | Accepted | Successful execution |
| 4 | Wrong Answer | Output doesn't match expected |
| 5 | Time Limit Exceeded | Execution timed out |
| 6 | Compilation Error | Code compilation failed |
| 7-12 | Runtime Error | Various runtime errors |
| 13 | Internal Error | Judge0 internal error |
| 14 | Exec Format Error | Executable format error |

## Frontend Integration

### Using the Problems Service

```typescript
// Execute code
this.problemsService.executeCode(sourceCode, language, input).subscribe(
  result => {
    console.log('Execution result:', result);
  },
  error => {
    console.error('Execution failed:', error);
  }
);

// Submit code
this.problemsService.submitCode(problemId, sourceCode, language, userId).subscribe(
  result => {
    console.log('Submission result:', result);
  },
  error => {
    console.error('Submission failed:', error);
  }
);
```

## Monitoring and Logging

All Judge0 operations are logged with:
- Request details (language, code length, user)
- Response details (status, duration, success)
- Error information for debugging

Log format:
```
[Judge0] 2023-12-31T23:59:59Z - POST /api/v1/problems/execute {
  language: "python",
  sourceCodeLength: 25,
  inputLength: 0,
  userId: "123",
  ip: "192.168.1.1"
}

[Judge0] Response 200 {
  duration: "245ms",
  success: true,
  hasData: true,
  error: null
}
```

## Testing

### Sample Test Cases

1. **Basic Execution**
```bash
curl -X POST http://localhost:3000/api/v1/problems/execute \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCode": "print(\"Hello, World!\")",
    "language": "python",
    "input": ""
  }'
```

2. **Code Submission**
```bash
curl -X POST http://localhost:3000/api/v1/problems/1/submit \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCode": "n = int(input())\nprint(n * 2)",
    "language": "python",
    "userId": 1
  }'
```

3. **Health Check**
```bash
curl http://localhost:3000/api/v1/problems/judge/health
```

## Performance Optimization

1. **Batch Processing**: Use batch submissions for problems with many test cases
2. **Async Operations**: Use async submissions for long-running code
3. **Rate Limiting**: Prevents system overload
4. **Connection Pooling**: Reuses HTTP connections to Judge0
5. **Error Recovery**: Fallback mechanisms for Judge0 failures

## Troubleshooting

### Common Issues

1. **API Key Issues**
   - Verify JUDGE0_API_KEY is set correctly
   - Check RapidAPI subscription status

2. **Network Issues**
   - Verify connectivity to judge0-ce.p.rapidapi.com
   - Check firewall settings

3. **Rate Limiting**
   - Monitor rate limit headers
   - Implement exponential backoff

4. **Memory/Timeout Issues**
   - Adjust JUDGE0_TIMEOUT and JUDGE0_MEMORY_LIMIT
   - Optimize test cases

### Debug Mode

Set `NODE_ENV=development` to enable detailed error messages and debug logging.

## Best Practices

1. **Always validate input** before sending to Judge0
2. **Use appropriate rate limits** based on your usage patterns
3. **Monitor API health** regularly
4. **Log all operations** for debugging and analytics
5. **Handle errors gracefully** with user-friendly messages
6. **Cache results** when appropriate to reduce API calls
7. **Use batch operations** for multiple test cases
8. **Implement retry logic** with exponential backoff

This integration provides a robust, secure, and scalable solution for code evaluation in your platform.
