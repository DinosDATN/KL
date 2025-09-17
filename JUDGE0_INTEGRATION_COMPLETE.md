# Complete Judge0 Integration - Code Evaluation System

## Overview

This document describes the complete implementation of the Judge0 code evaluation system, including both "Run Code" and "Submit Code" functionalities with full database persistence and result tracking.

## Architecture

```
Frontend (Angular) → Backend API → Judge0 Service → Database
     ↓                    ↓              ↓           ↓
Code Editor       →  Problem API   →   Judge0    →  MySQL
User Actions      →  Auth & Session →  Evaluation →  Submissions
                  →  Data Storage   →  Test Cases  →  Results
```

## Key Components

### 1. Backend API

#### **Judge0 Service** (`/api/src/services/judgeService.js`)
- Handles communication with Judge0 Docker container
- Supports 5 programming languages (Python, JavaScript, Java, C++, C)
- Automatic fallback to mock mode when Judge0 is unavailable
- Comprehensive error handling and status mapping

#### **Problem Controller** (`/api/src/controllers/problemController.js`)
Enhanced with code execution endpoints:

**Execute Code (Run Button):**
```http
POST /api/v1/problems/execute
Content-Type: application/json

{
  "sourceCode": "console.log('Hello World');",
  "language": "javascript",
  "input": ""
}
```

**Submit Code (Submit Button):**
```http
POST /api/v1/problems/{problemId}/submit
Content-Type: application/json

{
  "sourceCode": "console.log('Hello World');",
  "language": "javascript", 
  "userId": 123
}
```

#### **Database Models**

1. **Enhanced Submissions** (`/api/src/models/Submission.js`)
   - Added `test_cases_passed`, `total_test_cases`, `error_message` fields
   - Stores comprehensive submission metadata

2. **New SubmissionTestResult** (`/api/src/models/SubmissionTestResult.js`)
   - Stores detailed results for each test case
   - Tracks input/output, execution time, memory usage per test case
   - Links to both submissions and test cases

3. **Database Schema Updates** (`/api/sql-scripts/03-update-submissions.sql`)
   - Migration script for new fields and tables
   - Proper indexing for performance

### 2. Frontend Implementation

#### **Code Editor Component** (`/cli/src/app/features/problems/problem-detail/components/code-editor/`)
- **ACE Editor Integration**: Full-featured code editor with syntax highlighting
- **Language Support**: Dynamic language loading from backend
- **User Authentication**: Requires login for submissions
- **Real-time Results**: Shows execution output and submission results

**Key Features:**
- ✅ Run Code: Execute code with custom input
- ✅ Submit Solution: Run against all test cases + save to database
- ✅ Language Selection: Dynamic loading of supported languages
- ✅ Code Templates: Starter code for each language
- ✅ Result Display: Detailed execution results and test case breakdown

#### **Problems Service** (`/cli/src/app/core/services/problems.service.ts`)
Updated methods:
```typescript
executeCode(request: {sourceCode: string, language: string, input?: string})
submitCode(problemId: number, request: {sourceCode: string, language: string, userId: number})
```

#### **New Submission Service** (`/cli/src/app/core/services/submission.service.ts`)
Complete submission management:
- Get user submissions with pagination
- Get submission details with test results
- Submission statistics and analytics
- Status formatting and display helpers

### 3. Enhanced API Endpoints

#### **New Submission Endpoints:**
- `GET /api/v1/problems/submissions/{submissionId}` - Get detailed submission with test results
- `GET /api/v1/problems/users/{userId}/submissions` - Get user's all submissions
- `GET /api/v1/problems/{problemId}/submissions` - Get submissions for a problem (enhanced with test results)

## Workflow

### Run Code Flow
1. User writes code in the editor
2. Clicks "Run Code" button
3. Frontend calls `ProblemsService.executeCode()`
4. Backend executes via Judge0 or mock service
5. Results displayed immediately (no database save)

### Submit Code Flow
1. User writes code in the editor
2. Clicks "Submit Code" button
3. **Authentication Check**: Ensures user is logged in
4. Frontend calls `ProblemsService.submitCode()` with user ID
5. Backend:
   - Fetches test cases for the problem
   - Executes code against all test cases via Judge0
   - Saves submission to `submissions` table
   - Saves detailed test results to `submission_test_results` table
6. Results displayed with full test case breakdown

## Database Schema

### Updated Submissions Table
```sql
ALTER TABLE submissions 
ADD COLUMN test_cases_passed INT DEFAULT 0,
ADD COLUMN total_test_cases INT DEFAULT 0,
ADD COLUMN error_message TEXT;
```

### New Submission Test Results Table
```sql
CREATE TABLE submission_test_results (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  submission_id BIGINT NOT NULL,
  test_case_id BIGINT NULL,
  input TEXT,
  expected_output TEXT,
  actual_output TEXT,
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  execution_time INT NULL,
  memory_used INT NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE SET NULL
);
```

## Usage Examples

### Frontend Code Editor Usage

