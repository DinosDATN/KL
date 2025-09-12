# Problem System Testing Instructions

## Backend Setup

1. **Install Dependencies**
   ```bash
   cd api
   npm install
   ```

2. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - Update database credentials in `.env`
   - (Optional) Add Judge0 API key for real code execution:
     ```
     JUDGE0_API_KEY=your_rapidapi_key_here
     ```

3. **Database Setup**
   ```bash
   # Run database migrations
   npm run db:migrate
   
   # Seed the database with test data
   mysql -u your_user -p your_database < sql-scripts/01-schema.sql
   mysql -u your_user -p your_database < sql-scripts/03-problem-seed.sql
   ```

4. **Start Backend Server**
   ```bash
   npm run dev
   ```
   Server will run on http://localhost:3000

## Frontend Setup

1. **Install Dependencies**
   ```bash
   cd cli
   npm install
   ```

2. **Start Frontend Server**
   ```bash
   npm start
   ```
   Frontend will run on http://localhost:4200

## Testing the Problem System

### 1. Browse Problems
- Navigate to http://localhost:4200/problems
- View the list of problems with filtering and search capabilities
- The interface now uses real API data instead of mock data

### 2. Problem Detail View
- Click on any problem to view details
- Navigate to http://localhost:4200/problems/1 (or any problem ID)
- View problem description, examples, constraints, and test cases

### 3. Code Editor Features
- Select different programming languages (Python, JavaScript, Java, C++)
- View starter code for each language
- Write your solution in the code editor

### 4. Code Execution
**Option A: With Judge0 API (Real execution)**
- Requires Judge0 API key in .env
- Click "Run" to execute code with custom input
- Click "Submit" to test against all test cases

**Option B: Mock Execution (Fallback)**
- Works without Judge0 API key
- Provides simulated execution results
- Good for testing UI functionality

### 5. API Endpoints to Test

Test these endpoints directly:

```bash
# Get all problems
GET http://localhost:3000/api/v1/problems

# Get problem by ID
GET http://localhost:3000/api/v1/problems/1

# Get categories
GET http://localhost:3000/api/v1/problems/data/categories

# Get tags
GET http://localhost:3000/api/v1/problems/data/tags

# Get problem tags
GET http://localhost:3000/api/v1/problems/1/tags

# Get starter codes
GET http://localhost:3000/api/v1/problems/1/starter-codes

# Get test cases
GET http://localhost:3000/api/v1/problems/1/test-cases

# Execute code
POST http://localhost:3000/api/v1/problems/execute
Content-Type: application/json
{
  "sourceCode": "print('Hello World')",
  "language": "python",
  "input": ""
}

# Submit code
POST http://localhost:3000/api/v1/problems/1/submit
Content-Type: application/json
{
  "sourceCode": "def sum_array(arr):\n    return sum(arr)",
  "language": "python"
}
```

## Key Features Implemented

### Backend
- ✅ Complete database schema with all models
- ✅ RESTful API endpoints for all problem functionality
- ✅ Judge0 integration for real code execution
- ✅ Fallback to mock data when needed
- ✅ Proper error handling and validation

### Frontend
- ✅ Dynamic data loading from APIs
- ✅ Fallback to mock data for offline development
- ✅ Real code execution and submission
- ✅ Responsive problem browser and detail views
- ✅ Interactive code editor with syntax highlighting

### Integration
- ✅ Seamless connection between frontend and backend
- ✅ Proper error handling and user feedback
- ✅ Consistent data flow throughout the application

## Troubleshooting

1. **Database Connection Issues**
   - Check database credentials in .env
   - Ensure MySQL server is running
   - Verify database exists and is accessible

2. **API Not Working**
   - Check if backend server is running on port 3000
   - Verify CORS is properly configured
   - Check browser console for network errors

3. **Code Execution Issues**
   - Without Judge0 API key: System will fall back to mock execution
   - With Judge0 API key: Check API key validity and quotas
   - Monitor backend console for execution errors

4. **Frontend Issues**
   - Check if frontend server is running on port 4200
   - Verify API URL in environment.ts matches backend
   - Check browser console for JavaScript errors
