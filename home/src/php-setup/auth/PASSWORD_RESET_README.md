# Password Reset System

This directory contains secure PHP endpoints and pages for password reset functionality.

## Files

### 1. `request-password-reset.php`
API endpoint that initiates the password reset process.

**Method:** POST
**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Password reset instructions have been sent to your email"
}
```

### 2. `reset-password.php`
Standalone PHP page with HTML form for users to reset their password.

**URL:** `/src/php-setup/auth/reset-password.php?token={reset_token}`

**Features:**
- Beautiful, responsive UI
- Token validation before showing form
- Client-side and server-side password validation
- Password strength requirements (minimum 8 characters)
- Secure bcrypt password hashing
- Success/error states
- CSRF protection

**Usage:**
1. User receives email with reset link containing token
2. User clicks link to access `reset-password.php?token={token}`
3. Page validates token and displays password reset form
4. User enters new password (twice for confirmation)
5. Password is updated and token is marked as used

### 3. `update-password.php`
API endpoint for programmatic password updates.

**Method:** POST
**Request Body:**
```json
{
  "token": "reset_token_here",
  "password": "new_password",
  "confirm_password": "new_password"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

### 4. `verify-reset-token.php`
API endpoint to check if a reset token is valid.

**Method:** GET
**URL:** `/src/php-setup/auth/verify-reset-token.php?token={reset_token}`

**Success Response:**
```json
{
  "success": true,
  "valid": true,
  "email": "user@example.com"
}
```

### 5. `check-user-exists.php`
API endpoint to verify user exists before requesting password reset.

**Method:** POST
**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username"
}
```

## Security Features

1. **Token Expiration:** Reset tokens expire after 1 hour
2. **One-time Use:** Tokens are marked as used after successful password reset
3. **Secure Hashing:** Passwords are hashed using bcrypt with cost factor 12
4. **CSRF Protection:** All POST endpoints validate CSRF tokens
5. **Input Validation:** Server-side validation of all inputs
6. **Transaction Safety:** Database transactions ensure data consistency
7. **SQL Injection Prevention:** Prepared statements for all queries
8. **XSS Prevention:** All output is properly escaped

## Database Tables Used

### `password_resets`
```sql
- id: INT (primary key)
- email: VARCHAR(255)
- token: VARCHAR(255)
- created_at: TIMESTAMP
- expires_at: TIMESTAMP
- used: BOOLEAN
```

### `users`
```sql
- id: INT (primary key)
- username: VARCHAR(50)
- email: VARCHAR(255)
- password_hash: VARCHAR(255)
- ... other fields
```

## Flow Diagram

```
1. User requests password reset
   ↓
2. System validates email + username
   ↓
3. System generates secure token (64 characters)
   ↓
4. Token stored in database with 1-hour expiration
   ↓
5. Email sent with reset link (production) or logged (development)
   ↓
6. User clicks link → reset-password.php?token={token}
   ↓
7. System validates token (exists, not used, not expired)
   ↓
8. User enters new password
   ↓
9. Password hashed and updated in database
   ↓
10. Token marked as used
    ↓
11. Success message displayed
```

## Configuration

No additional configuration needed. The system uses:
- Database connection from `config/database.php`
- Security functions from `config/security.php`

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `400`: Bad request (validation errors)
- `404`: Resource not found (invalid token)
- `500`: Server error

## Testing

Test with demo users from `schema.sql`:
- sarah.chen@research.com / sarah
- william.hane@research.com / william
- curtis.lee@research.com / curtis

## Notes

- In development, reset tokens are logged to error log
- In production, implement email sending (see TODO comments)
- Tokens are automatically invalidated when new reset is requested
- Consider implementing rate limiting for production use
