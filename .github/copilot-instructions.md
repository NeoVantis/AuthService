# NeoVantis AuthService

Always follow these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the instructions here.

## Repository Overview

NeoVantis AuthService is a comprehensive NestJS-based authentication microservice with PostgreSQL database, JWT authentication, and advanced features including:
- Two-step user registration with username support
- Mandatory email verification via NeoVantis Notification Service
- Password reset with OTP functionality  
- Health monitoring with detailed system metrics
- API versioning (v1)
- TypeScript with strict mode
- Comprehensive test coverage

## Working Effectively

### Prerequisites & Setup
- **Node.js**: Requires Node.js 20+ (confirmed working with v20.19.4)
- **PostgreSQL**: Requires PostgreSQL 16+ running locally
- **Environment**: Copy `.env.example` to `.env` and configure database settings
- **Notification Service**: Requires NeoVantis Notification Service (dev: http://localhost:4321). Set `NOTIFICATION_SERVICE_URL` in `.env`. The AuthService refuses to start if the Notification Service health check fails.

### Database Setup (Required Before Building/Running)
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update && sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql && sudo systemctl enable postgresql

# Create database and user
sudo -u postgres createdb auth
sudo -u postgres createuser -s $(whoami)
sudo -u postgres psql -c "ALTER USER $(whoami) PASSWORD 'testpass';"

# Update .env file with credentials
cp .env.example .env
# Edit .env: Set DB_USER=$(whoami), DB_PASSWORD=testpass, DB_NAME=auth
```

### Bootstrap and Build Process
```bash
# Install dependencies - takes 30 seconds, NEVER CANCEL
npm install  # Timeout: Set 3+ minutes

# Build application - takes 4 seconds, very fast
npm run build  # Timeout: Set 2+ minutes

# Format code (always run before committing)
npm run format  # Takes <1 second

# Lint code (always run before committing) - has some warnings but passes
npm run lint  # Takes 5 seconds, Timeout: Set 2+ minutes
```

### Running the Application

#### Development Mode (Recommended)
```bash
# Start with hot reload - starts in 3 seconds after database connection
npm run start:dev

# Application will be available at http://localhost:${PORT:-3000}
# All API endpoints are under /api/v1/ prefix
# Database tables are created automatically via TypeORM synchronize
# Startup will abort if Notification Service is unreachable.
```

#### Production Mode
```bash
# Start production server
npm run start:prod

# Note: Ensure dev server is stopped first to avoid port conflicts
```

### Testing

#### Unit Tests
```bash
# Run unit tests - takes 1 second, NEVER CANCEL
npm run test  # Timeout: Set 2+ minutes
```

#### End-to-End Tests
```bash
# Run e2e tests - takes 12 seconds, has known failing test but database setup works
npm run test:e2e  # Timeout: Set 3+ minutes
# Note: Known issue with request() function in e2e test, not related to application functionality
```

## Validation Scenarios

After making any changes, ALWAYS validate functionality by testing these complete user scenarios:

### 1. Health Check Validation
```bash
# Test simple health check
curl http://localhost:3000/api/v1/health/simple
# Expected: {"status":"ok","timestamp":"..."}

# Test detailed health with system metrics
curl http://localhost:3000/api/v1/health
# Expected: JSON with status, memory, CPU, database metrics
```

### 2. Complete Authentication Flow (with Email Verification)
```bash
# Step 1: Initial signup
curl -X POST http://localhost:3000/api/v1/auth/signup/step1 \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
# Expected: {"userId":"...","message":"Step 1 completed..."}

# Step 2: Complete registration (use userId from step 1). This triggers an email verification OTP
curl -X POST http://localhost:3000/api/v1/auth/signup/step2/USER_ID_HERE \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","phoneNumber":"1234567890","college":"Test University","address":"123 Test Street"}'
# Expected: JWT token and complete user object

# Step 3: Verify email (required)
curl -X POST http://localhost:3000/api/v1/auth/request-email-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

curl -X POST http://localhost:3000/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"otpId":"OTP_ID","code":"123456"}'

# Step 4: Sign in with username or email
curl -X POST http://localhost:3000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"identifier":"testuser","password":"password123"}'
# Expected: JWT token and user object

# Step 4: Access protected endpoint
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer TOKEN_HERE"
# Expected: User profile information
```

### 3. Password Reset Flow (via Notification Service)
```bash
# Request password reset (returns otpId in dev)
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
# Expected: Temporary code (in production, sent via email)

# Reset password using otpId + code
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"otpId":"OTP_ID","code":"123456","newPassword":"newpassword123"}'
# Expected: Success message

