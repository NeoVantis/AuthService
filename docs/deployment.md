# Deployment Guide

## Production Environment Setup

### Environment Variables

Create a `.env` file or set environment variables in your deployment platform:

```bash
# Application
PORT=3000
NODE_ENV=production

# Database (replace with your production database URL)
DB_HOST=your-production-db-host
DB_PORT=5432
DB_USER=your-production-user
DB_PASSWORD=your-secure-password
DB_NAME=auth_production

# Security
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
```

### Database Setup for Production

1. **Create production database**:
   ```sql
   CREATE DATABASE auth_production;
   CREATE USER auth_app WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE auth_production TO auth_app;
   ```

2. **Important**: Set `synchronize: false` in production and use migrations:
   ```typescript
   // In app.module.ts for production
   TypeOrmModule.forRootAsync({
     useFactory: () => ({
       type: 'postgres',
       url: process.env.DATABASE_URL,
       entities: [User],
       synchronize: false, // NEVER true in production
       migrations: ['dist/migrations/*.js'],
       migrationsRun: true,
     }),
   })
   ```

## Deployment Options

### 1. Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "run", "start:prod"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=postgres
      - DB_USER=auth_user
      - DB_PASSWORD=secure_password
      - DB_NAME=auth_production
      - JWT_SECRET=your-jwt-secret
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: auth_production
      POSTGRES_USER: auth_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

Deploy with Docker:
```bash
docker-compose up -d
```

### 2. Railway Deployment

1. **Connect your repository** to Railway
2. **Set environment variables** in Railway dashboard:
   - `NODE_ENV=production`
   - `JWT_SECRET=your-secure-secret`
   - Add PostgreSQL plugin for database
3. **Deploy** automatically triggers on git push

### 3. Heroku Deployment

1. **Create Heroku app**:
   ```bash
   heroku create your-auth-service
   ```

2. **Add PostgreSQL addon**:
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

3. **Set environment variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-secure-secret
   ```

4. **Deploy**:
   ```bash
   git push heroku main
   ```

### 4. VPS/Server Deployment

1. **Install dependencies**:
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PostgreSQL
   sudo apt install postgresql postgresql-contrib
   ```

2. **Setup application**:
   ```bash
   # Clone repository
   git clone <your-repo-url>
   cd AuthService
   
   # Install dependencies
   npm ci --only=production
   
   # Build application
   npm run build
   
   # Create .env file with production values
   cp .env.example .env
   # Edit .env with production database credentials
   ```

3. **Setup PM2 for process management**:
   ```bash
   # Install PM2
   npm install -g pm2
   
   # Start application
   pm2 start dist/main.js --name "auth-service"
   
   # Save PM2 configuration
   pm2 save
   pm2 startup
   ```

4. **Setup Nginx reverse proxy**:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
   
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Security Considerations

### Environment Variables
- **Never commit** `.env` files to version control
- Use strong, random JWT secrets (minimum 32 characters)
- Use environment-specific database credentials

### Database Security
- Use SSL connections for database in production
- Regularly backup your database
- Use connection pooling for better performance

### Application Security
- Enable CORS appropriately for your frontend domain
- Add rate limiting to prevent abuse
- Use HTTPS in production (SSL/TLS certificates)
- Regular security updates for dependencies

### Health Checks

Add health check endpoint for monitoring:
```bash
# Health check
curl https://your-domain.com/health

# Expected response
{"status":"ok"}
```

## Monitoring

Consider adding:
- Application logging (Winston, Pino)
- Error tracking (Sentry)
- Performance monitoring (New Relic, DataDog)
- Database monitoring

## Backup Strategy

### Database Backups
```bash
# Create backup
pg_dump postgresql://user:pass@host:port/database > backup.sql

# Restore backup
psql postgresql://user:pass@host:port/database < backup.sql
```

### Automated Backups
Set up daily automated backups using cron jobs or cloud provider backup services.
