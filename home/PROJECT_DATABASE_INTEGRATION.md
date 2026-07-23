# Project Database Integration Guide

This guide explains how the React application integrates with the PHP backend for secure project management.

## Overview

The application now supports loading, creating, editing, and deleting projects directly from the PHP/MySQL database. Users can toggle between using mock data and real database data.

## Architecture

### Frontend Components
- **projectService.ts**: Central service for all project-related API calls
- **ProjectsPage.tsx**: Lists all projects with search and filtering
- **Dashboard.tsx**: Shows the most recent project
- **NewProjectModal.tsx**: Creates new projects

### Backend Endpoints
All endpoints are located in `/php-setup/project1/`:
- **list.php**: GET all projects for the current user
- **get.php**: GET a specific project by ID
- **create.php**: POST create a new project
- **update.php**: PUT update an existing project
- **delete.php**: DELETE remove a project

## Features

### 1. Load Projects from Database

Both the Dashboard and Projects page have a "Load from Database" checkbox:
- When checked, projects are fetched from the PHP backend
- When unchecked, mock data is displayed
- Loading states and error handling are built-in

### 2. Create New Projects

The "Create New Project" modal includes a "Save to Database" option:
- When checked, the project is saved to the database via API
- When unchecked, the project is saved to localStorage
- CSRF tokens are automatically managed for security

### 3. Security Features

All API calls include:
- Session-based authentication
- CSRF token validation
- Credentials included in requests
- Row-level security via project membership

### 4. Data Validation

Projects include:
- Title (required)
- Description
- Status (active, completed, paused)
- Start and end dates
- Team members
- Keywords
- Analysis types

## API Configuration

The API base URL is configured in `projectService.ts`:
```typescript
const API_BASE_URL = 'http://localhost/php-setup';
```

**Important**: Update this URL based on your PHP server configuration.

## Database Schema

Projects are stored in the following tables:
- **projects**: Core project information
- **project_members**: User access and roles
- **project_keywords**: Search keywords
- **project_analysis_types**: Analysis type tags
- **project_files**: Uploaded files
- **project_activity_log**: Audit trail

## Usage Examples

### Loading Projects
```typescript
// Get all projects for the current user
const projects = await projectService.getAllProjects();

// Get a specific project
const project = await projectService.getProjectById(123);

// Get the most recent project
const recent = await projectService.getMostRecentProject();
```

### Creating Projects
```typescript
const newProject = await projectService.createProject({
  title: 'Phase II Clinical Trial',
  description: 'Pharmacokinetic analysis study',
  status: 'active',
  startDate: '2024-01-15',
  endDate: '2024-12-31',
  selectedMembers: [1, 2, 3],
  keywords: ['pk', 'clinical', 'phase2'],
  analysisTypes: ['Population PK', 'Safety Analysis']
});
```

### Updating Projects
```typescript
const success = await projectService.updateProject({
  id: 123,
  title: 'Updated Title',
  status: 'completed'
});
```

### Deleting Projects
```typescript
const success = await projectService.deleteProject(123);
```

## Error Handling

The service includes comprehensive error handling:
- Network errors are caught and logged
- Failed requests fall back to mock data
- User-friendly error messages are displayed
- Loading states prevent duplicate requests

## Performance Optimizations

The backend includes:
- Query result caching (5-minute TTL)
- ETag support for conditional requests
- Response compression
- Optimized SQL queries with proper indexes
- Rate limiting to prevent abuse

## Security Considerations

### Authentication
- All endpoints require active user session
- Session validation on every request
- Automatic session timeout

### Authorization
- Users can only access projects they're members of
- Role-based permissions (owner, member, viewer)
- Owner-only operations (delete, member management)

### Data Protection
- Input sanitization on all user data
- SQL injection prevention via prepared statements
- CSRF token validation on state-changing operations
- Secure headers applied to all responses

## Testing the Integration

1. **Start the PHP server** with the database configured
2. **Open the application** in your browser
3. **Navigate to Projects page**
4. **Check "Load from Database"** to fetch real data
5. **Create a new project** with "Save to Database" checked
6. **Verify the project** appears in the database

## Troubleshooting

### Projects Not Loading
- Check the browser console for network errors
- Verify the API_BASE_URL is correct
- Ensure the PHP server is running
- Check database connection in PHP

### Authentication Errors
- Ensure you're logged in
- Check session is active
- Verify cookies are enabled

### CSRF Token Errors
- Tokens are stored in sessionStorage
- Clear sessionStorage if issues persist
- Ensure credentials are included in requests

## Future Enhancements

Potential improvements:
- Real-time updates via WebSockets
- Offline support with service workers
- Bulk project operations
- Advanced filtering and sorting
- Project templates
- File upload integration
- Activity timeline visualization

## API Reference

### GET /project1/list.php
Returns all projects for the authenticated user.

**Response:**
```json
{
  "success": true,
  "projects": [
    {
      "id": 1,
      "title": "Project Name",
      "description": "Description",
      "status": "active",
      "startDate": "2024-01-15",
      "endDate": "2024-12-31",
      "members": [...],
      "keywords": [...],
      "analysisTypes": [...],
      "fileCount": 5
    }
  ]
}
```

### GET /project1/get.php?id=123
Returns detailed information for a specific project.

### POST /project1/create.php
Creates a new project.

**Request Body:**
```json
{
  "title": "New Project",
  "description": "Description",
  "startDate": "2024-01-15",
  "selectedMembers": [1, 2, 3],
  "keywords": ["keyword1", "keyword2"],
  "analysisTypes": ["Analysis Type 1"]
}
```

### PUT /project1/update.php
Updates an existing project.

### DELETE /project1/delete.php
Deletes a project (owner only).

**Request Body:**
```json
{
  "id": 123
}
```

## Support

For issues or questions:
1. Check the browser console for error messages
2. Review PHP error logs
3. Verify database connection and schema
4. Ensure all required PHP extensions are installed
