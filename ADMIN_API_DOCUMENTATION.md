# NeoVantis Auth Service - Admin API Documentation

## Overview

The Admin API provides administrative functionality for the NeoVantis Auth Service. It includes role-based access control with two admin roles:

- **Super Admin (role: 0)**: Can create other admins, view all admins, and manage the system
- **Admin (role: 1)**: Standard admin with limited privileges

## Base URL

```
http://localhost:3001/api/v1/admin
```

## Authentication

Admin APIs use JWT Bearer tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <admin_jwt_token>
```

## Admin Roles

| Role | Value | Description | Permissions |
|------|-------|-------------|-------------|
| Super Admin | 0 | Highest privilege level | Create admins, view all admins, full system access |
| Admin | 1 | Standard admin level | Limited administrative functions |

## Automatic Super Admin Creation

When the application starts for the first time and no admins exist in the database, a super admin is automatically created using environment variables:

- **Username**: `SUPER_ADMIN_EMAIL` (default: `md@neovantis.xyz`)
- **Password**: `SUPER_ADMIN_PASSWORD` (default: `abcabcabc`)
- **Role**: 0 (Super Admin)

---

## API Endpoints

### 1. Admin Login

Authenticate admin users and receive JWT token.

**Endpoint:** `POST /admin/login`

**Request Body:**
```json
{
  "username": "admin_username",
  "password": "admin_password"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3001/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "md@neovantis.xyz",
    "password": "abcabcabc"
  }'
```

**Success Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userRole": 0
}
```

**Error Responses:**
```json
// Invalid credentials
{
  "message": "Invalid credentials",
  "error": "Unauthorized",
  "statusCode": 401
}
```

---

### 2. Get Admin Profile

Get the current admin's profile information.

**Endpoint:** `GET /admin/me`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Example Request:**
```bash
curl -X GET http://localhost:3001/api/v1/admin/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200):**
```json
{
  "admin": {
    "id": "47312747-2b5b-4432-cf8f-2ed0d96056ec",
    "name": "Super Administrator",
    "username": "md@neovantis.xyz",
    "role": 0,
    "createdAt": "2025-09-10T10:36:14.853Z",
    "updatedAt": "2025-09-10T10:36:14.853Z"
  }
}
```

**Error Responses:**
```json
// Invalid or missing token
{
  "message": "Admin access token required",
  "error": "Unauthorized",
  "statusCode": 401
}

// Invalid token
{
  "message": "Invalid admin token",
  "error": "Unauthorized", 
  "statusCode": 401
}
```

---

### 3. Create New Admin

Create a new admin user (Super Admin only).

**Endpoint:** `POST /admin/create`

**Headers:**
```
Authorization: Bearer <super_admin_token>
```

**Request Body:**
```json
{
  "name": "Admin Name",
  "username": "admin_username",
  "password": "admin_password",
  "role": 1
}
```

**Validation Rules:**
- `name`: Required string
- `username`: Required string, must be unique
- `password`: Required string
- `role`: Required integer, 0 (Super Admin) or 1 (Admin)

**Example Request:**
```bash
curl -X POST http://localhost:3001/api/v1/admin/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <super_admin_token>" \
  -d '{
    "name": "John Admin",
    "username": "john.admin@neovantis.xyz",
    "password": "securepassword123",
    "role": 1
  }'
```

**Success Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Admin",
  "username": "john.admin@neovantis.xyz",
  "role": 1,
  "createdAt": "2025-09-10T10:45:23.123Z",
  "updatedAt": "2025-09-10T10:45:23.123Z"
}
```

**Error Responses:**
```json
// Not super admin
{
  "message": "Only super administrators can create new admins",
  "error": "Forbidden",
  "statusCode": 403
}

// Username already exists
{
  "message": "Username already taken",
  "error": "Conflict",
  "statusCode": 409
}

// Missing authorization
{
  "message": "Admin access token required",
  "error": "Unauthorized",
  "statusCode": 401
}
```

---

### 4. List All Admins

Get a list of all admin users (Super Admin only).

**Endpoint:** `GET /admin/list`

**Headers:**
```
Authorization: Bearer <super_admin_token>
```

**Example Request:**
```bash
curl -X GET http://localhost:3001/api/v1/admin/list \
  -H "Authorization: Bearer <super_admin_token>"
```

**Success Response (200):**
```json
[
  {
    "id": "47312747-2b5b-4432-cf8f-2ed0d96056ec",
    "username": "md@neovantis.xyz",
    "name": "Super Administrator",
    "role": 0,
    "createdAt": "2025-09-10T10:36:14.853Z",
    "updatedAt": "2025-09-10T10:36:14.853Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john.admin@neovantis.xyz",
    "name": "John Admin",
    "role": 1,
    "createdAt": "2025-09-10T10:45:23.123Z",
    "updatedAt": "2025-09-10T10:45:23.123Z"
  }
]
```

