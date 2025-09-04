
## Local Auth Notes

This is a NestJS-based authentication service with PostgreSQL and JWT, featuring comprehensive health monitoring and API versioning.

### Quick Start

1. **Prerequisites**: Node.js 18+, PostgreSQL running locally
2. **Database**: Create database `auth` in PostgreSQL
3. **Setup**:
   ```bash
   npm install
   cp .env.example .env
   npm run start:dev
   ```
4. **Test**:
   ```bash
   # Health check (detailed system metrics)
   curl http://localhost:3001/api/v1/health
   
   # Simple health check
   curl http://localhost:3001/api/v1/health/simple
   
   # Sign up
   curl -X POST http://localhost:3001/api/v1/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   
   # Sign in
   curl -X POST http://localhost:3001/api/v1/auth/signin \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

### API Endpoints (v1)

#### Authentication
- `POST /api/v1/auth/signup` - Create new user account
- `POST /api/v1/auth/signin` - Authenticate and get JWT token

#### Health & Monitoring
- `GET /api/v1/health` - Detailed system health with CPU, memory, database metrics
- `GET /api/v1/health/simple` - Simple health check (status + timestamp)

#### Development Only
- `POST /api/v1/users` - Create user (for testing)
- `GET /api/v1/users` - List users (returns empty array)

### Features

#### 🔧 **API Versioning**
All endpoints are versioned under `/api/v1/`. Future versions can be added as `/api/v2/`, etc.

#### 📊 **Enhanced Health Monitoring**
The health endpoint provides comprehensive system metrics:
- **CPU**: Usage, load averages, core count, model
- **Memory**: System and process memory usage with percentages
- **Database**: Connection status and response times
- **System**: Hostname, platform, architecture, uptime
- **Application**: Version and runtime information

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
- Connection string: `postgresql://vaidityatanwar@localhost:5432/auth`
- UUID primary keys with timestamp tracking

### Documentation
- [Local Development Guide](./docs/local-development.md) - Detailed setup instructions
- [Deployment Guide](./docs/deployment.md) - Production deployment options

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
