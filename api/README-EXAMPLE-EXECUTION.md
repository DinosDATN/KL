# Example Execution Feature

This document explains the new "Run with Example" functionality that has been added to the Judge0 integration.

## Overview

The new feature allows users to run their code against all examples associated with a problem, providing a LeetCode-style interface with tabbed results showing the outcome for each example.

## Backend Implementation

### New API Endpoint

```
POST /api/problems/:id/execute-examples
```

**Request Body:**
```json
{
  "sourceCode": "def solution():\n    # Your code here\n    pass",
  "language": "python"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "exampleId": 1,
        "input": "2 3",
        "expectedOutput": "5",
        "actualOutput": "5",
        "passed": true,
        "executionTime": 120,
        "memoryUsed": 1024,
        "error": null,
        "explanation": "Simple addition: 2 + 3 = 5"
      }
    ],
    "overallStatus": "success",
    "passedCount": 1,
    "totalCount": 1,
    "averageExecutionTime": 120,
    "maxMemoryUsed": 1024
  }
}
```

### Components Modified

1. **judgeService.js** - Added `executeCodeWithExamples()` method
2. **problemController.js** - Added `executeCodeWithExamples()` endpoint
3. **problemRoutes.js** - Added route with middleware protection

### Middleware Applied

- Rate limiting (5 requests per minute)
- Security headers
- Source code validation
- Operation logging
- Output sanitization

## Frontend Implementation

### Service Updates

- **problems.service.ts** - Added `executeCodeWithExamples()` method that calls the new backend endpoint with fallback to client-side execution

### Component Updates

- **code-editor.component.ts** - Replaced "Run with Testcase" with "Run with Example" functionality
- **code-editor.component.html** - Added LeetCode-style tabbed results interface

### New Interfaces

```typescript
interface ExampleResult {
  exampleId: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  executionTime: number;
  memoryUsed: number;
  error?: string | null;
  explanation?: string | null;
}

interface BatchExampleResult {
  results: ExampleResult[];
  overallStatus: 'success' | 'partial' | 'failure';
  passedCount: number;
  totalCount: number;
  averageExecutionTime: number;
  maxMemoryUsed: number;
}
```

## Testing

### 1. Setup Test Data

First, create sample examples in your database:

```bash
cd /path/to/your/api
node create-sample-examples.js
```

This will create 3 sample examples for problem ID 1.

### 2. Test the API

Run the test script to validate the endpoint:

```bash
cd /path/to/your/api
node test-example-execution.js
```

This will:
- Check if examples exist for the problem
- Test Python code execution
- Test JavaScript code execution
- Display detailed results

### 3. Manual Testing

You can also test manually using curl:

```bash
curl -X POST http://localhost:3000/api/problems/1/execute-examples \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCode": "numbers = input().split()\na, b = int(numbers[0]), int(numbers[1])\nprint(a + b)",
    "language": "python"
  }'
```

## Error Handling

The system includes comprehensive error handling:

### Backend Errors
- Missing source code or language
- No examples found for problem
- Judge0 API failures
- Database connection issues

### Frontend Fallback
- If the backend endpoint fails, the frontend falls back to client-side execution
- Graceful degradation maintains functionality

## Performance

- **Parallel Execution**: Examples are executed sequentially but efficiently
- **Rate Limiting**: Prevents API abuse with 5 requests per minute limit
- **Timeout Protection**: 30-second timeout on API calls
- **Memory Management**: Efficient result aggregation

## Supported Languages

All Judge0 supported languages:
- Python (3.8.1)
- JavaScript (Node.js 12.14.0)
- Java (OpenJDK 13.0.1)
- C++ (GCC 9.2.0)
- C (GCC 9.2.0)
- C# (Mono 6.6.0.161)
- Go (1.13.5)
- Rust (1.40.0)
- PHP (7.4.1)
- Ruby (2.7.0)
- Kotlin (1.3.70)
- Swift (5.2.3)
- TypeScript (3.7.4)

## Configuration

### Environment Variables

Make sure these are set in your `.env` file:

```env
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_HOST=judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your_rapidapi_key_here
JUDGE0_MAX_WAIT_TIME=30000
JUDGE0_TIMEOUT=15
JUDGE0_MEMORY_LIMIT=128000
```

## Security Considerations

- **Input Validation**: All source code is validated and sanitized
- **Rate Limiting**: Prevents abuse of the Judge0 API
- **Output Sanitization**: Prevents XSS attacks in results
- **Error Masking**: Internal errors are not exposed to clients

## Troubleshooting

### Common Issues

1. **"No examples found for this problem"**
   - Ensure examples exist in the `problem_examples` table
   - Run the sample data creation script

2. **Judge0 API errors**
   - Check your API key and quota
   - Verify the Judge0 service is running
   - Check network connectivity

3. **Rate limiting errors**
   - Wait for the rate limit window to reset
   - Consider adjusting the rate limit if needed

### Debugging

Enable detailed logging by setting:
```env
NODE_ENV=development
```

This will show additional console logs for debugging.

## Future Enhancements

Potential improvements:
- Parallel execution of examples for better performance
- Cached results for identical code submissions
- Real-time progress updates via WebSocket
- Enhanced error reporting and suggestions
- Support for custom input/output formatters