**Error Responses:**
```json
// Not super admin
{
  "message": "Only super administrators can view all admins",
  "error": "Forbidden",
  "statusCode": 403
}

// Missing authorization
{
  "message": "Admin access token required",
  "error": "Unauthorized",
  "statusCode": 401
}
```

---

## Database Schema

### Admin Entity

```typescript
{
  id: string (UUID, Primary Key)
  name: string (Admin's full name)
  username: string (Unique, used for login)
  passwordHash: string (Bcrypt hashed password)
  role: number (0 = Super Admin, 1 = Admin)
  createdAt: Date
  updatedAt: Date
}
```

---

## Security Features

### 1. Role-Based Access Control
- Super Admin (role: 0) can create other admins and view all admins
- Regular Admin (role: 1) has limited access
- All admin operations require valid JWT tokens

### 2. Password Security
- Passwords are hashed using bcrypt with salt rounds of 10
- Original passwords are never stored in the database

### 3. Token-Based Authentication
- JWT tokens include admin ID, username, and role
- Tokens expire after 1 hour
- Invalid tokens are rejected with 401 Unauthorized

### 4. Automatic Super Admin Creation
- Ensures system always has at least one super admin
- Uses environment variables for secure credential configuration
- Only creates super admin if no admins exist in the database

---

## Environment Variables

Add these to your `.env` file:

```bash
# Super Admin Configuration (for initial seeding)
SUPER_ADMIN_EMAIL=md@neovantis.xyz
SUPER_ADMIN_PASSWORD=abcabcabc
```

---

## Error Handling

### Common HTTP Status Codes

| Status | Description | When It Occurs |
|--------|-------------|----------------|
| 200 | Success | Successful requests |
| 201 | Created | Admin successfully created |
| 401 | Unauthorized | Missing/invalid token, invalid credentials |
| 403 | Forbidden | Insufficient permissions (not super admin) |
| 409 | Conflict | Username already exists |
| 422 | Validation Error | Invalid request body format |

### Error Response Format

All errors follow this structure:

```json
{
  "message": "Error description",
  "error": "Error type",
  "statusCode": 400
}
```

---

## Best Practices

### 1. Token Management
- Store tokens securely (not in localStorage for production)
- Implement token refresh mechanism for long-running applications
- Clear tokens on logout

### 2. Role Verification
- Always verify admin role before sensitive operations
- Use the `/admin/me` endpoint to check current admin's role
- Implement client-side role-based UI restrictions

### 3. Password Policy
- Use strong passwords for admin accounts
- Regularly rotate admin passwords
- Consider implementing password complexity requirements

### 4. Monitoring
- Log all admin actions for audit trails
- Monitor failed login attempts
- Set up alerts for suspicious admin activity

---

## Testing Examples

### Complete Admin Workflow

```bash
# 1. Login as super admin
SUPER_ADMIN_TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"md@neovantis.xyz","password":"abcabcabc"}' | jq -r .access_token)

# 2. Get super admin profile
curl -X GET http://localhost:3001/api/v1/admin/me \
  -H "Authorization: Bearer $SUPER_ADMIN_TOKEN"

# 3. Create a new admin
curl -X POST http://localhost:3001/api/v1/admin/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" \
  -d '{
    "name": "Test Admin",
    "username": "test.admin@neovantis.xyz",
    "password": "testpassword123",
    "role": 1
  }'

# 4. List all admins
curl -X GET http://localhost:3001/api/v1/admin/list \
  -H "Authorization: Bearer $SUPER_ADMIN_TOKEN"

# 5. Login as new admin
NEW_ADMIN_TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test.admin@neovantis.xyz","password":"testpassword123"}' | jq -r .access_token)

# 6. Try to create admin as regular admin (should fail)
curl -X POST http://localhost:3001/api/v1/admin/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NEW_ADMIN_TOKEN" \
  -d '{
    "name": "Another Admin",
    "username": "another.admin@neovantis.xyz", 
    "password": "password123",
    "role": 1
  }'
```

---

## Integration with Main Auth System

The admin system is completely separate from the regular user authentication system:

- **Different routes**: `/api/v1/admin/*` vs `/api/v1/auth/*`
- **Different database tables**: `admin` vs `users`
- **Different JWT tokens**: Admin tokens vs user tokens
- **Different permissions**: Admin operations vs user operations

This separation ensures security and clear role boundaries between regular users and administrative users.
