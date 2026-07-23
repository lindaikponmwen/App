# API Configuration Guide

## Quick Setup

To connect the React frontend to your PHP backend, you need to configure the API base URL.

## Configuration Location

The API configuration is in: `src/services/projectService.ts`

```typescript
const API_BASE_URL = 'http://localhost/php-setup';
```

## Configuration Options

### Option 1: Local Development (Default)
If your PHP files are in your web server's root:
```typescript
const API_BASE_URL = 'http://localhost/php-setup';
```

### Option 2: Custom Port
If your PHP server runs on a different port:
```typescript
const API_BASE_URL = 'http://localhost:8080/php-setup';
```

### Option 3: Remote Server
For production or remote development:
```typescript
const API_BASE_URL = 'https://yourdomain.com/php-setup';
```

### Option 4: Environment Variables
For better configuration management, create a `.env` file:

**.env**
```env
VITE_API_BASE_URL=http://localhost/php-setup
```

Then update `projectService.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/php-setup';
```

## CORS Configuration

The PHP backend is configured to accept requests from:
- `http://localhost:5173` (Vite dev server)
- The origin from the HTTP_ORIGIN header

If you need to add more origins, update each PHP file's CORS headers:

```php
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173'));
```

## Testing the Connection

1. **Start your PHP server** (Apache/Nginx with PHP)
2. **Start the React dev server**: `npm run dev`
3. **Open the browser console** (F12)
4. **Go to the Projects page**
5. **Enable "Load from Database"** checkbox
6. **Check the Network tab** for API requests

### Successful Connection
You should see:
- Status 200 responses
- JSON data in the response
- Projects loaded in the UI

### Failed Connection
Common issues:
- **CORS Error**: Configure CORS headers in PHP
- **404 Error**: Check API_BASE_URL path
- **500 Error**: Check PHP error logs
- **401 Error**: User not authenticated

## Database Setup

Before using the API, ensure:

1. **Database exists** and is configured in `php-setup/config/database.php`
2. **Tables are created** using `php-setup/database/projects_schema.sql`
3. **User is logged in** with an active session

## Authentication Flow

The API uses session-based authentication:

1. User logs in via `php-setup/auth/login.php`
2. Session is created and stored
3. All project API calls include session cookie
4. Session is validated on each request

## Security Notes

### CSRF Protection
- CSRF tokens are required for create/update/delete operations
- Tokens are automatically managed by the frontend
- Tokens are stored in sessionStorage

### Session Management
- Sessions expire after inactivity
- Users are redirected to login when session expires
- Session timeout is configurable in database

### Data Validation
- All inputs are sanitized server-side
- Prepared statements prevent SQL injection
- XSS protection via output encoding

## Troubleshooting

### "Failed to fetch" Error
**Problem**: Network request fails before reaching server

**Solutions**:
- Check if PHP server is running
- Verify API_BASE_URL is correct
- Check browser console for details
- Test PHP endpoint directly in browser

### "Unauthorized" (401)
**Problem**: User session is invalid or expired

**Solutions**:
- Log in again
- Check session cookies are enabled
- Verify session hasn't timed out
- Clear browser cookies and re-login

### "Forbidden" (403)
**Problem**: CSRF token invalid or insufficient permissions

**Solutions**:
- Clear sessionStorage and reload
- Verify user has correct role
- Check project membership

### "Not Found" (404)
**Problem**: PHP endpoint doesn't exist at URL

**Solutions**:
- Verify file exists in php-setup folder
- Check .htaccess configuration
- Confirm web server document root
- Test URL directly in browser

### Empty Response
**Problem**: PHP returns empty or malformed JSON

**Solutions**:
- Check PHP error logs
- Enable error reporting in PHP
- Test endpoint with tools like Postman
- Verify database connection

## Production Deployment

For production environments:

1. **Update API_BASE_URL** to production domain
2. **Enable HTTPS** for secure communication
3. **Update CORS origins** to production domain
4. **Enable error logging** (disable display_errors)
5. **Set secure session cookies** (httponly, secure, samesite)
6. **Use environment variables** for sensitive config
7. **Implement rate limiting** to prevent abuse
8. **Add monitoring** for API performance

## API Endpoints Summary

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/project1/list.php` | GET | Get all user projects | Yes |
| `/project1/get.php` | GET | Get project by ID | Yes |
| `/project1/create.php` | POST | Create new project | Yes + CSRF |
| `/project1/update.php` | PUT | Update project | Yes + CSRF |
| `/project1/delete.php` | DELETE | Delete project | Yes + CSRF |

## Additional Resources

- **PHP Setup Guide**: See `PHP_ENABLE_STEPS.md`
- **Database Schema**: See `php-setup/database/projects_schema.sql`
- **Backend Integration**: See `PROJECT_DATABASE_INTEGRATION.md`
- **Profile Backend**: See `PROFILE_BACKEND_INTEGRATION.md`

## Support

If you encounter issues:
1. Check browser console for errors
2. Review PHP error logs
3. Test API endpoints with curl or Postman
4. Verify database connection and permissions
5. Ensure all PHP extensions are installed
