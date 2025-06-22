# Student Course Enrollment System - API Documentation

## Overview

Welcome to the API for the Student Course Enrollment System. This RESTful service provides the backend logic for managing student course enrollments, with a core focus on preventing timetable conflicts. It supports distinct roles for students and college administrators.

This document details the essential endpoints required to interact with the system.

## Base URL

All API endpoints are prefixed with the following base URL:

```
http://localhost:3000/api
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. To access protected endpoints, you must first log in to receive an access token. Include this token in the `Authorization` header for all subsequent requests.

**Format**:
```
Authorization: Bearer <your_access_token>
```

## User Roles

The system has two primary user roles:
1.  **STUDENT**: Can enroll in courses from their college and view their schedule.
2.  **COLLEGE_ADMIN**: Can manage course timetables for their college.

---

## API Endpoints

### 1. Authentication

#### Register a New User
- **POST** `/auth/register`
- **Access**: Public
- **Description**: Creates a new user account, which can be either a student or a college admin.

**Request Body:**
```json
{
  "email": "jane.doe@student.edu",
  "password": "SecurePassword@123",
  "confirmPassword": "SecurePassword@123",
  "role": "student",
  "name": "Jane Doe",
  "collegeId": 1,
  "studentNumber": "TECH2024002"
}
```

#### Login a User
- **POST** `/auth/login`
- **Access**: Public
- **Description**: Authenticates a user and returns an access token and refresh token.

**Request Body:**
```json
{
  "email": "jane.doe@student.edu",
  "password": "SecurePassword@123"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 2,
      "email": "jane.doe@student.edu",
      "role": "STUDENT"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5c...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5c..."
  }
}
```

---

### 2. Student Enrollment

This is the core function required by the assignment.

#### Enroll in Courses
- **POST** `/enrollments`
- **Access**: `STUDENT` role required
- **Description**: Enrolls the authenticated student in one or more courses. This is an **atomic operation**: if any validation fails (e.g., timetable clash, invalid course, college mismatch), the entire enrollment process is aborted, and no changes are saved.

**Request Body:**
```json
{
  "courseIds": [1, 2]
}
```

**Success Response (201 Created):**
Indicates that the student was successfully enrolled in the new courses.
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
      },
      {
        "courseId": 2,
        "courseCode": "CS102",
        "courseName": "Data Structures"
      }
    ]
  }
}
```

**Error Response (409 Conflict - Timetable Clash):**
Returns a list of specific, detailed conflicts that prevented the enrollment.
```json
{
  "success": false,
  "message": "Cannot enroll: timetable clash detected",
  "errors": {
    "conflicts": [
      {
        "type": "EXTERNAL",
        "message": "Requested course CS103 (Mon 09:30-10:30) clashes with already enrolled course CS101 (Mon 09:00-10:00)."
      }
    ]
  }
}
```
---

### 3. Admin - Timetable Management (Bonus)

These endpoints fulfill the bonus requirement for admin functionality.

#### Add Timetable Slots to a Course
- **POST** `/admin/courses/:courseId/timetable`
- **Access**: `COLLEGE_ADMIN` role required
- **Description**: Adds one or more new time slots to a course. The system will prevent adding a slot if it conflicts with the course's existing schedule or clashes with the schedules of any students already enrolled in that course.

**Request Body:**
```json
[
  {
    "dayOfWeek": 5,
    "startTime": "14:00",
    "endTime": "15:30"
  }
]
```

#### Update a Timetable Slot
- **PATCH** `/admin/timetables/:timetableId`
- **Access**: `COLLEGE_ADMIN` role required
- **Description**: Modifies an existing timetable slot.

**Request Body:**
```json
{
  "startTime": "14:15",
  "endTime": "15:45"
}
```

#### Delete a Timetable Slot
- **DELETE** `/admin/timetables/:timetableId`
- **Access**: `COLLEGE_ADMIN` role required
- **Description**: Removes a timetable slot from a course.

---

## Error Responses

Failed API requests will return a standardized JSON error object.

**Standard Format:**
```json
{
  "success": false,
  "message": "A brief description of the error.",
  "errors": [
    {
      "field": "fieldName",
      "message": "Detailed error message."
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Common HTTP Status Codes:**
- `200 OK`: Request was successful.
- `201 Created`: Resource was successfully created.
- `204 No Content`: Request was successful, but there is no content to return (e.g., after a delete operation).
- `400 Bad Request`: The request was malformed (e.g., student and course from different colleges).
- `401 Unauthorized`: Authentication failed or token was not provided.
- `403 Forbidden`: The authenticated user does not have permission to access the resource.
- `404 Not Found`: The requested resource does not exist.
- `409 Conflict`: The request could not be completed due to a conflict (e.g., timetable clash).
- `422 Unprocessable Entity`: The request was well-formed but contained validation errors.
- `500 Internal Server Error`: An unexpected error occurred on the server.

## Testing with cURL

1.  **Login and get a token:**
    ```bash
    # Replace with your student's credentials
    curl -X POST http://localhost:3000/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"john.doe@student.edu","password":"Student@123"}'
    ```
    Copy the `accessToken` from the response.

2.  **Enroll in courses using the token:**
    ```bash
    # Replace <your_access_token> with the token from the login step
    export TOKEN="<your_access_token>"

    curl -X POST http://localhost:3000/api/enrollments \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{"courseIds": [1, 2]}'
    ```
