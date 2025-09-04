# Local Development Setup

## Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** running locally
3. **npm** or **yarn**

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
   # Connect to PostgreSQL as your user
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
   psql postgresql://vaidityatanwar@localhost:5432/auth
   ```

### Option 2: Using Docker (Alternative)

```bash
# Run PostgreSQL in Docker
docker run --name auth-postgres \
  -e POSTGRES_DB=auth \
  -e POSTGRES_USER=vaidityatanwar \
  -e POSTGRES_HOST_AUTH_METHOD=trust \
  -p 5432:5432 \
  -d postgres:15

# Test connection
psql postgresql://vaidityatanwar@localhost:5432/auth
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

4. **Verify everything works**:
   ```bash
   # Test health endpoint (detailed)
   curl http://localhost:3001/api/v1/health
   
   # Test simple health
   curl http://localhost:3001/api/v1/health/simple
   
   # Test signup
   curl -X POST http://localhost:3001/api/v1/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   
   # Test signin
   curl -X POST http://localhost:3001/api/v1/auth/signin \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

## API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - Create new user account
- `POST /api/v1/auth/signin` - Authenticate and get JWT token

### Health & Monitoring
- `GET /api/v1/health` - Detailed system health (CPU, memory, database)
- `GET /api/v1/health/simple` - Simple health check

### Users (Development only)
- `POST /api/v1/users` - Create user (for testing)
- `GET /api/v1/users` - List users (returns empty array)

## Database Schema

The application automatically creates tables on startup (via TypeORM synchronize). The main table is:

- **users** table with columns:
  - `id` (UUID, primary key)
  - `email` (varchar, unique)
  - `password_hash` (varchar)
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
- Change `PORT=3001` in `.env` if port 3001 is busy
- Ensure PostgreSQL is on port 5432: `lsof -i :5432`

### Authentication Issues
- Local PostgreSQL typically uses "trust" auth for local connections
- If you need a password, update `DB_PASSWORD` in `.env`

### TypeScript Errors
- Run `npm run build` to check for compilation errors
- Ensure all dependencies are installed: `npm install`

### Performance Monitoring
Use the detailed health endpoint to monitor:
- Memory usage patterns
- Database response times
- CPU load during development