# Verify new password works
curl -X POST http://localhost:3000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test@example.com","password":"newpassword123"}'
# Expected: Successful login with new password
```

## Key Repository Locations

### Source Code Structure
- **`src/auth/`** - Authentication module (signup, signin, password reset, JWT)
- **`src/users/`** - User management module (CRUD operations, profiles)  
- **`src/health/`** - Health monitoring with system metrics
- **`src/main.ts`** - Application entry point and configuration
- **Notification Integration**: `src/notification/notification.service.ts` (client), `NOTIFICATION_SERVICE_URL` in env
- **`src/app.module.ts`** - Main application module with database configuration

### Configuration Files
- **`.env`** - Environment variables (database, JWT secret, port)
- **`package.json`** - Dependencies and scripts
- **`nest-cli.json`** - NestJS CLI configuration
- **`tsconfig.json`** - TypeScript configuration (strict mode enabled)
- **`eslint.config.mjs`** - ESLint configuration
- **`.prettierrc`** - Prettier formatting rules

### Documentation
- **`README.md`** - Quick start guide and API overview
- **`API_DOCUMENTATION.md`** - Comprehensive API documentation with examples
- **`docs/local-development.md`** - Detailed setup instructions
- **`docs/deployment.md`** - Production deployment guide

### Tests
- **`test/`** - End-to-end tests using Jest and Supertest
- **`src/**/*.spec.ts`** - Unit tests alongside source files

## Common Issues and Solutions

### Database Connection Issues
- **Problem**: "client password must be a string" error
- **Solution**: Ensure `.env` has `DB_PASSWORD=testpass` (not empty string)
- **Validation**: Test with `PGPASSWORD=testpass psql -h localhost -U $(whoami) -d auth -c "SELECT 1"`

### Notification Service Not Running
- **Problem**: AuthService refuses to start, logs indicate Notification Service health check failed
- **Solution**: Start Notification Service locally (`http://localhost:4321`) or set `NOTIFICATION_SERVICE_URL` to a reachable instance
- **Validation**: `curl http://localhost:4321/api/v1/health`

### Port Conflicts
- **Problem**: "EADDRINUSE: address already in use :::3000"
- **Solution**: Stop existing dev server before starting production mode
- **Alternative**: Change `PORT=3001` in `.env`

### TypeScript/Linting Warnings
- **Expected**: Some TypeScript warnings exist in auth service (unsafe assignments, unused variables)
- **Action**: Run `npm run lint` to see current warnings, `npm run format` before committing
- **Note**: Warnings do not prevent application functionality

## Development Workflow

### Making Changes
1. **Always** start with `npm run start:dev` for hot reload
2. **Always** validate changes using the complete authentication flow scenarios above  
3. **Always** run `npm run format` and `npm run lint` before committing
4. **Always** test at least one complete user scenario after any auth-related changes

### Database Changes
- Tables are auto-created via TypeORM synchronize in development
- Check `src/users/user.entity.ts` for current schema
- Database logging is enabled in development mode

### API Changes
- All endpoints use `/api/v1/` prefix for versioning
- Authentication uses JWT Bearer tokens  
- Comprehensive request/response examples in `API_DOCUMENTATION.md`
- Health endpoints provide system monitoring for production

## Production Considerations

### Security Notes
- Change `JWT_SECRET` in production environment
- Remove `/auth/dev/active-otps` endpoint in production
- Use proper email service instead of temporary OTP implementation
- Set `synchronize: false` and use migrations in production

### Performance
- Health endpoint provides CPU, memory, and database metrics
- Application starts in ~3 seconds with database connection
- Built application is very lightweight (4-second build time)

## Dependencies
- **Framework**: NestJS 11.0+ with Express
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with bcryptjs password hashing
- **Validation**: class-validator and class-transformer
- **Testing**: Jest for unit and e2e tests
- **Code Quality**: ESLint and Prettier