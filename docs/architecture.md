# Architecture Overview

## System Design

This NestJS-based authentication service follows a modular architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Controllers   │    │    Services     │    │   Entities      │
│                 │    │                 │    │                 │
│ • AuthController│───▶│ • AuthService   │───▶│ • User Entity   │
│ • UsersController│    │ • UsersService  │    │                 │
│ • HealthController│   │ • HealthService │    └─────────────────┘
└─────────────────┘    │ • TempOtpService│             │
                       └─────────────────┘             ▼
                                                ┌─────────────────┐
                                                │   PostgreSQL    │
                                                │    Database     │
                                                └─────────────────┘
```

## Two-Step Registration Flow

### Design Rationale

The two-step registration system was designed to:

1. **Reduce Friction**: Start with minimal required information
2. **Improve Completion Rates**: Allow users to create accounts quickly, then complete profiles
3. **Data Quality**: Separate critical authentication data from optional profile information
4. **Progressive Disclosure**: Gather information progressively to improve user experience

### Step-by-Step Process

#### Step 1: Basic Account Creation
```typescript
POST /api/v1/auth/signup/step1
{
  "username": "user123",
  "email": "user@example.com", 
  "password": "securePassword"
}
```

**What happens:**
1. Validate username uniqueness (3-30 chars, alphanumeric + underscore)
2. Validate email uniqueness and format
3. Hash password using bcrypt (salt rounds: 10)
4. Create user record with `stepOneComplete: true`
5. Return `userId` for step 2

**Database State:**
```sql
INSERT INTO users (
  id, username, email, password_hash, 
  step_one_complete, step_two_complete,
  is_verified, is_active
) VALUES (
  uuid, 'user123', 'user@example.com', '$2b$10$...',
  true, false, false, true
);
```

#### Step 2: Profile Completion
```typescript
POST /api/v1/auth/signup/step2/:userId
{
  "fullName": "John Doe",
  "phoneNumber": "1234567890",
  "college": "University Name",
  "address": "123 Main St"
}
```

**What happens:**
1. Verify user exists and step 1 is complete
2. Ensure step 2 not already completed
3. Update user record with profile information
4. Set `stepTwoComplete: true` and `isVerified: true`
5. Generate JWT token for immediate signin
6. Return token and complete user profile

**Database State:**
```sql
UPDATE users SET 
  full_name = 'John Doe',
  phone_number = '1234567890',
  college = 'University Name',
  address = '123 Main St',
  step_two_complete = true,
  is_verified = true,
  updated_at = NOW()
WHERE id = userId;
```

## Authentication System

### JWT Token Structure
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "username": "user123",
  "iat": 1234567890,
  "exp": 1234571490
}
```

### Sign-in Requirements
Users can only sign in if:
- `stepOneComplete = true`
- `stepTwoComplete = true` 
- `isActive = true`
- Account not soft-deleted (`deletedAt IS NULL`)

### Flexible Authentication
Users can sign in with either:
- Username: `{ "identifier": "user123", "password": "..." }`
- Email: `{ "identifier": "user@example.com", "password": "..." }`

## Password Reset System

### OTP Flow Design
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Request    │    │  Generate   │    │   Verify    │
│  Reset      │───▶│    OTP      │───▶│ & Update    │
│             │    │             │    │ Password    │
└─────────────┘    └─────────────┘    └─────────────┘
```

1. **Request Reset**: `POST /auth/forgot-password`
   - Lookup user by email
   - Generate 6-digit OTP code
   - Create temporary record with 10-minute expiration
   - Return temporary ID (in production: send email)

2. **Verify & Reset**: `POST /auth/reset-password`
   - Validate temporary code and OTP
   - Update user password hash
   - Increment reset counter and timestamp
   - Clean up temporary record

### Security Features

- **Non-enumeration**: Don't reveal if email exists
- **Time-limited OTPs**: 10-minute expiration
- **Rate limiting**: Track reset attempts per user
- **Audit trail**: Record reset timestamps and counts

## Database Schema Design

### User Entity
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Step 1 fields
  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ default: false })
  stepOneComplete: boolean;

  // Step 2 fields
  @Column({ nullable: true, length: 255 })
  fullName?: string;

  @Column({ nullable: true, length: 20 })
  phoneNumber?: string;

  @Column({ nullable: true, length: 255 })
  college?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ default: false })
  stepTwoComplete: boolean;

  // Status fields
  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  deletedAt?: Date;

  // Password reset tracking
  @Column({ default: 0 })
  passwordResetCount: number;

  @Column({ nullable: true })
  lastPasswordReset?: Date;

  // Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Computed Properties
```typescript
get isSignupComplete(): boolean {
  return this.stepOneComplete && this.stepTwoComplete;
}
```

## Security Considerations

### Input Validation
- **Username**: 3-30 characters, alphanumeric + underscore only
- **Email**: Standard email format validation
- **Password**: Minimum 6 characters (configurable)
- **Phone**: Optional, 10-20 characters when provided

### Password Security
- **Hashing**: bcryptjs with 10 salt rounds
- **No plaintext storage**: Passwords immediately hashed
- **Reset protection**: Limited attempts, time-based expiration

### Soft Delete Pattern
- Users are never hard-deleted
- `deletedAt` timestamp marks inactive accounts
- All queries filter out soft-deleted records
- Preserves data integrity and audit trails

## API Versioning Strategy

All endpoints are prefixed with `/api/v1/` to support future versions:

```typescript
app.enableVersioning({
  type: VersioningType.URI,
  prefix: 'api/v',
});
```

Future versions can be added as `/api/v2/` without breaking existing clients.

## Error Handling

### Consistent Error Responses
```json
{
  "message": ["Detailed validation errors"],
  "error": "Bad Request",
  "statusCode": 400
}
```

### Security-Conscious Messaging
- Don't reveal user existence in auth failures
- Generic messages for invalid credentials
- Specific validation errors for registration

## Health Monitoring

Comprehensive system health checks include:

- **Application**: Version, uptime, status
- **Database**: Connection status, response time
- **System**: CPU, memory, load averages
- **Process**: Heap usage, memory consumption

This enables effective monitoring and alerting in production environments.