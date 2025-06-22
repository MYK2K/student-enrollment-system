# Student Course Enrollment System

A comprehensive backend system for managing student course enrollments with features like timetable clash detection, role-based access control, and college-specific management.

## 🚀 Features

- **User Authentication**: JWT-based authentication with refresh tokens
- **Role-Based Access Control**: Student and College Admin roles
- **Course Management**: Create and manage courses with timetables
- **Smart Enrollment**: Automatic timetable clash detection
- **College Isolation**: Students can only enroll in courses from their college
- **RESTful API**: Clean, well-documented API endpoints
- **Security**: Helmet, CORS, rate limiting, and input validation

## 🛠 Tech Stack

- **Runtime**: Node.js 22.16+
- **Framework**: Express.js
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT
- **Package Manager**: Yarn 4
- **Testing**: Jest
- **Linting**: ESLint with Airbnb config
- **Logging**: Winston

## 📋 Prerequisites

- Node.js 22.16 or higher
- MySQL 8.0 or higher
- Yarn 4 (via Corepack)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd student-enrollment-system
   ```

2. **Enable Corepack and install dependencies**
   ```bash
   corepack enable
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Create database
   mysql -u root -p -e "CREATE DATABASE student_enrollment_db;"
   
   # Run migrations
   yarn prisma migrate dev
   
   # Seed the database (optional)
   yarn prisma:seed
   ```

## 🏃‍♂️ Running the Application

### Development
```bash
# Using Node.js native watch mode
yarn dev

# Using Nodemon
yarn dev:nodemon
```

### Production
```bash
yarn start
```

## 📁 Project Structure

```
student-enrollment-system/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middlewares/    # Express middlewares
│   ├── models/         # Database models (Prisma)
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   ├── validators/     # Request validators
│   └── app.js         # Express app setup
├── prisma/
│   ├── schema.prisma  # Database schema
│   └── migrations/    # Database migrations
├── tests/             # Test files
├── docs/              # Documentation
└── server.js          # Entry point
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Students
- `GET /api/students/profile` - Get student profile
- `GET /api/students/courses` - Get enrolled courses
- `GET /api/students/available-courses` - Get available courses

### Enrollments
- `POST /api/enrollments` - Enroll in courses
- `GET /api/enrollments` - Get student enrollments
- `DELETE /api/enrollments/:id` - Drop enrollment

### Courses
- `GET /api/courses` - List all courses
- `GET /api/courses/:id` - Get course details
- `GET /api/courses/:id/timetable` - Get course timetable

### Admin
- `POST /api/admin/courses` - Create course
- `PUT /api/admin/courses/:id` - Update course
- `DELETE /api/admin/courses/:id` - Delete course
- `POST /api/admin/timetables` - Create/update timetable
- `GET /api/admin/students` - List college students

## 🧪 Testing

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage
```

## 📝 Database Schema

- **users**: Authentication data
- **students**: Student profiles
- **colleges**: College information
- **courses**: Course details
- **timetables**: Course schedules
- **enrollments**: Student-course associations
- **college_admins**: Admin profiles

## 🔐 Environment Variables

See `.env.example` for all required environment variables:
- Database connection
- JWT secrets
- Server configuration
- Rate limiting settings

## 📚 API Documentation

API documentation is available in OpenAPI 3.1.0 format at `docs/api/openapi.yaml`.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.
