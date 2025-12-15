#!/bin/bash

# Deploy comprehensive security fix for API
echo "🔒 Deploying comprehensive API security fix..."

# Commit changes
git add api/src/routes/ api/src/middleware/ test-security.js
git commit -m "🔒 Comprehensive API Security Fix

- Add origin protection middleware - only allow frontend domains
- Require admin role for user management endpoints
- Add authentication to problem and course submission endpoints  
- Protect sensitive data from external requests
- Add security testing script
- Prevent unauthorized access to user and course data"

# Push to remote (adjust branch name if needed)
git push origin main

echo "✅ Code pushed to repository"
echo ""
echo "📋 Next steps on your server:"
echo "1. Pull the latest code: git pull origin main"
echo "2. Restart PM2 process: pm2 restart api-backend"
echo "3. Check PM2 status: pm2 status"
echo "4. View logs: pm2 logs api-backend"
echo ""
echo "🧪 Test the security fix:"
echo "node test-security.js"
echo ""
echo "Expected results:"
echo "- /users should return 403 Forbidden"
echo "- /courses should return 403 Forbidden" 
echo "- /admin/* should return 401 Unauthorized"