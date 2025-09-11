# API Backend Project

A RESTful API built with Node.js, Express, Sequelize, and MySQL.

## Features

- **Express.js** - Fast, unopinionated, minimalist web framework
- **Sequelize** - Promise-based Node.js ORM for MySQL
- **MySQL 8.0** - Relational database with Docker setup
- **CORS** - Cross-Origin Resource Sharing enabled
- **Environment Variables** - Secure configuration management
- **Error Handling** - Centralized error handling middleware
- **Request Logging** - Built-in request logging
- **Docker** - Containerized MySQL database with phpMyAdmin

## Project Structure

```
api/
├── src/
│   ├── config/
│   │   ├── database.js       # Sequelize configuration
│   │   └── sequelize.js      # Sequelize instance
│   ├── controllers/
│   │   └── userController.js # User CRUD operations
│   ├── models/
│   │   └── User.js           # User model definition
│   ├── routes/
│   │   └── userRoutes.js     # User API routes
│   ├── middleware/           # Custom middleware (future use)
│   ├── services/             # Business logic services (future use)
│   └── app.js                # Main application file
├── sql-scripts/              # SQL initialization scripts
├── .env                      # Environment variables
├── docker-compose.yml        # Docker configuration
└── package.json              # NPM dependencies and scripts
```

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- Docker and Docker Compose
- Git

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy and modify the `.env` file with your settings:

```bash
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=api_db
DB_USER=api_user
DB_PASSWORD=api_password

# JWT Configuration (optional for future authentication)
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=24h

# Other Configuration
API_PREFIX=/api/v1
```

### 3. Start Database with Docker

```bash
npm run docker:up
```

This will start:
- MySQL database on port `3306`
- phpMyAdmin on port `8080` (http://localhost:8080)

### 4. Start the API Server

For development (with auto-restart):
```bash
npm run dev
```

For production:
```bash
npm start
```

## API Endpoints

### Health Check
- `GET /health` - API health status

### Users
- `GET /api/v1/users` - Get all users (with pagination and filtering)
- `GET /api/v1/users/:id` - Get user by ID
- `POST /api/v1/users` - Create new user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

### Query Parameters for GET /api/v1/users
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `status` - Filter by status (active/inactive/suspended)
- `search` - Search in first_name, last_name, and email

## Example API Usage

### Create a User
```bash
curl -X POST http://localhost:3000/api/v1/users \\
  -H "Content-Type: application/json" \\
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "date_of_birth": "1990-01-15"
  }'
```

### Get All Users
```bash
curl http://localhost:3000/api/v1/users?page=1&limit=10
```

### Update a User
```bash
curl -X PUT http://localhost:3000/api/v1/users/1 \\
  -H "Content-Type: application/json" \\
  -d '{
    "first_name": "Jane",
    "status": "inactive"
  }'
```

## Database Management

### Using phpMyAdmin
Access phpMyAdmin at http://localhost:8080
- Server: `mysql`
- Username: `api_user`
- Password: `api_password`

### Using Docker Commands

View database logs:
```bash
npm run docker:logs
```

Stop database:
```bash
npm run docker:down
```

## Development Scripts

- `npm run dev` - Start server with nodemon (auto-restart)
- `npm start` - Start server in production mode
- `npm run docker:up` - Start MySQL container
- `npm run docker:down` - Stop MySQL container
- `npm run docker:logs` - View container logs

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment mode | development |
| PORT | Server port | 3000 |
| DB_HOST | Database host | localhost |
| DB_PORT | Database port | 3306 |
| DB_NAME | Database name | api_db |
| DB_USER | Database user | api_user |
| DB_PASSWORD | Database password | api_password |
| API_PREFIX | API route prefix | /api/v1 |

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Database Schema

### Users Table
- `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT)
- `first_name` (VARCHAR(50), NOT NULL)
- `last_name` (VARCHAR(50), NOT NULL)
- `email` (VARCHAR(100), NOT NULL, UNIQUE)
- `phone` (VARCHAR(20), NULLABLE)
- `date_of_birth` (DATE, NULLABLE)
- `status` (ENUM: 'active', 'inactive', 'suspended', DEFAULT: 'active')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the PORT in `.env` file
2. **Database connection failed**: Make sure Docker containers are running
3. **Permission denied**: Ensure Docker has proper permissions on your system

### Logs

Server logs are displayed in the console. For database logs:
```bash
docker-compose logs mysql
```

## Future Enhancements

- [ ] Authentication with JWT
- [ ] API rate limiting
- [ ] Input validation middleware
- [ ] Unit and integration tests
- [ ] API documentation with Swagger
- [ ] Database migrations and seeders
- [ ] Email service integration
- [ ] File upload functionality
- [ ] Caching with Redis

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the ISC License.
