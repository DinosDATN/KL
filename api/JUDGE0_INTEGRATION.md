# Judge0 Integration Documentation

This document describes how Judge0 code execution service has been integrated into the project.

## Architecture

The integration follows this flow:
**Angular Frontend** → **NodeJS Backend** → **Judge0 Service** → **NodeJS Backend** → **Angular Frontend**

## Services Added

### 1. Docker Compose Services
- `judge0`: Main Judge0 API server (port 2358)
- `judge0-postgres`: PostgreSQL database for Judge0
- `judge0-redis`: Redis cache for Judge0
- `api`: NodeJS backend API (port 3000)

### 2. Backend API Endpoints

All endpoints are prefixed with `/api/v1/judge0`:

#### Execute Code (Quick Run)
```
POST /api/v1/judge0/execute
Content-Type: application/json

{
  "source_code": "console.log('Hello, World!');",
  "language": "javascript",
  "stdin": ""
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "output": "Hello, World!",
    "error": null,
    "status": "completed",
    "execution_time": 123,
    "memory_used": 456
  }
}
```

#### Submit Code (With Test Cases)
```
POST /api/v1/judge0/submit
Content-Type: application/json

{
  "source_code": "console.log(1 + 2);",
  "language": "javascript",
  "test_cases": [
    {
      "input": "",
      "expected_output": "3"
    },
    {
      "input": "",
      "expected_output": "4"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "submission_id": "SUB_1757944447511_rbazg",
    "status": "wrong",
    "score": 50,
    "execution_time": 123,
    "memory_used": 456,
    "test_cases_passed": 1,
    "total_test_cases": 2,
    "test_results": [
      {
        "input": "",
        "expectedOutput": "3",
        "actualOutput": "3",
        "passed": true,
        "executionTime": 123,
        "error": null
      }
    ]
  }
}
```

#### Get Supported Languages
```
GET /api/v1/judge0/languages
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "python",
      "name": "Python 3",
      "judgeId": 71
    },
    {
      "id": "javascript", 
      "name": "JavaScript (Node.js)",
      "judgeId": 63
    }
  ]
}
```

#### Health Check
```
GET /api/v1/judge0/health
```

**Response:**
```json
{
  "success": true,
  "message": "Judge0 service is healthy",
  "data": {
    "judge0_available": true,
    "test_execution_time": 123,
    "last_check": "2025-09-15T13:54:21.544Z"
  }
}
```

## Supported Languages

- **Python** (language: "python", judgeId: 71)
- **JavaScript** (language: "javascript", judgeId: 63) 
- **Java** (language: "java", judgeId: 62)
- **C++** (language: "cpp", judgeId: 54)
- **C** (language: "c", judgeId: 50)

## Development Mode

In development mode, the service automatically falls back to mock responses when Judge0 is unavailable. This ensures your frontend development isn't blocked by Judge0 setup issues.

To enable mock mode explicitly:
```bash
export JUDGE0_MOCK_MODE=true
```

## Running the Services

1. Start all services:
```bash
cd api
docker-compose up -d
```

2. Check service status:
```bash
docker-compose ps
```

3. View logs:
```bash
docker-compose logs judge0
docker-compose logs api
```

## Frontend Integration Examples

### Execute Code
```typescript
// Angular service method example
async executeCode(sourceCode: string, language: string, stdin: string = '') {
  const response = await this.http.post('/api/v1/judge0/execute', {
    source_code: sourceCode,
    language: language,
    stdin: stdin
  }).toPromise();
  
  return response.data;
}
```

### Submit with Test Cases
```typescript
async submitCode(sourceCode: string, language: string, testCases: any[]) {
  const response = await this.http.post('/api/v1/judge0/submit', {
    source_code: sourceCode,
    language: language,
    test_cases: testCases
  }).toPromise();
  
  return response.data;
}
```

## Security Notes

- The backend acts as a proxy, preventing direct access to Judge0 from the frontend
- All requests are validated and sanitized
- Rate limiting can be added at the backend level
- Judge0 runs in an isolated Docker container with resource limits

## Troubleshooting

1. **Judge0 not responding**: Check docker logs and ensure all containers are running
2. **Internal Error from Judge0**: The service falls back to mock mode automatically
3. **Port conflicts**: Ensure ports 2358 (Judge0) and 3000 (API) are available

## Production Notes

For production deployment:
1. Configure proper resource limits in docker-compose
2. Set up monitoring for Judge0 service health
3. Configure proper authentication and rate limiting
4. Use production-ready database and Redis instances
5. Set `JUDGE0_MOCK_MODE=false` to disable fallback mode
