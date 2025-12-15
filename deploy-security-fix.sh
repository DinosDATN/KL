#!/bin/bash

# Deploy security fix for user endpoints
echo "🔒 Deploying security fix for user endpoints..."

# Commit changes
git add api/src/routes/userRoutes.js api/src/routes/problemRoutes.js
git commit -m "🔒 Security fix: Add authentication to user and submission endpoints

- Require admin role for user management endpoints (GET /users, GET /users/:id, etc.)
- Add authentication to problem submission endpoints
- Prevent unauthorized access to user data"

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
echo "🧪 Test the fix:"
echo "curl https://api.pdkhang.online/api/v1/users"
echo "Should return 401 Unauthorized"