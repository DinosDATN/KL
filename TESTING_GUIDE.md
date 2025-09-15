# Judge0 Integration Testing Guide

This guide explains how to test the complete Judge0 integration between the Angular frontend and Node.js backend.

## Architecture Overview

The complete data flow is:
**Angular Frontend** → **Node.js Backend** → **Judge0 Docker Service** → **Node.js Backend** → **Angular Frontend**

## Prerequisites

1. Docker and Docker Compose installed
2. Node.js 18+ installed
3. Angular CLI installed

## Backend Services

### 1. Start Backend Services
```bash
cd E:\A_ProjectKLTN\Project\main\api
docker-compose up -d
```

### 2. Verify Services are Running
```bash
docker-compose ps
```

Expected output should show these services running:
- `backend_api` (port 3000)
- `judge0_api` (port 2358) 
- `judge0_postgres`
- `judge0_redis`
- `api_mysql` (port 3306)
- `api_phpmyadmin` (port 8080)

### 3. Test Backend API Endpoints

#### Test Judge0 Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/judge0/health" -Method GET
```

#### Test Code Execution
```powershell
$body = @{
    source_code = "console.log('Hello, World!');"
    language = "javascript"
    stdin = ""
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/judge0/execute" -Method POST -Body $body -ContentType "application/json"
```

#### Test Code Submission with Test Cases
```powershell
$body = @{
    source_code = "console.log(1 + 2);"
    language = "javascript"
    test_cases = @(
        @{
            input = ""
            expected_output = "3"
        }
    )
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/judge0/submit" -Method POST -Body $body -ContentType "application/json"
```

#### Test Supported Languages
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/judge0/languages" -Method GET
```

## Frontend Testing

### 1. Start Angular Development Server
```bash
cd E:\A_ProjectKLTN\Project\main\cli
npm start
```

### 2. Access the Application
Open your browser and go to: `http://localhost:4200`

### 3. Navigate to Problem Detail Page
1. Click on "Problems" in the navigation
2. Select any problem from the list
3. You should see the problem detail page with a code editor

### 4. Test Code Execution

#### Test JavaScript Execution
1. Select "JavaScript (Node.js)" from the language dropdown
2. Enter the following code:
   ```javascript
   console.log('Hello from Angular + Judge0!');
   ```
3. Click "Chạy code" (Run Code)
4. You should see the output: "Hello from Angular + Judge0!"

#### Test Python Execution
1. Select "Python 3" from the language dropdown
2. Enter the following code:
   ```python
   print('Hello from Python!')
   ```
3. Click "Chạy code" (Run Code)
4. You should see the output: "Hello from Python!"

#### Test with Custom Input
1. In the custom input section, enter: `World`
2. Use this code:
   ```python
   name = input()
   print(f'Hello, {name}!')
   ```
3. Click "Chạy code"
4. You should see: "Hello, World!"

### 5. Test Code Submission
1. Choose a problem that has test cases defined
2. Write a solution (even a simple one)
3. Click "Nộp bài" (Submit)
4. You should see submission results with:
   - Status (Accepted/Wrong Answer/etc.)
   - Score (0-100)
   - Test cases passed/total
   - Execution time and memory usage

## Expected Results

### Successful Code Execution Response
```json
{
  "success": true,
  "output": "Hello from Angular + Judge0!",
  "error": null,
  "execution_time": 123,
  "memory_used": 1024
}
```

### Successful Code Submission Response
```json
{
  "success": true,
  "submission_id": "SUB_1234567890_abcde",
  "status": "accepted",
  "score": 100,
  "execution_time": 150,
  "memory_used": 1200,
  "test_cases_passed": 3,
  "total_test_cases": 3
}
```

## Development Mode Features

### Mock Fallback
- If Judge0 service fails, the system automatically falls back to mock responses
- This ensures frontend development isn't blocked by backend issues
- Mock responses are generated with realistic execution times and outputs

### Error Handling
- Network errors are gracefully handled
- User-friendly error messages are displayed
- Loading states are shown during execution

## Supported Languages

The integration supports these programming languages:
- **Python 3** (`python`) - Language ID: 71
- **JavaScript (Node.js)** (`javascript`) - Language ID: 63
- **Java** (`java`) - Language ID: 62
- **C++** (`cpp`) - Language ID: 54
- **C** (`c`) - Language ID: 50

## Troubleshooting

### Backend Issues

1. **Services not starting**: Check Docker daemon is running
2. **Port conflicts**: Ensure ports 3000, 2358, 3306, 8080 are available
3. **Judge0 not responding**: Check `docker-compose logs judge0`

### Frontend Issues

1. **Build errors**: Run `npm run build` to check for TypeScript errors
2. **API connection issues**: Check browser network tab for HTTP errors
3. **CORS issues**: Ensure backend CORS is configured for `http://localhost:4200`

### Common Solutions

1. **Restart services**:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

2. **Check service health**:
   ```bash
   curl http://localhost:3000/api/v1/judge0/health
   ```

3. **View logs**:
   ```bash
   docker-compose logs -f judge0
   docker-compose logs -f api
   ```

## Testing Checklist

- [ ] Backend services start successfully
- [ ] Judge0 health check returns healthy status
- [ ] Code execution API works for all languages
- [ ] Code submission API works with test cases
- [ ] Frontend builds without errors
- [ ] Code editor loads and displays correctly
- [ ] Language selection works
- [ ] Code execution from frontend works
- [ ] Results display correctly with execution time and memory
- [ ] Code submission from frontend works
- [ ] Submission results display with score and test case details
- [ ] Error states are handled gracefully
- [ ] Loading states work properly

## Performance Notes

- Code execution typically takes 100-600ms
- Code submission takes 2-5 seconds (depending on test cases)
- Mock fallback adds 1-3 seconds delay to simulate real API
- Judge0 service startup can take 10-30 seconds initially

## Integration Verification

The integration is working correctly when:

1. ✅ All backend services are running
2. ✅ Frontend connects to backend successfully  
3. ✅ Code can be executed in multiple languages
4. ✅ Results are displayed with proper formatting
5. ✅ Code submissions work against test cases
6. ✅ Error handling works for invalid code
7. ✅ Mock fallback works when Judge0 is unavailable
