# Profile API Endpoints

This directory contains secure PHP endpoints for managing user profile data.

## Overview

The profile endpoints provide complete profile management functionality including:
- Personal information retrieval and updates
- Job information and history
- Activity tracking
- Compensation data
- Internal messaging
- Document approvals
- Personal file management

## Endpoints

### 1. Get Profile Data
**File:** `get-profile.php`
**Method:** GET
**Authentication:** Required
**Description:** Returns complete profile data including personal info, job information, activity, and compensation.

**Response:**
```json
{
  "success": true,
  "profile": {
    "id": "1",
    "name": "John Doe",
    "email": "john@example.com",
    "personalInfo": { ... },
    "professionalInfo": { ... }
  },
  "jobInformation": [...],
  "recentActivity": [...],
  "compensationData": [...]
}
```

### 2. Update Profile
**File:** `update-profile.php`
**Method:** POST
**Authentication:** Required
**CSRF Protection:** Required
**Description:** Updates specific sections of the user profile.

**Request Body:**
```json
{
  "section": "contact|address|employee|avatar",
  "phone": "(555) 123-4567",
  "email": "john@example.com"
}
```

**Supported Sections:**
- `contact` - Phone and email
- `address` - Physical address, city, state, postcode
- `employee` - Date of birth, national ID, title, hire date
- `avatar` - Profile picture URL

### 3. Get Messages
**File:** `get-messages.php`
**Method:** GET
**Authentication:** Required
**Query Parameters:**
- `conversation_id` (optional) - Filter by specific conversation
- `limit` (optional, default: 50) - Number of messages to return
- `offset` (optional, default: 0) - Pagination offset

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": 1,
      "sender": {
        "id": "2",
        "name": "Jane Smith",
        "initials": "JS"
      },
      "content": "Message text",
      "timestamp": "2025-01-15T10:30:00",
      "isRead": false
    }
  ]
}
```

### 4. Send Message
**File:** `send-message.php`
**Method:** POST
**Authentication:** Required
**CSRF Protection:** Required
**Description:** Sends a message to another user.

**Request Body:**
```json
{
  "recipientId": "2",
  "content": "Your message here"
}
```

### 5. Get Approvals
**File:** `get-approvals.php`
**Method:** GET
**Authentication:** Required
**Description:** Returns all document approvals for the current user.

**Response:**
```json
{
  "success": true,
  "approvals": [
    {
      "id": 1,
      "document": "Phase I Study Protocol",
      "project": "Drug Absorption Study",
      "status": "approved|pending|rejected",
      "approver": "Dr. Alex Foster",
      "date": "2025-01-14T14:30:00",
      "comments": "Approval comments"
    }
  ]
}
```

### 6. Get Personal Files
**File:** `get-files.php`
**Method:** GET
**Authentication:** Required
**Description:** Returns all personal files uploaded by the user.

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "id": 1,
      "name": "CV_2025.pdf",
      "type": "PDF",
      "size": "2.4 MB",
      "category": "Professional",
      "path": "/uploads/...",
      "modified": "2025-01-10T10:30:00"
    }
  ]
}
```

## Security Features

All endpoints implement the following security measures:

1. **Authentication**: Session-based authentication required
2. **CSRF Protection**: All POST/PUT/DELETE requests require valid CSRF token
3. **Input Validation**: All user input is sanitized and validated
4. **Prepared Statements**: SQL injection prevention
5. **Access Control**: Users can only access their own data
6. **Error Handling**: Secure error messages without exposing sensitive info

## Database Schema

The profile endpoints require the following database tables:
- `users` - Extended with profile columns
- `user_job_info` - Job history and information
- `user_activity` - Activity tracking
- `user_compensation` - Compensation history
- `messages` - Internal messaging
- `document_approvals` - Document workflow tracking
- `user_files` - File metadata

See `../database/profile_schema.sql` for complete schema.

## Integration with React

To integrate with the React frontend:

1. Uncomment the PHP backend integration code in:
   - `src/components/ProfilePage.tsx`
   - `src/data/profileData.ts`

2. Configure environment variable:
   ```
   VITE_API_URL=/php-setup
   ```

3. Ensure PHP session cookies are enabled:
   - The endpoints use `credentials: 'include'` for cookie-based sessions
   - Configure your PHP backend to allow CORS with credentials if needed

## Error Responses

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad request (invalid input)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (Invalid CSRF token. Refresh the page and try again.)
- `404` - Not found
- `500` - Server error

## Testing

Test the endpoints using:

1. **Browser DevTools**: Monitor network requests
2. **Postman**: Test individual endpoints with proper session cookies
3. **Unit Tests**: Use PHPUnit for automated testing

## Notes

- All timestamps are in ISO 8601 format
- File uploads are handled separately (not covered in these endpoints)
- Profile pictures should be stored in a secure upload directory
- Message content should be sanitized to prevent XSS
- Implement rate limiting for message sending in production
