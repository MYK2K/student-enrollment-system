# Student Course Enrollment System - API Documentation

## Overview

The Student Course Enrollment System API is a RESTful web service that enables educational institutions to manage student course enrollments with automatic timetable clash detection. This API supports role-based access control with separate functionalities for students and college administrators.

## Base URL

```
Development: http://localhost:3000/api
Production: https://api.studentenrollment.com/api
```

## Authentication

The API uses JWT (JSON Web Token) based authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## User Roles

1. **Student**: Can view courses, enroll/drop courses, and manage their profile
2. **College Admin**: Can manage courses, timetables, and students for their college

## API Endpoints

### Authentication

#### Register User
- **POST** `/auth/register`
- **Access**: Public
- **Description**: Register a new student or admin user

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass@123",
  "confirmPassword": "SecurePass@123",
  "role": "student",
  "name": "John Doe",
  "collegeId": 1,
  "studentNumber": "STU001" // Required for students
}
```

#### Login
- **POST** `/auth/login`
- **Access**: Public
- **Description**: Authenticate user and receive tokens

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass@123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "student"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "tokenType": "Bearer",
    "expiresIn": "7d"
  }
}
```

### Student Endpoints

#### Get Profile
- **GET** `/students/profile`
- **Access**: Student only
- **Description**: Get current student's profile information

#### Get Enrolled Courses
- **GET** `/students/courses`
- **Access**: Student only
- **Query Parameters**: `page`, `limit`
- **Description**: Get paginated list of enrolled courses

#### Get Available Courses
- **GET** `/students/available-courses`
- **Access**: Student only
- **Query Parameters**: `page`, `limit`, `search`
- **Description**: Get courses available for enrollment from student's college

#### Get Timetable
- **GET** `/students/timetable`
- **Access**: Student only
- **Description**: Get weekly timetable with all enrolled courses

### Enrollment Endpoints

#### Enroll in Courses
- **POST** `/enrollments`
- **Access**: Student only
- **Description**: Enroll in multiple courses with automatic clash detection

**Request Body:**
```json
{
  "courseIds": [1, 2, 3]
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Enrollment successful",
  "data": {
    "enrolled": [
      {
        "courseId": 1,
        "courseCode": "CS101",
        "courseName": "Introduction to Programming"
      }
    ],
    "failed": []
  }
}
```

**Response (With Conflicts):**
```json
{
  "success": false,
  "message": "Timetable clash detected",
  "errors": {
    "conflicts": [
      {
        "message": "CS102 conflicts with CS101 on Monday from 09:00-10:00 overlaps with 09:30-10:30"
      }
    ]
  }
}
```

#### Check Timetable Conflicts
- **POST** `/enrollments/check-conflicts`
- **Access**: Student only
- **Description**: Check for conflicts before enrollment

#### Drop Enrollment
- **DELETE** `/enrollments/:enrollmentId`
- **Access**: Student only
- **Description**: Drop a course enrollment

### Course Endpoints

#### Get All Courses
- **GET** `/courses`
- **Access**: Public
- **Query Parameters**: `page`, `limit`, `search`, `collegeId`
- **Description**: Get paginated list of courses

#### Get Course Details
- **GET** `/courses/:courseId`
- **Access**: Public
- **Description**: Get detailed information about a course

#### Get Course Timetable
- **GET** `/courses/:courseId/timetable`
- **Access**: Public
- **Description**: Get timetable for a specific course

### Admin Endpoints

#### Dashboard Statistics
- **GET** `/admin/dashboard`
- **Access**: College Admin only
- **Description**: Get dashboard statistics for the admin's college

#### Create Course
- **POST** `/admin/courses`
- **Access**: College Admin only
- **Description**: Create a new course

**Request Body:**
```json
{
  "code": "CS301",
  "name": "Database Systems",
  "description": "Introduction to database design"
}
```

#### Update Course
- **PUT** `/admin/courses/:courseId`
- **Access**: College Admin only
- **Description**: Update course details

#### Delete Course
- **DELETE** `/admin/courses/:courseId`
- **Access**: College Admin only
- **Description**: Delete a course (only if no students enrolled)

#### Manage Timetable
- **POST** `/admin/timetables`
- **Access**: College Admin only
- **Description**: Create or update course timetable

**Request Body:**
```json
{
  "courseId": 1,
  "timetable": [
    {
      "dayOfWeek": 1,
      "startTime": "09:00",
      "endTime": "10:30"
    },
    {
      "dayOfWeek": 3,
      "startTime": "09:00",
      "endTime": "10:30"
    }
  ]
}
```

#### Get Students
- **GET** `/admin/students`
- **Access**: College Admin only
- **Query Parameters**: `page`, `limit`, `search`
- **Description**: Get list of students in admin's college

#### Bulk Import Students
- **POST** `/admin/students/bulk-import`
- **Access**: College Admin only
- **Description**: Import multiple students at once

**Request Body:**
```json
{
  "students": [
    {
      "email": "student1@college.edu",
      "name": "Student One",
      "studentNumber": "STU001"
    }
  ],
  "defaultPassword": "TempPass@123"
}
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (e.g., timetable clash)
- `422` - Validation Error
- `500` - Internal Server Error

## Rate Limiting

API requests are limited to 100 requests per 15-minute window per IP address.

## Pagination

Paginated endpoints support these query parameters:
- `page` (default: 1)
- `limit` (default: 20, max: 100)

Response includes pagination metadata:
```json
{
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

## Testing

### Using Postman

1. Import the Postman collection from `docs/postman/collection.json`
2. Set up environment variables:
   - `baseUrl`: API base URL
   - `accessToken`: Will be set automatically after login
3. Run the "Login" request first to authenticate

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.edu","password":"Student@123"}'

# Get courses (with auth)
curl -X GET http://localhost:3000/api/students/courses \
  -H "Authorization: Bearer <access_token>"
```

## Best Practices

1. **Authentication**: Always include the access token for protected endpoints
2. **Error Handling**: Check the `success` field in responses
3. **Pagination**: Use pagination for list endpoints to improve performance
4. **Validation**: Validate input on client-side to reduce server errors
5. **Timetable Conflicts**: Use the conflict check endpoint before enrollment

## Support

For API support or bug reports, please contact:
- Email: support@studentenrollment.com
- Documentation: https://docs.studentenrollment.com
