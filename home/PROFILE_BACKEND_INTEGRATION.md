# Profile Page - PHP Backend Integration Guide

This document explains how to enable the PHP backend integration for the profile page.

## Overview

The profile page has been prepared with complete PHP backend integration code that is currently **commented out**. This allows you to:
- Use mock data during development (current state)
- Switch to PHP backend in production by uncommenting the integration code

## What's Been Added

### 1. PHP Backend Endpoints (`src/php-setup/profile/`)

Six secure PHP endpoints have been created:

| File | Purpose | Method |
|------|---------|--------|
| `get-profile.php` | Fetch complete profile data | GET |
| `update-profile.php` | Update profile sections | POST |
| `get-messages.php` | Fetch user messages | GET |
| `send-message.php` | Send new message | POST |
| `get-approvals.php` | Fetch document approvals | GET |
| `get-files.php` | Fetch personal files | GET |

### 2. Profile Service (`src/services/profileService.ts`)

A TypeScript service layer that handles all API communication:
- Automatic CSRF token management
- Session cookie handling
- Type-safe request/response handling
- Error handling and logging

### 3. Database Schema (`src/php-setup/database/profile_schema.sql`)

Complete database schema including:
- `user_job_info` - Job history and departmental info
- `user_activity` - Activity tracking and audit log
- `user_compensation` - Compensation history
- `messages` - Internal messaging system
- `document_approvals` - Approval workflow tracking
- `user_files` - Personal file metadata
- Extended `users` table with profile columns

### 4. React Integration (Commented Out)

Integration code has been added and commented out in:
- `src/components/ProfilePage.tsx` - Main profile component
- `src/data/profileData.ts` - Data layer helpers

## How to Enable Backend Integration

### Step 1: Set Up the Database

Run the profile schema SQL file to create required tables:

```bash
mysql -u your_username -p your_database < src/php-setup/database/profile_schema.sql
```

Or use your database management tool to execute the schema.

### Step 2: Configure Environment Variables

Add to your `.env` file:

```env
VITE_API_URL=/php-setup
```

### Step 3: Enable Backend Integration

#### In `src/components/ProfilePage.tsx`:

1. **Uncomment the profileService import** (line 29):
   ```typescript
   // Change this:
   // import { profileService } from '../services/profileService';

   // To this:
   import { profileService } from '../services/profileService';
   ```

2. **Set USE_PHP_BACKEND to true** (line 26):
   ```typescript
   // Change this:
   const USE_PHP_BACKEND = false;

   // To this:
   const USE_PHP_BACKEND = true;
   ```

3. **Uncomment the backend code blocks**:
   - Lines 74-116: Profile data loading
   - Lines 139-157: Tab-specific data loading
   - Lines 189-218: Profile update handling
   - Lines 248-271: Message sending

That's it! The component will now use PHP backend instead of mock data.

### Step 4: Test the Integration

1. Ensure your PHP backend is running and accessible
2. Make sure you're logged in
3. Navigate to the profile page
4. Check browser console for any errors
5. Test profile updates, messaging, etc.

**Note:** When `USE_PHP_BACKEND = false`, the app uses mock data. When `true`, it exclusively uses the PHP backend and ignores all mock data.

## Security Features

All endpoints implement:

- **Session Authentication** - Users must be logged in
- **CSRF Protection** - POST requests require valid CSRF token
- **Input Validation** - All user input is sanitized
- **SQL Injection Prevention** - Using prepared statements
- **Access Control** - Users can only access their own data
- **Secure Error Messages** - No sensitive info exposed

## API Response Format

All endpoints return standardized JSON:

**Success:**
```json
{
  "success": true,
  "profile": { ... },
  "messages": [ ... ]
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## Data Flow

### Loading Profile Data

```
Component Mount
    ↓
profileService.getProfile()
    ↓
GET /php-setup/profile/get-profile.php
    ↓
PHP queries database
    ↓
Returns JSON response
    ↓
Update React state
    ↓
Re-render with backend data
```

### Updating Profile

```
User edits profile
    ↓
User clicks Save
    ↓
profileService.updateProfile(section, data)
    ↓
POST /php-setup/profile/update-profile.php
    ↓
PHP validates & updates database
    ↓
Returns success/error
    ↓
Reload profile data
    ↓
Update UI
```

## Troubleshooting

### Issue: CSRF Token Invalid

**Solution:** Ensure the CSRF token is being properly initialized. Check:
1. `authService.initialize()` is called on app load
2. CSRF token is stored in localStorage
3. Token is being sent in request headers

### Issue: Authentication Required

**Solution:** User session may have expired. Check:
1. User is logged in
2. Session cookies are being sent (`credentials: 'include'`)
3. PHP session is configured correctly

### Issue: CORS Errors

**Solution:** Configure PHP backend to allow requests from your frontend:
```php
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
```

### Issue: Data Not Loading

**Solution:** Check browser console for errors. Common causes:
1. Backend endpoint not accessible
2. Database tables not created
3. Invalid JSON response from PHP
4. Network connectivity issues

## Database Seeding

To populate test data for development:

```sql
-- Sample user profile data
UPDATE users SET
    phone = '(629) 555-0123',
    date_of_birth = '1988-09-26',
    address = '990 Market Street',
    city_state = 'San Francisco CA',
    postcode = '94102'
WHERE id = 1;

-- Sample job information
INSERT INTO user_job_info (user_id, department, division, manager, hire_date, location)
VALUES (1, 'Clinical Pharmacology', 'R&D', 'Dr. Alex Foster', '2024-05-13', 'San Francisco, CA');

-- Sample activity
INSERT INTO user_activity (user_id, action)
VALUES (1, 'last login on');
```

## Performance Considerations

1. **Caching**: Consider implementing caching for profile data that doesn't change frequently
2. **Pagination**: Messages and files endpoints support pagination
3. **Lazy Loading**: Tab data is loaded when the tab is activated
4. **Optimistic Updates**: Consider updating UI immediately before backend confirmation

## Additional Resources

- API Documentation: `src/php-setup/profile/README.md`
- Database Schema: `src/php-setup/database/profile_schema.sql`
- Profile Service: `src/services/profileService.ts`

## Next Steps

After enabling the backend integration:

1. Test all profile sections (personal info, job info, etc.)
2. Test messaging functionality
3. Test document approvals view
4. Test personal files view
5. Verify all updates are persisted to database
6. Check error handling works correctly
7. Implement file upload functionality (if needed)
8. Add loading states for better UX
9. Consider adding success/error toast notifications
10. Implement real-time updates for messages (WebSocket/polling)

## Development vs Production

**Current State (Development):**
- Uses mock data from `src/data/profileData.ts`
- No backend dependency
- Fast and reliable for UI development

**After Enabling (Production):**
- Uses real database data
- Requires PHP backend setup
- Real-time data persistence
- Multi-user support

Both modes use the same React components, making the transition seamless.
