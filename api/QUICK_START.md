# 🚀 L-FYS API Quick Start with Docker

## One-Command Setup

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Start MySQL with automatic seeding
npm run docker:up

# 3. Install and start API
npm install && npm run dev
```

## What This Does

✅ **MySQL 8.0** running on port 3306  
✅ **phpMyAdmin** at http://localhost:8080  
✅ **Database** `lfysdb` created automatically  
✅ **All tables** created from schema  
✅ **Sample data** seeded (users, courses, problems, etc.)  
✅ **API** ready at http://localhost:3000/api/v1  

## Test the Homepage APIs

```bash
# Platform overview
curl http://localhost:3000/api/v1/homepage/overview

# Featured courses  
curl http://localhost:3000/api/v1/homepage/courses/featured

# Leaderboard (top 5)
curl http://localhost:3000/api/v1/homepage/leaderboard?limit=5

# Testimonials
curl http://localhost:3000/api/v1/homepage/testimonials
```

## Database Access

- **phpMyAdmin**: http://localhost:8080
- **Username**: api_user
- **Password**: api_password
- **Database**: lfysdb

## Reset Database (if needed)

```bash
# Stop and remove volumes
docker-compose down -v

# Start fresh (re-runs seeding)
docker-compose up -d
```

## File Structure

```
sql-scripts/
├── 01-schema.sql    # Database tables
└── 02-seed.sql     # Initial data
```

The seed data includes:
- 5 test users with stats (for leaderboard)
- 2 course categories + sample courses
- 2 document topics + sample documents  
- 2 problem categories + sample problems
- Sample achievements and testimonials

Perfect for testing your L-FYS frontend! 🎯
