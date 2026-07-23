# PHP Backend Integration Guide

This document provides detailed instructions on how to enable the PHP backend authentication system for production use. Currently, the application is configured to use mock authentication for development purposes. Follow these steps to integrate with your PHP backend.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Configuration](#environment-configuration)
4. [Code Changes Required](#code-changes-required)
5. [Testing the Integration](#testing-the-integration)
6. [Troubleshooting](#troubleshooting)

---

## Overview

The application currently uses mock authentication to allow development without a PHP backend. The PHP integration code has been commented out in several files to enable this. To use the production PHP backend, you need to:

1. Configure environment variables
2. Uncomment PHP authentication service calls
3. Comment out mock authentication code
4. Set up your PHP backend with the required endpoints

---

## Prerequisites

Before enabling PHP backend integration, ensure you have:

1. **PHP Backend Configured**: Your PHP backend should be running and accessible
2. **Required PHP Endpoints**: All authentication endpoints must be implemented (see `/src/php-setup/` directory)
3. **CORS Configuration**: Your PHP backend should allow requests from your frontend domain
4. **Database Setup**: MySQL/PostgreSQL database with the required schema
5. **Session Management**: PHP session handling configured properly

### Required PHP Endpoints

Your PHP backend must have these endpoints available:

- `POST /auth/csrf.php` - Get CSRF token
- `POST /auth/verify-credentials.php` - Verify username/password
- `POST /auth/verify-2fa-code.php` - Verify 2FA code
- `POST /auth/login.php` - Direct login (legacy)
- `POST /auth/logout.php` - Logout user
- `POST /auth/register.php` - Register new user
- `GET /auth/verify.php` - Verify current session
- `POST /auth/unlock.php` - Unlock locked session
- `POST /auth/update-role.php` - Update user role
- `POST /email/send-confirmation.php` - Send email confirmation
- `POST /email/resend-confirmation.php` - Resend email confirmation
- `POST /email/confirm-email.php` - Confirm email with token

---

## Environment Configuration

### Step 1: Update `.env` File

**File**: `/.env`

**Current Configuration (Mock Auth Enabled)**:
```env
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_URL=https://sfyzkvithnyxivnzusct.supabase.co

# Use mock authentication (set to true to bypass PHP backend)
VITE_USE_MOCK_AUTH=true

# Frontend URL for email links
FRONTEND_URL=console.error("API request failed

# Google reCAPTCHA v3 Keys
VITE_RECAPTCHA_SITE_KEY=6LcC_kcsAAAAAEONUvD3hVgryGgjjSd9xGMPhIFg
RECAPTCHA_SECRET_KEY=6LcC_kcsAAAAAD16F0o2zBcDP50buySvyig0ZrVn
```

**Change Required**:

1. Set `VITE_USE_MOCK_AUTH` to `false` or remove it entirely:
   ```env
   # Use mock authentication (set to true to bypass PHP backend)
   VITE_USE_MOCK_AUTH=false
   ```

2. Add your PHP backend API URL:
   ```env
   # PHP Backend API URL
   VITE_AUTH_API_URL=https://your-domain.com/auth
   ```

3. Fix the FRONTEND_URL (currently has an error):
   ```env
   # Frontend URL for email links
   FRONTEND_URL=https://your-frontend-domain.com
   ```

**Complete Production `.env` Example**:
```env
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_URL=https://sfyzkvithnyxivnzusct.supabase.co

# Use mock authentication (set to false for production)
VITE_USE_MOCK_AUTH=false

# PHP Backend API URL
VITE_AUTH_API_URL=https://api.your-domain.com/auth

# Frontend URL for email links
FRONTEND_URL=https://your-domain.com

# Google reCAPTCHA v3 Keys
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
```

---

## Code Changes Required

### File 1: `src/components/LoginPage.tsx`

This file handles user login and 2FA verification.

#### Changes Needed:

**Line 4-5: Import Statement**

**Current (Mock Auth)**:
```typescript
import { type LoginCredentials, setCachedUser, verifyCredentials, verifyTwoFactorCode } from '../data/authData';
// import { authService } from '../services/authService';
```

**Change To (PHP Backend)**:
```typescript
import { type LoginCredentials, setCachedUser } from '../data/authData';
import { authService } from '../services/authService';
```

---

**Lines 26-59: `handleSubmit` Function**

**Current (Mock Auth)**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);

  try {
    // Use mock authentication (PHP backend commented out)
    // const result = await authService.verifyCredentials(credentials);
    const result = await verifyCredentials(credentials);

    if (result.success && result.requiresTwoFactor) {
      setUserEmail(result.email || '');
      setShowTwoFactor(true);
      setError('');
    } else if (result.success) {
      // For mock auth, session is already established
      // const sessionCheck = await authService.verifySession();
      // if (sessionCheck.authenticated && sessionCheck.user) {
      //   setCachedUser(sessionCheck.user);
      //   onLogin();
      // } else {
      //   setError('Failed to establish session');
      // }
      onLogin();
    } else {
      setError(result.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    setError('An error occurred during login');
  }

  setIsLoading(false);
};
```

**Change To (PHP Backend)**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);

  try {
    // Use PHP backend authentication
    const result = await authService.verifyCredentials(credentials);

    if (result.success && result.requiresTwoFactor) {
      setUserEmail(result.email || '');
      setShowTwoFactor(true);
      setError('');
    } else if (result.success) {
      // Verify session to get user data
      const sessionCheck = await authService.verifySession();
      if (sessionCheck.authenticated && sessionCheck.user) {
        setCachedUser(sessionCheck.user);
        onLogin();
      } else {
        setError('Failed to establish session');
      }
    } else {
      setError(result.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    setError('An error occurred during login');
  }

  setIsLoading(false);
};
```

---

**Lines 61-85: `handleTwoFactorSubmit` Function**

**Current (Mock Auth)**:
```typescript
const handleTwoFactorSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);

  try {
    // Use mock authentication (PHP backend commented out)
    // const result = await authService.verifyTwoFactorCode(credentials.username, verificationCode);
    const result = await verifyTwoFactorCode(credentials.username, verificationCode);

    if (result.success && result.user) {
      setCachedUser(result.user);
      onLogin();
    } else {
      setError(result.error || 'Invalid verification code');
      setVerificationCode('');
    }
  } catch (error) {
    console.error('2FA verification error:', error);
    setError('An error occurred during verification');
    setVerificationCode('');
  }

  setIsLoading(false);
};
```

**Change To (PHP Backend)**:
```typescript
const handleTwoFactorSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);

  try {
    const result = await authService.verifyTwoFactorCode(credentials.username, verificationCode);

    if (result.success && result.user) {
      setCachedUser(result.user);
      onLogin();
    } else {
      setError(result.error || 'Invalid verification code');
      setVerificationCode('');
    }
  } catch (error) {
    console.error('2FA verification error:', error);
    setError('An error occurred during verification');
    setVerificationCode('');
  }

  setIsLoading(false);
};
```

---

**Lines 87-104: `handleResendCode` Function**

**Current (Mock Auth)**:
```typescript
const handleResendCode = async () => {
  setError('');
  setIsLoading(true);

  try {
    // Use mock authentication (PHP backend commented out)
    // const result = await authService.verifyCredentials(credentials);
    const result = await verifyCredentials(credentials);
    if (result.success && result.requiresTwoFactor) {
      setError('');
      alert('A new verification code has been sent to your email.');
    }
  } catch (error) {
    console.error('Resend code error:', error);
  }

  setIsLoading(false);
};
```

**Change To (PHP Backend)**:
```typescript
const handleResendCode = async () => {
  setError('');
  setIsLoading(true);

  try {
    const result = await authService.verifyCredentials(credentials);
    if (result.success && result.requiresTwoFactor) {
      setError('');
      alert('A new verification code has been sent to your email.');
    }
  } catch (error) {
    console.error('Resend code error:', error);
  }

  setIsLoading(false);
};
```

---

### File 2: `src/App.tsx`

This file is the main application component that handles routing and authentication state.

#### Changes Needed:

**Lines 28-29: Import Statement**

**Current (Mock Auth)**:
```typescript
import { isAuthenticated, setCachedUser, getCurrentUser } from './data/authData';
// import { authService } from './services/authService';
```

**Change To (PHP Backend)**:
```typescript
import { isAuthenticated, setCachedUser, getCurrentUser } from './data/authData';
import { authService } from './services/authService';
```

---

**Lines 44-62: `initialize` useEffect**

**Current (Mock Auth)**:
```typescript
// Initialize auth on app start
React.useEffect(() => {
  const initialize = async () => {
    // PHP backend initialization (commented out)
    // await authService.initialize();

    // Verify session with server (commented out for mock auth)
    // const sessionCheck = await authService.verifySession();
    // if (sessionCheck.authenticated && sessionCheck.user) {
    //   setCachedUser(sessionCheck.user);
    // } else {
    //   setCachedUser(null);
    // }

    setIsInitialized(true);
  };

  initialize();
}, []);
```

**Change To (PHP Backend)**:
```typescript
// Initialize auth on app start
React.useEffect(() => {
  const initialize = async () => {
    await authService.initialize();

    // Verify session with server
    const sessionCheck = await authService.verifySession();
    if (sessionCheck.authenticated && sessionCheck.user) {
      setCachedUser(sessionCheck.user);
    } else {
      setCachedUser(null);
    }

    setIsInitialized(true);
  };

  initialize();
}, []);
```

---

**Lines 135-155: `handleEnroll` Function**

**Current (Mock Auth)**:
```typescript
const handleEnroll = async (role: string, billingCycle: 'monthly' | 'yearly') => {
  try {
    // PHP backend role update (commented out for mock auth)
    // const result = await authService.updateUserRole(role);
    // if (result.success) {
    //   window.location.reload();
    // } else {
    //   console.error('Failed to update role:', result.error);
    // }

    // For mock auth, just update the user's role directly
    const currentUser = getCurrentUser();
    if (currentUser) {
      currentUser.role = role as 'administrator' | 'owner' | 'member' | 'unsubscribed';
      setCachedUser(currentUser);
      window.location.reload();
    }
  } catch (error) {
    console.error('Error updating role:', error);
  }
};
```

**Change To (PHP Backend)**:
```typescript
const handleEnroll = async (role: string, billingCycle: 'monthly' | 'yearly') => {
  try {
    const result = await authService.updateUserRole(role);
    if (result.success) {
      window.location.reload();
    } else {
      console.error('Failed to update role:', result.error);
    }
  } catch (error) {
    console.error('Error updating role:', error);
  }
};
```

---

### File 3: `src/components/AuthGuard.tsx`

This file protects routes and verifies authentication on every navigation.

#### Changes Needed:

**Lines 3-4: Import Statement**

**Current (Mock Auth)**:
```typescript
import { hasPageAccess, getCurrentUser, isAuthenticated } from '../data/authData';
// import { authService } from '../services/authService';
```

**Change To (PHP Backend)**:
```typescript
import { hasPageAccess } from '../data/authData';
import { authService } from '../services/authService';
```

---

**Lines 15-50: `checkAuth` useEffect**

**Current (Mock Auth)**:
```typescript
useEffect(() => {
  const checkAuth = async () => {
    try {
      // PHP backend session verification (commented out for mock auth)
      // const sessionCheck = await authService.verifySession();

      // Use mock authentication check instead
      if (!isAuthenticated()) {
        // Session invalid, redirect to login
        navigate('/login', { replace: true });
        setIsLoading(false);
        return;
      }

      // Session valid, check page access
      const currentUser = getCurrentUser();
      if (currentUser) {
        const currentPage = getPageFromPath(location.pathname);

        if (currentPage && !hasPageAccess(currentPage, currentUser.role)) {
          navigate('/', { replace: true });
          setIsLoading(false);
          return;
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error verifying session:', error);
      navigate('/login', { replace: true });
      setIsLoading(false);
    }
  };

  checkAuth();
}, [navigate, location.pathname]);
```

**Change To (PHP Backend)**:
```typescript
useEffect(() => {
  const checkAuth = async () => {
    try {
      // Verify session with backend on every page load/navigation
      const sessionCheck = await authService.verifySession();

      if (!sessionCheck.authenticated) {
        // Session invalid on backend, redirect to login
        navigate('/login', { replace: true });
        setIsLoading(false);
        return;
      }

      // Session valid, check page access
      if (sessionCheck.user) {
        const currentPage = getPageFromPath(location.pathname);

        if (currentPage && !hasPageAccess(currentPage, sessionCheck.user.role)) {
          navigate('/', { replace: true });
          setIsLoading(false);
          return;
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error verifying session:', error);
      navigate('/login', { replace: true });
      setIsLoading(false);
    }
  };

  checkAuth();
}, [navigate, location.pathname]);
```

---

## Testing the Integration

After making all the changes above, follow these steps to test the integration:

### 1. Build and Deploy

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Preview the build
npm run preview
```

### 2. Test Authentication Flow

1. **Login Test**:
   - Navigate to the login page
   - Enter valid credentials
   - Verify that you receive a 2FA code (check email or console)
   - Enter the 2FA code
   - Verify successful login and redirect to dashboard

2. **Session Verification**:
   - After logging in, refresh the page
   - Verify that you remain logged in (session persists)
   - Open browser DevTools > Network tab
   - Navigate between pages
   - Verify that `verify.php` is called on each navigation

3. **Logout Test**:
   - Click the logout button
   - Verify redirect to login page
   - Try to access protected routes directly
   - Verify redirect back to login

4. **Role-Based Access**:
   - Login with different user roles
   - Verify that users can only access pages allowed for their role
   - Try to access restricted pages directly via URL
   - Verify proper redirects

### 3. Monitor Network Requests

Open browser DevTools (F12) > Network tab and verify:

- `POST /auth/verify-credentials.php` - Returns success with requiresTwoFactor
- `POST /auth/verify-2fa-code.php` - Returns success with user object
- `GET /auth/verify.php` - Called on every page load
- `POST /auth/logout.php` - Called when logging out
- All requests include proper CSRF tokens
- Cookies are being set and sent correctly

### 4. Check for Errors

- No console errors related to authentication
- No CORS errors in the console
- No 404 errors for missing endpoints
- Session cookies are being set properly

---

## Troubleshooting

### Issue: CORS Errors

**Symptom**: Browser console shows CORS policy errors

**Solution**:
1. Ensure your PHP backend has proper CORS headers:
   ```php
   header('Access-Control-Allow-Origin: https://your-frontend-domain.com');
   header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
   header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
   header('Access-Control-Allow-Credentials: true');
   ```

2. Handle OPTIONS preflight requests:
   ```php
   if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
       http_response_code(200);
       exit;
   }
   ```

### Issue: Session Not Persisting

**Symptom**: User is logged out on page refresh

**Solution**:
1. Verify cookies are being sent: `credentials: 'include'` in fetch requests
2. Check PHP session configuration:
   ```php
   session_set_cookie_params([
       'lifetime' => 86400,
       'path' => '/',
       'domain' => '.your-domain.com',
       'secure' => true,
       'httponly' => true,
       'samesite' => 'Lax'
   ]);
   ```

3. Ensure HTTPS is being used in production

### Issue: CSRF Token Errors

**Symptom**: Requests fail with "Invalid CSRF token. Refresh the page and try again." error

**Solution**:
1. Verify CSRF token is being stored in localStorage
2. Check that `X-CSRF-Token` header is being sent
3. Verify PHP backend is validating tokens correctly
4. Clear localStorage and try logging in again

### Issue: 404 Errors for Auth Endpoints

**Symptom**: Network requests show 404 errors

**Solution**:
1. Verify `VITE_AUTH_API_URL` in `.env` is correct
2. Check that all PHP files exist in the correct location
3. Verify web server configuration (Apache/Nginx) is routing correctly
4. Check `.htaccess` or nginx config for proper rewrite rules

### Issue: Users Array Still Being Used

**Symptom**: Mock users are being used instead of database users

**Solution**:
1. Verify `VITE_USE_MOCK_AUTH=false` in `.env`
2. Restart the development server after changing `.env`
3. Clear browser cache and localStorage
4. Check that all mock auth code is properly commented out

---

## Quick Reference Checklist

Use this checklist when enabling PHP backend:

- [ ] Update `.env`:
  - [ ] Set `VITE_USE_MOCK_AUTH=false`
  - [ ] Add `VITE_AUTH_API_URL`
  - [ ] Fix `FRONTEND_URL`
  - [ ] Update reCAPTCHA keys

- [ ] Update `src/components/LoginPage.tsx`:
  - [ ] Uncomment `authService` import
  - [ ] Remove mock auth imports (`verifyCredentials`, `verifyTwoFactorCode`)
  - [ ] Uncomment PHP calls in `handleSubmit`
  - [ ] Uncomment PHP calls in `handleTwoFactorSubmit`
  - [ ] Uncomment PHP calls in `handleResendCode`

- [ ] Update `src/App.tsx`:
  - [ ] Uncomment `authService` import
  - [ ] Uncomment `authService.initialize()` call
  - [ ] Uncomment session verification in initialization
  - [ ] Replace mock role update with PHP call in `handleEnroll`

- [ ] Update `src/components/AuthGuard.tsx`:
  - [ ] Uncomment `authService` import
  - [ ] Remove mock auth imports (`getCurrentUser`, `isAuthenticated`)
  - [ ] Uncomment `authService.verifySession()` call
  - [ ] Use session data from backend instead of mock data

- [ ] Test:
  - [ ] Login flow works
  - [ ] 2FA code is sent and verified
  - [ ] Session persists on refresh
  - [ ] Role-based access control works
  - [ ] Logout works properly
  - [ ] No console errors

---

## Additional Notes

### Mock Auth vs Production

The mock authentication system is designed for development only. It stores user data in memory and does not persist sessions. In production:

- Users are stored in a database
- Sessions are managed server-side
- 2FA codes are sent via email
- CSRF protection is active
- All security measures are enforced

### Security Considerations

When enabling PHP backend, ensure:

1. **HTTPS Only**: Never use HTTP in production
2. **Secure Cookies**: Set `secure` and `httponly` flags
3. **CSRF Protection**: Validate CSRF tokens on all state-changing requests
4. **SQL Injection**: Use prepared statements
5. **Password Hashing**: Use `password_hash()` with bcrypt
6. **Rate Limiting**: Implement rate limiting on auth endpoints
7. **Email Confirmation**: Require email confirmation before account activation
8. **Session Timeout**: Implement appropriate session timeouts

### Environment-Specific Configuration

Consider using different `.env` files for different environments:

- `.env.development` - Mock auth enabled
- `.env.staging` - PHP backend testing
- `.env.production` - Production PHP backend

---

## Support

For additional help:

1. Review the PHP setup files in `/src/php-setup/`
2. Check the PHP README at `/src/php-setup/README.md`
3. Review the password reset documentation at `/src/php-setup/auth/PASSWORD_RESET_README.md`
4. Examine the database schema files in `/src/php-setup/database/`

---

**Last Updated**: January 2025
**Version**: 1.0.0
