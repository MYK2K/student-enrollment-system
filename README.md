# Student Course Enrollment System

This project is a backend system for a student course enrollment platform, built with Node.js, Express, and Prisma. It fulfills the requirements of the Backend Development Assignment, including database design, a course selection save operation, and bonus admin functionality.

The system allows students to enroll in courses from their college and ensures that there are no timetable conflicts. It also provides administrative functions for managing course timetables, with built-in checks to prevent clashes for already enrolled students.

## Tech Stack

- **Runtime**: Node.js (v22+)
- **Framework**: Express.js
- **Database**: MySQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: `express-validator`

## Features

- **Database Schema**: A well-defined schema for managing Colleges, Students, Courses, Timetables, and Enrollments.
- **Student Enrollment**: A core API endpoint for students to enroll in multiple courses.
- **Timetable Clash Detection**: The system automatically prevents a student from enrolling in courses with overlapping time slots.
- **College Scoping**: Students can only enroll in courses offered by their own college. This is enforced at both the application and database level (via a trigger).
- **Admin Functionality (Bonus)**: Endpoints for administrators to manage course timetables.
- **Enrollment Protection (Bonus)**: Prevents admins from making timetable changes that would cause conflicts for currently enrolled students.
- **Role-Based Access**: Differentiates between `STUDENT` and `COLLEGE_ADMIN` roles to secure endpoints.

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd student-enrollment-system
    ```

2.  **Install dependencies:**
    ```bash
    yarn install
    ```

3.  **Set up environment variables:**
    Copy `.env.example` to `.env` and fill in your database credentials and JWT secrets.
    ```bash
    cp .env .env
    ```

4.  **Set up the database:**
    This command will create the database, apply migrations, and generate the Prisma client.
    ```bash
    yarn setup:db
    ```

5.  **Seed the database with sample data (optional but recommended):**
    This will create sample colleges, students, admins, and courses.
    ```bash
    yarn prisma:seed
    ```

## Running the Application

-   **For development (with watch mode):**
    ```bash
    yarn dev
    ```
-   **For production:**
    ```bash
    yarn start
    ```

The API will be available at `http://localhost:3000`.

## API Endpoints

The primary endpoints are:

-   `POST /api/auth/register`: Register a new student or admin.
-   `POST /api/auth/login`: Log in to get an access token.
-   `POST /api/enrollments`: **(Student Role)** Enroll in a list of courses. This is the main function required by the assignment.
    -   **Body**: `{ "courseIds": [1, 2] }`
-   `POST /api/admin/courses/:courseId/timetable`: **(Admin Role)** Add timetable slots to a course.
-   `PATCH /api/admin/timetables/:timetableId`: **(Admin Role)** Update a specific timetable slot.
-   `DELETE /api/admin/timetables/:timetableId`: **(Admin Role)** Delete a timetable slot.

For detailed request/response examples, please see the [API Documentation](./docs/api/README.md) and the [Postman Collection](./docs/postman/collection.json).

