# Local Development Setup

## Prerequisites

1. **Node.js** (v20 or higher)
2. **PostgreSQL** running locally
3. **NeoVantis Notification Service** running locally (default: http://localhost:4321)
4. **npm** or **yarn**

## Database Setup

### Option 1: Using Local PostgreSQL Installation

1. **Install PostgreSQL** (if not already installed):
   ```bash
   # macOS (using Homebrew)
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   
   # Windows
   # Download and install from https://www.postgresql.org/download/windows/
   ```

2. **Create the database**:
   ```bash
   # Connect to PostgreSQL as your user (replace 'yourusername' with your actual username)
   psql postgres
   
   # Create the auth database
   CREATE DATABASE auth;
   
   # Verify database exists
   \l
   
   # Exit psql
   \q
   ```

3. **Test connection**:
   ```bash
   # Replace 'yourusername' with your actual username
   psql postgresql://yourusername@localhost:5432/auth
   ```

### Option 2: Using Docker (Alternative)

```bash
# Run PostgreSQL in Docker
docker run --name auth-postgres \
  -e POSTGRES_DB=auth \
  -e POSTGRES_USER=yourusername \
  -e POSTGRES_HOST_AUTH_METHOD=trust \
  -p 5432:5432 \
  -d postgres:15

# Test connection (replace 'yourusername' with your actual username)
psql postgresql://yourusername@localhost:5432/auth
```

## Application Setup

1. **Clone and install dependencies**:
   ```bash
   cd AuthService
   npm install
   ```

2. **Environment configuration**:
   ```bash
   # Copy example environment file
   cp .env.example .env
   
   # Edit .env if needed (default values should work for local development)
   ```

3. **Start the application**:
   ```bash
   # Development mode with hot reload
   npm run start:dev
   
   # Or regular start
   npm start
   ```

   Note: The AuthService will refuse to start if it cannot reach the Notification Service. Ensure it is healthy at `${NOTIFICATION_SERVICE_URL:-http://localhost:4321}/api/v1/health`.

4. **Verify everything works**:
   ```bash
   # Test health endpoint (detailed)
   curl http://localhost:${PORT:-3000}/api/v1/health
   
   # Test simple health
   curl http://localhost:${PORT:-3000}/api/v1/health/simple
   
   # Test two-step registration
   # Step 1: Create account
   curl -X POST http://localhost:${PORT:-3000}/api/v1/auth/signup/step1 \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
   
   # Step 2: Complete registration (use userId from step 1 response)
   curl -X POST http://localhost:${PORT:-3000}/api/v1/auth/signup/step2/USER_ID_HERE \
     -H "Content-Type: application/json" \
     -d '{"fullName":"Test User","phoneNumber":"1234567890","college":"Test University","address":"123 Test Street"}'
   
   # Test signin
   curl -X POST http://localhost:${PORT:-3000}/api/v1/auth/signin \
     -H "Content-Type: application/json" \
     -d '{"identifier":"testuser","password":"password123"}'
   ```

## API Endpoints

### Authentication (Two-Step Registration)
- `POST /api/v1/auth/signup/step1` - Create new user account (basic info)
- `POST /api/v1/auth/signup/step2/:userId` - Complete registration (additional info)
- `POST /api/v1/auth/signin` - Authenticate with username/email and get JWT token
- `POST /api/v1/auth/verify-token` - Verify JWT token validity
- `GET /api/v1/auth/me` - Get current user profile

### Email Verification
- `POST /api/v1/auth/request-email-verification` - Request verification OTP
- `POST /api/v1/auth/verify-email` - Verify email with OTP
- `POST /api/v1/auth/resend-email-verification` - Resend OTP

### Password Reset
- `POST /api/v1/auth/forgot-password` - Request password reset (`otpId` returned in dev)
- `POST /api/v1/auth/reset-password` - Reset password using `otpId` + `code`

### Health & Monitoring
- `GET /api/v1/health` - Detailed system health (CPU, memory, database)
- `GET /api/v1/health/simple` - Simple health check

### Users (Profile Management)
- `GET /api/v1/users/find` - Find user by username or email
- `GET /api/v1/users/:id` - Get user profile by ID
- `PUT /api/v1/users/:id` - Update user profile (authenticated users only)
- `DELETE /api/v1/users/:id` - Soft delete user account (authenticated users only)

## Database Schema

The application automatically creates tables on startup (via TypeORM synchronize). The main tables are:

- **users** table with columns:
  - `id` (UUID, primary key)
  - `username` (varchar, unique, 3-50 characters)
  - `email` (varchar, unique)
  - `password_hash` (varchar)
  - `step_one_complete` (boolean, default: false)
  - `full_name` (varchar, optional)
  - `phone_number` (varchar, optional)
  - `college` (varchar, optional)
  - `address` (text, optional)
  - `step_two_complete` (boolean, default: false)
  - `is_verified` (boolean, default: false)
  - `is_active` (boolean, default: true)
  - `deleted_at` (timestamp, nullable for soft delete)
  - `password_reset_count` (integer, default: 0)
  - `last_password_reset` (timestamp, nullable)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

## Development Features

### API Versioning
All endpoints are versioned under `/api/v1/`. Future versions can be added as `/api/v2/`, etc.

### Enhanced Health Monitoring
The health endpoint provides comprehensive system metrics:
- CPU usage and load averages
- Memory usage (system and process)
- Database connection status and response time
- System information (hostname, platform, architecture)
- Application uptime and version

### Request Validation
All endpoints use class-validator for automatic request validation with helpful error messages.

### Database Logging
In development mode, all SQL queries are logged to the console for debugging.

## Development Tips

- **Database logs**: Queries are automatically logged in development
- **Hot reload**: Use `npm run start:dev` for automatic restart on file changes
- **Database reset**: Drop and recreate the `auth` database to reset all data
- **Environment variables**: All config is in `.env` file
- **TypeScript strict mode**: Project uses strict TypeScript settings
- **Code formatting**: Uses Prettier and ESLint for consistent code style

## Troubleshooting

### Connection Issues
- Ensure PostgreSQL is running: `brew services list | grep postgresql`
- Check if database exists: `psql -l | grep auth`
- Verify user access: `psql postgresql://vaidityatanwar@localhost:5432/auth`

### Port Conflicts
- Change `PORT=3000` in `.env` if port 3000 is busy
- Ensure PostgreSQL is on port 5432: `lsof -i :5432`

### Authentication Issues
- Local PostgreSQL typically uses "trust" auth for local connections
- If you need a password, update `DB_PASSWORD` in `.env`
- Ensure your username in `.env` matches your system username

### TypeScript Errors
- Run `npm run build` to check for compilation errors
- Ensure all dependencies are installed: `npm install`

### Performance Monitoring
Use the detailed health endpoint to monitor:
- Memory usage patterns
- Database response times
- CPU load during development
