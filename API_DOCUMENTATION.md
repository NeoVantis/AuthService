# NeoVantis Auth Service API Documentation

## Overview

This is a comprehensive authentication service built with NestJS, TypeORM, and PostgreSQL. It provides advanced user management features including two-step registration, username support, token verification, profile management, soft delete, and password reset with OTP functionality.

## Base URL

```
http://localhost:${PORT:-3000}/api/v1
```

## Authentication

The API uses JWT Bearer tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### Health Monitoring

#### GET /health
Get comprehensive health status of the application and system.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-04T05:59:15.789Z",
  "version": "0.0.1",
  "uptime": 30.93674575,
  "memory": {
    "total": 8192,
    "free": 70,
    "used": 8122,
    "usagePercent": 99.14,
    "process": {
      "heapUsed": 40,
      "heapTotal": 102,
      "external": 2,
      "rss": 113
    }
  },
  "cpu": {
    "cores": 8,
    "loadAverage": [2.78, 2.9, 3.41],
    "model": "Apple M2",
    "speed": 2400
  },
  "database": {
    "status": "healthy",
    "responseTime": 14
  },
  "network": {
    "hostname": "Vaidityas-MacBook-Pro.local",
    "platform": "darwin",
    "arch": "arm64"
  }
}
```

#### GET /health/simple
Get simplified health check.

**Response:**
```json
{
  "status": "ok"
}
```

### Authentication

#### POST /auth/signup/step1
Create a new user account (Step 1 - Basic Information).

**Request Body:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

**Validation Rules:**
- username: 3-30 characters, letters, numbers, and underscores only
- email: Valid email format
- password: Minimum 6 characters

**Response:**
```json
{
  "userId": "3b22c41c-ca00-4fdd-9181-e004ec8da314",
  "message": "Step 1 completed. Please complete step 2 to finish registration."
}
```

#### POST /auth/signup/step2/:userId
Complete user registration (Step 2 - Additional Information).

**URL Parameters:**
- userId: The user ID from step 1

**Request Body:**
```json
{
  "fullName": "Test User",
  "phoneNumber": "1234567890",
  "college": "Test University",
  "address": "123 Test Street"
}
```

**Validation Rules:**
- fullName: 2-255 characters
- phoneNumber: Optional, 10-20 characters
- college: Optional, maximum 255 characters
- address: Optional, text field

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "3b22c41c-ca00-4fdd-9181-e004ec8da314",
    "username": "testuser",
    "email": "test@example.com",
    "stepOneComplete": true,
    "fullName": "Test User",
    "phoneNumber": "1234567890",
    "college": "Test University",
    "address": "123 Test Street",
    "stepTwoComplete": true,
    "isVerified": false,
    "isActive": true,
    "passwordResetCount": 0,
    "lastPasswordReset": null,
    "createdAt": "2025-09-04T05:59:45.498Z",
    "updatedAt": "2025-09-04T05:59:56.913Z"
  },
  "verificationOtpId": "otp_...",
  "message": "Registration completed! Please check your email to verify your account before signing in."
}
#### Email Verification

##### POST /auth/request-email-verification
Send verification OTP to user's email.

Request:
```json
{ "email": "test@example.com" }
```

Response:
```json
{ "otpId": "otp_...", "message": "Verification code sent to your email" }
```

##### POST /auth/verify-email
Verify email using OTP.

Request:
```json
{ "otpId": "otp_...", "code": "123456" }
```

Response:
```json
{ "message": "Email verified successfully" }
```

##### POST /auth/resend-email-verification
Resend verification OTP by otpId.

Request:
```json
{ "otpId": "otp_..." }
```

Response:
```json
{ "message": "New verification code sent to your email" }
```
```

#### POST /auth/signin
Sign in with username or email.

**Request Body:**
```json
{
  "identifier": "testuser",  // Can be username or email
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "3b22c41c-ca00-4fdd-9181-e004ec8da314",
    "username": "testuser",
    "email": "test@example.com",
    "stepOneComplete": true,
    "fullName": "Test User",
    "phoneNumber": "1234567890",
    "college": "Test University",
    "address": "123 Test Street",
    "stepTwoComplete": true,
    "isVerified": true,
    "isActive": true,
    "passwordResetCount": 1,
    "lastPasswordReset": "2025-09-04T06:02:09.953Z",
    "createdAt": "2025-09-04T05:59:45.498Z",
    "updatedAt": "2025-09-04T06:02:09.953Z"
  }
}
```

