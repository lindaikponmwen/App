# Profile Backend - Quick Start Guide

## Current Status: Mock Data Mode

The profile page is currently using **mock data** for development. This means:
- ✅ No backend setup required
- ✅ Works immediately out of the box
- ✅ All UI features functional
- ❌ Changes not persisted to database
- ❌ No multi-user support

## Switch to PHP Backend (3 Steps)

### 1. Setup Database
```bash
mysql -u username -p database < src/php-setup/database/profile_schema.sql
```

### 2. Edit ProfilePage.tsx

Open `src/components/ProfilePage.tsx`:

**Line 26:** Change flag
```typescript
const USE_PHP_BACKEND = true;  // was false
```

**Line 29:** Uncomment import
```typescript
import { profileService } from '../services/profileService';
```

**Lines 74-116, 139-157, 189-218, 248-271:** Uncomment all code blocks marked with:
```typescript
// Uncomment when profileService is imported:
/* ... */
```

### 3. Test
- Login to your app
- Navigate to profile page
- Changes now save to database!

## What Gets Loaded from Backend

When `USE_PHP_BACKEND = true`:

| Data | Mock Mode | Backend Mode |
|------|-----------|--------------|
| Personal Info | ❌ | ✅ From `users` table |
| Job Information | ❌ | ✅ From `user_job_info` |
| Activity Feed | ❌ | ✅ From `user_activity` |
| Compensation | ❌ | ✅ From `user_compensation` |
| Messages | ❌ | ✅ From `messages` table |
| Approvals | ❌ | ✅ From `document_approvals` |
| Personal Files | ❌ | ✅ From `user_files` |

## Backend Endpoints Available

All in `src/php-setup/profile/`:
- `get-profile.php` - Fetch all profile data
- `update-profile.php` - Update profile sections
- `get-messages.php` - Load messages
- `send-message.php` - Send new messages
- `get-approvals.php` - Load document approvals
- `get-files.php` - Load personal files

## State Management

The component now has proper state for all data:

```typescript
const [approvals, setApprovals] = useState<Approval[]>(...);
const [personalFiles, setPersonalFiles] = useState<PersonalFile[]>(...);
const [jobInformation, setJobInformation] = useState<JobInformation[]>(...);
const [recentActivity, setRecentActivity] = useState<RecentActivity[]>(...);
const [compensationData, setCompensationData] = useState<CompensationData[]>(...);
const [messages, setMessages] = useState<Message[]>(...);
const [userProfile, setUserProfile] = useState(...);
```

## How It Works

### Mock Mode (Current)
```
User Views Profile
    ↓
Loads from src/data/profileData.ts
    ↓
Displays static mock data
```

### Backend Mode (After enabling)
```
User Views Profile
    ↓
useEffect triggers on mount
    ↓
Calls profileService.getProfile()
    ↓
PHP queries database
    ↓
Returns JSON
    ↓
Updates all state variables
    ↓
Displays real database data
```

## Troubleshooting

### Backend enabled but seeing mock data?
- Check console for errors
- Verify profileService import is uncommented
- Ensure `USE_PHP_BACKEND = true`
- Check PHP endpoint is accessible

### Getting authentication errors?
- Make sure you're logged in
- Check session cookies are enabled
- Verify CSRF token is initialized

### Data not saving?
- Check browser console for error messages
- Verify database tables exist
- Check PHP error logs
- Ensure user has proper permissions

## Environment Variables

Add to `.env`:
```env
VITE_API_URL=/php-setup
```

## Security Notes

All PHP endpoints include:
- ✅ Session authentication
- ✅ CSRF token protection
- ✅ SQL injection prevention
- ✅ Input sanitization
- ✅ Access control (user can only access own data)

## Need Help?

See detailed documentation:
- Full guide: `PROFILE_BACKEND_INTEGRATION.md`
- API reference: `src/php-setup/profile/README.md`
- Database schema: `src/php-setup/database/profile_schema.sql`
