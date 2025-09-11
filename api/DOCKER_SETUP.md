# Docker Setup Guide for L-FYS API

This guide will help you set up the L-FYS API with Docker, including automatic database seeding.

## Prerequisites

- Docker and Docker Compose installed on your system
- Port 3306 (MySQL) and 8080 (phpMyAdmin) available

## Quick Start

1. **Copy environment configuration:**
   ```bash
   cp .env.example .env
   ```

2. **Start the Docker containers:**
   ```bash
   npm run docker:up
   ```
   Or manually:
   ```bash
   docker-compose up -d
   ```

3. **Verify the setup:**
   - MySQL will be available at `localhost:3306`
   - phpMyAdmin will be available at `http://localhost:8080`
   - Database `lfysdb` will be created automatically
   - All tables will be created from `sql-scripts/01-schema.sql`
   - Initial data will be seeded from `sql-scripts/02-seed.sql`

4. **Start the API server:**
   ```bash
   npm install
   npm run dev
   ```
   The API will be available at `http://localhost:3000/api/v1`

## Container Details

### MySQL Container
- **Image**: mysql:8.0
- **Container Name**: api_mysql
- **Port**: 3306
- **Database**: lfysdb
- **Username**: api_user
- **Password**: api_password
- **Root Password**: rootpassword

### phpMyAdmin Container
- **Image**: phpmyadmin/phpmyadmin:latest
- **Container Name**: api_phpmyadmin
- **Port**: 8080
- **Access**: http://localhost:8080

## Database Initialization

The MySQL container uses Docker's `/docker-entrypoint-initdb.d/` feature to automatically execute SQL files on first startup:

1. **01-schema.sql**: Creates all database tables and indexes
2. **02-seed.sql**: Inserts initial seed data for testing

### Seed Data Includes:
- 5 test users (creators and learners)
- User statistics for leaderboard
- 2 course categories
- 2 sample courses
- 2 document topics
- 2 sample documents
- 2 problem categories
- 2 sample problems
- 2 achievements
- 2 testimonials

## Useful Docker Commands

```bash
# Start containers
npm run docker:up
docker-compose up -d

# Stop containers
npm run docker:down
docker-compose down

# View logs
npm run docker:logs
docker-compose logs -f

# Restart containers (useful for re-seeding)
docker-compose down
docker-compose up -d

# Connect to MySQL directly
docker exec -it api_mysql mysql -u api_user -p lfysdb

# View container status
docker-compose ps
```

## Environment Variables

The `.env` file should contain:
```env
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

DB_NAME=lfysdb
DB_USER=api_user
DB_PASSWORD=api_password
DB_HOST=localhost
DB_PORT=3306
```

## Testing the Setup

Once everything is running, you can test the homepage API endpoints:

```bash
# Overview statistics
curl http://localhost:3000/api/v1/homepage/overview

# Featured courses
curl http://localhost:3000/api/v1/homepage/courses/featured

# Leaderboard
curl http://localhost:3000/api/v1/homepage/leaderboard?limit=5

# All users
curl http://localhost:3000/api/v1/users
```

## Troubleshooting

### Database Connection Issues
- Ensure MySQL container is running: `docker ps`
- Check container logs: `docker-compose logs mysql`
- Verify environment variables in `.env`

### Seeding Issues
- Delete MySQL volume to reset: `docker-compose down -v`
- Check SQL script syntax in `sql-scripts/`
- Ensure files are saved with UTF-8 encoding

### Port Conflicts
- Change ports in `docker-compose.yml` if 3306 or 8080 are in use
- Update DB_PORT in `.env` accordingly

## Resetting the Database

To completely reset and re-seed the database:

```bash
# Stop containers and remove volumes
docker-compose down -v

# Start containers (will re-run initialization scripts)
docker-compose up -d
```

## Production Notes

For production deployment:
- Change default passwords in `docker-compose.yml`
- Use Docker secrets for sensitive data
- Set up proper backup strategy for `mysql_data` volume
- Configure network security and firewall rules