#### POST /auth/verify-token
Verify if a JWT token is valid.

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Valid Token):**
```json
{
  "valid": true,
  "user": {
    "id": "3b22c41c-ca00-4fdd-9181-e004ec8da314",
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

**Response (Invalid Token):**
```json
{
  "valid": false,
  "message": "Invalid token"
}
```

#### GET /auth/me
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Response:**
```json
{
  "user": {
    "id": "3b22c41c-ca00-4fdd-9181-e004ec8da314",
    "username": "testuser",
    "email": "test@example.com",
    "fullName": "Test User",
    "phoneNumber": "1234567890",
    "college": "Test University",
    "address": "123 Test Street",
    "stepOneComplete": true,
    "stepTwoComplete": true,
    "isVerified": true,
    "isActive": true,
    "createdAt": "2025-09-04T05:59:45.498Z",
    "updatedAt": "2025-09-04T05:59:56.913Z"
  }
}
```

### Password Reset

#### POST /auth/forgot-password
Request a password reset code.

**Request Body:**
```json
{
  "email": "test@example.com"
}
```

**Response (dev):**
```json
{
  "otpId": "otp_1756965667391_o1mqv0vzx",
  "message": "Reset code sent to your email."
}
```

#### POST /auth/reset-password
Reset password using the OTP code.

**Request Body:**
```json
{
  "otpId": "otp_1756965667391_o1mqv0vzx",
  "code": "123456",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "message": "Password reset successfully"
}
```

#### GET /auth/dev/active-otps
Get active OTP codes (development/testing only - remove in production).

**Response:**
```json
[
  {
    "id": "temp_1756965667391_o1mqv0vzx",
    "email": "test@example.com",
    "code": "326075",
    "expiresAt": "2025-09-04T06:11:07.391Z"
  }
]
```

### User Management

#### GET /users/find
Find a user by username or email.

**Query Parameters:**
- username: Find by username
- email: Find by email

**Example:**
```
GET /users/find?username=testuser
GET /users/find?email=test@example.com
```

**Response:**
```json
{
  "user": {
    "id": "3b22c41c-ca00-4fdd-9181-e004ec8da314",
    "username": "testuser",
    "email": "test@example.com",
    "fullName": "Test User",
    "phoneNumber": "1234567890",
    "college": "Test University",
    "address": "123 Test Street",
    "stepOneComplete": true,
    "stepTwoComplete": true,
    "isVerified": true,
    "isActive": true,
    "createdAt": "2025-09-04T05:59:45.498Z",
    "updatedAt": "2025-09-04T05:59:56.913Z"
  }
}
```

#### GET /users/:id
Get user profile by ID.

**Response:**
```json
{
  "user": {
    "id": "3b22c41c-ca00-4fdd-9181-e004ec8da314",
    "username": "testuser",
    "email": "test@example.com",
    "fullName": "Test User",
    "phoneNumber": "1234567890",
    "college": "Test University",
    "address": "123 Test Street",
    "stepOneComplete": true,
    "stepTwoComplete": true,
    "isVerified": true,
    "isActive": true,
    "createdAt": "2025-09-04T05:59:45.498Z",
    "updatedAt": "2025-09-04T05:59:56.913Z"
  }
}
```

#### PUT /users/:id
Update user profile (requires authentication - users can only update their own profile).

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Request Body:**
```json
{
  "fullName": "Updated Name",
  "phoneNumber": "9876543210",
  "college": "Updated University",
  "address": "456 Updated Street"
}
```

**Response:**
```json
{
  "user": {
    "id": "3b22c41c-ca00-4fdd-9181-e004ec8da314",
    "username": "testuser",
    "email": "test@example.com",
    "fullName": "Updated Name",
    "phoneNumber": "9876543210",
    "college": "Updated University",
    "address": "456 Updated Street",
    "stepOneComplete": true,
    "stepTwoComplete": true,
    "isVerified": true,
    "isActive": true,
    "createdAt": "2025-09-04T05:59:45.498Z",
    "updatedAt": "2025-09-04T06:10:00.000Z"
  }
}
```

#### DELETE /users/:id
Soft delete user account (requires authentication - users can only delete their own account).

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Response:**
```json
{
  "message": "User account deactivated successfully"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "message": [
    "Username can only contain letters, numbers, and underscores",
    "username must be longer than or equal to 3 characters",
    "username must be a string"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

### 401 Unauthorized
```json
{
  "message": "Invalid token",
  "error": "Unauthorized",
  "statusCode": 401
}
```

### 404 Not Found
```json
{
  "message": "User not found",
  "error": "Not Found",
  "statusCode": 404
}
```

### 409 Conflict
```json
{
  "message": "Username already exists",
  "error": "Conflict",
  "statusCode": 409
}
```

## Features

### Two-Step Registration
- **Step 1**: Basic information (username, email, password)
- **Step 2**: Additional information (full name, phone, college, address)
- Users cannot sign in until both steps are completed

### Username Support
- Unique usernames with validation (3-30 characters, alphanumeric + underscore)
- Sign in with either username or email

### Token Verification
- JWT tokens with 1-hour expiration
- Token verification endpoint for other services

### User Profile Management
- View user profiles (public information)
- Update own profile (authenticated users only)
- Soft delete accounts (sets deletedAt timestamp)

### Password Reset with OTP
- Request password reset via email
- Temporary OTP service with 10-minute expiration
- Maximum 3 reset attempts per OTP
- Password reset tracking (count and timestamp)

### Security Features
- Password hashing with bcryptjs
- JWT token authentication
- Input validation and sanitization
- Unique constraints on email and username
- Soft delete instead of hard delete

### Health Monitoring
- Comprehensive system health checks
- Memory, CPU, and database monitoring
- Simple health check for load balancers

## Database Schema

### User Entity
```typescript
{
  id: string (UUID, Primary Key)
  username: string (Unique, 3-50 characters)
  email: string (Unique)
  passwordHash: string
  stepOneComplete: boolean (default: false)
  fullName: string (optional, 2-255 characters)
  phoneNumber: string (optional, 10-20 characters)
  college: string (optional, max 255 characters)
  address: string (optional, text)
  stepTwoComplete: boolean (default: false)
  isVerified: boolean (default: false)
  isActive: boolean (default: true)
  deletedAt: Date (nullable, for soft delete)
  passwordResetCount: number (default: 0)
  lastPasswordReset: Date (nullable)
  createdAt: Date
  updatedAt: Date
}
```

## Environment Configuration

Required environment variables:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=yourusername
DB_PASSWORD=
DB_DATABASE=auth
JWT_SECRET=dev_secret
PORT=3000
```

## Testing Examples

### Complete Registration Flow
```bash
# Step 1: Create account
curl -X POST http://localhost:3000/api/v1/auth/signup/step1 \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com", "password": "password123"}'

# Step 2: Complete registration (use userId from step 1)
curl -X POST http://localhost:3000/api/v1/auth/signup/step2/USER_ID_HERE \
  -H "Content-Type: application/json" \
  -d '{"fullName": "Test User", "phoneNumber": "1234567890", "college": "Test University", "address": "123 Test Street"}'

# Sign in
curl -X POST http://localhost:3000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"identifier": "testuser", "password": "password123"}'
```

### Password Reset Flow
```bash
# Request reset code
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Check active OTPs (development only)
curl -X GET http://localhost:3000/api/v1/auth/dev/active-otps

# Reset password
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"tempCode": "TEMP_CODE_HERE", "newPassword": "newpassword123"}'
```

## Notes

1. **Temporary OTP Service**: The current OTP implementation is temporary and stores codes in memory. In production, integrate with a proper email service like SendGrid, AWS SES, or similar.

2. **Security Considerations**: 
   - Change JWT_SECRET in production
   - Remove the /auth/dev/active-otps endpoint in production
   - Implement rate limiting for sensitive endpoints
   - Add CORS configuration for production

3. **Database**: The application uses TypeORM with synchronize mode for development. In production, use proper database migrations.

4. **Monitoring**: The health endpoints provide comprehensive system monitoring that can be integrated with monitoring tools like Prometheus, DataDog, etc.
