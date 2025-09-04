
## NeoVantis AuthService

NestJS-based authentication service with PostgreSQL and JWT, featuring two-step signup, mandatory email verification via the NeoVantis Notification Service, password reset with OTP, and comprehensive health monitoring.

### Quick Start

1. **Prerequisites**
  - Node.js 20+
  - PostgreSQL 16+ running locally
  - NeoVantis Notification Service running (dev default: http://localhost:4321)
2. **Database**: Create database `auth` in PostgreSQL
3. **Setup**:
   ```bash
   npm install
   cp .env.example .env
  # set NOTIFICATION_SERVICE_URL in .env if different
   npm run start:dev
   ```
4. **Test**:
   ```bash
  # Health check (detailed system metrics)
  curl http://localhost:${PORT:-3000}/api/v1/health
   
   # Simple health check
  curl http://localhost:${PORT:-3000}/api/v1/health/simple
   
   # Two-step registration - Step 1
  curl -X POST http://localhost:${PORT:-3000}/api/v1/auth/signup/step1 \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
   
   # Two-step registration - Step 2 (use userId from step 1)
  curl -X POST http://localhost:${PORT:-3000}/api/v1/auth/signup/step2/USER_ID_HERE \
     -H "Content-Type: application/json" \
     -d '{"fullName":"Test User","phoneNumber":"1234567890","college":"Test University","address":"123 Test Street"}'
   
   # Sign in (with username or email)
  curl -X POST http://localhost:${PORT:-3000}/api/v1/auth/signin \
     -H "Content-Type: application/json" \
     -d '{"identifier":"testuser","password":"password123"}'
   ```

### API Endpoints (v1)

#### Authentication (Two-Step Registration)
- `POST /api/v1/auth/signup/step1` - Create new user account (basic info: username, email, password)
- `POST /api/v1/auth/signup/step2/:userId` - Complete registration (additional info: full name, phone, etc.)
- `POST /api/v1/auth/signin` - Authenticate with username or email and get JWT token
- `POST /api/v1/auth/verify-token` - Verify JWT token validity
- `GET /api/v1/auth/me` - Get current user profile (requires authentication)

#### Email Verification
- `POST /api/v1/auth/request-email-verification` - Send email verification OTP
- `POST /api/v1/auth/verify-email` - Verify email with OTP
- `POST /api/v1/auth/resend-email-verification` - Resend verification OTP

#### Password Reset
- `POST /api/v1/auth/forgot-password` - Request password reset (returns otpId in dev)
- `POST /api/v1/auth/reset-password` - Reset password using `otpId` and `code`

#### Health & Monitoring
- `GET /api/v1/health` - Detailed system health with CPU, memory, database metrics
- `GET /api/v1/health/simple` - Simple health check (status + timestamp)

#### Development Only
- `GET /api/v1/users/find` - Find user by username or email
- `GET /api/v1/users/:id` - Get user profile by ID
- `PUT /api/v1/users/:id` - Update user profile (authenticated users only)
- `DELETE /api/v1/users/:id` - Soft delete user account (authenticated users only)

### Features

#### 🔧 **Two-Step Registration + Mandatory Email Verification**
Complete user onboarding in two phases:
- **Step 1**: Basic account creation (username, email, password)
- **Step 2**: Profile completion (full name, phone, college, address)
- Users cannot sign in until both steps are completed and email is verified

#### 🔑 **Username & Email Authentication**
- Unique usernames with validation (3-30 characters, alphanumeric + underscore)
- Sign in using either username or email
- Case-insensitive authentication

#### 🔄 **Password Reset & Email Verification with OTP**
- Email-based password reset requests
- Temporary OTP codes with 10-minute expiration
- Secure password reset tracking
- Email verification uses 6-digit OTP with 15-minute expiration

#### 📊 **Enhanced Health Monitoring**
The health endpoint provides comprehensive system metrics:
- **CPU**: Usage, load averages, core count, model
- **Memory**: System and process memory usage with percentages
- **Database**: Connection status and response times
- **System**: Hostname, platform, architecture, uptime
- **Application**: Version and runtime information

#### 🔧 **API Versioning**
All endpoints are versioned under `/api/v1/`. Future versions can be added as `/api/v2/`, etc.

#### 🛡️ **Security & Validation**
- JWT-based authentication with configurable expiration
- Password hashing with bcrypt
- Input validation using class-validator
- Unique email constraint in database

#### 🚀 **Development Experience**
- Hot reload with file watching
- SQL query logging in development
- Comprehensive error handling
- TypeScript strict mode

### Database
- Uses PostgreSQL with TypeORM
- Tables auto-created on startup (development mode)
- Connection string example: `postgresql://username@localhost:5432/auth`
- UUID primary keys with timestamp tracking
- Soft delete functionality for user accounts

### Documentation
- [Local Development Guide](./docs/local-development.md) - Detailed setup instructions (Notification Service required)
- [Deployment Guide](./docs/deployment.md) - Production deployment options
- [Architecture Overview](./docs/architecture.md) - System design and two-step registration flow
- [TypeScript Issues](./docs/typescript-issues.md) - Common development issues and solutions

### Health Monitoring Example

The `/api/v1/health` endpoint returns detailed system information:

```json
{
  "status": "healthy",
  "timestamp": "2025-09-04T05:38:46.096Z",
  "version": "0.0.1",
  "uptime": 3.096085292,
  "memory": {
    "total": 8192,
    "free": 157,
    "used": 8035,
    "usagePercent": 98.09,
    "process": {
      "heapUsed": 39,
      "heapTotal": 101,
      "external": 2,
      "rss": 113
    }
  },
  "cpu": {
    "cores": 8,
    "loadAverage": [2.94, 3.43, 5.41],
    "model": "Apple M2",
    "speed": 2400
  },
  "database": {
    "status": "healthy",
    "responseTime": 1
  },
  "network": {
    "hostname": "Your-MacBook-Pro.local",
    "platform": "darwin",
    "arch": "arm64"
  }
}
```