```typescript
// In your component
@Component({...})
export class ProblemDetailComponent {
  constructor(
    private problemsService: ProblemsService,
    private authService: AuthService
  ) {}

  // Run code (no save)
  async runCode() {
    const result = await this.problemsService.executeCode({
      sourceCode: this.currentCode,
      language: this.selectedLanguage,
      input: this.customInput
    }).toPromise();
    // Display results
  }

  // Submit solution (save to database)
  async submitSolution() {
    const user = this.authService.getCurrentUser();
    const result = await this.problemsService.submitCode(this.problemId, {
      sourceCode: this.currentCode,
      language: this.selectedLanguage,
      userId: user.id
    }).toPromise();
    // Display submission results with test case breakdown
  }
}
```

### Backend API Usage

```javascript
// Execute code endpoint
app.post('/api/v1/problems/execute', async (req, res) => {
  const { sourceCode, language, input } = req.body;
  const result = await judgeService.executeCode(sourceCode, language, input);
  res.json({ success: true, data: result });
});

// Submit code endpoint (with database save)
app.post('/api/v1/problems/:id/submit', async (req, res) => {
  const { sourceCode, language, userId } = req.body;
  const testCases = await TestCase.findAll({ where: { problem_id: req.params.id } });
  const result = await judgeService.submitCode(sourceCode, language, testCases);
  
  // Save submission to database
  const submission = await Submission.create({...});
  await SubmissionTestResult.bulkCreate(testResults);
  
  res.json({ success: true, data: result });
});
```

## Configuration

### Environment Variables
```bash
# Judge0 Configuration
JUDGE0_API_URL=http://judge0:2358
JUDGE0_MOCK_MODE=false

# Database Configuration  
DB_HOST=localhost
DB_PORT=3306
DB_NAME=your_database
DB_USER=your_user
DB_PASS=your_password
```

### Docker Services
The system includes Docker Compose configuration for:
- Judge0 API server
- PostgreSQL (for Judge0)
- Redis (for Judge0)
- MySQL (for your application data)

## Testing

### Manual Testing Checklist
- [ ] Run Code with different languages
- [ ] Submit Code saves to database correctly
- [ ] User authentication enforced for submissions
- [ ] Test case results stored properly
- [ ] Submission history displays correctly
- [ ] Error handling works for various failure scenarios

### API Testing
```bash
# Test code execution
curl -X POST http://localhost:3000/api/v1/problems/execute \
  -H "Content-Type: application/json" \
  -d '{"sourceCode":"console.log(\"Hello World\");","language":"javascript","input":""}'

# Test code submission
curl -X POST http://localhost:3000/api/v1/problems/1/submit \
  -H "Content-Type: application/json" \
  -d '{"sourceCode":"console.log(\"Hello World\");","language":"javascript","userId":1}'
```

## Features Implemented ✅

### Core Functionality
- [x] **Run Code**: Execute user code with custom input
- [x] **Submit Code**: Execute against test cases + save to database
- [x] **Multi-language Support**: Python, JavaScript, Java, C++, C
- [x] **User Authentication**: Login required for submissions
- [x] **Test Case Evaluation**: Automatic comparison with expected outputs

### Database Features
- [x] **Submission Storage**: Complete submission metadata
- [x] **Test Result Details**: Per-test-case results and timing
- [x] **User Association**: Link submissions to authenticated users
- [x] **Performance Metrics**: Execution time and memory usage tracking

### Frontend Features
- [x] **ACE Code Editor**: Syntax highlighting, autocomplete
- [x] **Language Switching**: Dynamic language selection
- [x] **Real-time Results**: Immediate feedback display
- [x] **Submission History**: View past submissions and results
- [x] **Error Handling**: User-friendly error messages

### System Features
- [x] **Judge0 Integration**: Docker-based code execution
- [x] **Fallback Mode**: Mock service when Judge0 unavailable
- [x] **API Documentation**: Complete endpoint documentation
- [x] **Database Migrations**: Schema update scripts

## Next Steps (Optional Enhancements)

1. **Performance Optimization**
   - Add caching for frequently executed code
   - Implement rate limiting for submissions
   - Optimize database queries with better indexing

2. **Advanced Features**
   - Code plagiarism detection
   - Execution time/memory limits per problem
   - Custom test case creation by users
   - Real-time collaboration on solutions

3. **Analytics & Reporting**
   - User progress tracking
   - Problem difficulty analysis
   - Language preference analytics
   - Performance benchmarking

## Support & Troubleshooting

### Common Issues
1. **Judge0 Not Responding**: Check Docker containers are running
2. **Database Errors**: Ensure migration scripts have been run
3. **Authentication Failures**: Verify JWT tokens are properly configured
4. **Language Support**: Confirm Judge0 language IDs match your configuration

### Logs & Debugging
- Backend logs: Check API console output
- Judge0 logs: `docker-compose logs judge0`  
- Database logs: Check MySQL error logs
- Frontend logs: Browser developer console

---

## Summary

This implementation provides a complete, production-ready code evaluation system with:

- **Real Judge0 Integration**: Actual code execution in isolated containers
- **Complete Database Persistence**: All submissions and results stored
- **User Authentication**: Secure submission tracking
- **Comprehensive API**: RESTful endpoints for all operations
- **Modern Frontend**: Feature-rich code editor with real-time results
- **Robust Error Handling**: Fallback modes and user-friendly messages
- **Scalable Architecture**: Ready for production deployment

The system successfully handles both "Run Code" (quick testing) and "Submit Code" (full evaluation with database storage) workflows as requested.
