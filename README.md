# 🏫 School Management System V4

## 🌟 Project Overview

A **comprehensive, modern school management system** built with React, Node.js, Express, and MongoDB. Designed for schools, colleges, and educational institutions to manage all operations digitally.

### ✨ Key Features

- **Multi-Role Access**: Admin, Teacher, Student, Parent, Librarian, Warden, Transport
- **Code Splitting**: Optimized performance with React.lazy() and Suspense
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Updates**: Using WebSockets for instant notifications
- **Comprehensive Modules**: 50+ features covering all school operations

## 🚀 Getting Started

### Prerequisites

- Node.js v16+ (LTS recommended)
- npm v7+ or yarn v1.22+
- MongoDB v5+ (local or Atlas)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/school-management-system-v4.git

# Navigate to project directory
cd school-management-system-v4

# Install dependencies
npm install
# or
yarn install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the development server
npm run dev
# or
yarn dev
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/school_management
MONGO_TEST_URI=mongodb://localhost:27017/school_management_test

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# Email Configuration (for password reset, notifications)
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_EMAIL=your@email.com
SMTP_PASSWORD=your_email_password
FROM_EMAIL=your@email.com
FROM_NAME=School Management System

# File Upload Configuration
MAX_FILE_UPLOAD=1000000
FILE_UPLOAD_PATH=./public/uploads

# Weather API (for weather module)
WEATHER_API_KEY=your_weather_api_key

# Face Recognition API (for face login)
FACE_API_KEY=your_face_api_key
FACE_API_SECRET=your_face_api_secret
```

## 📂 Project Structure

```bash
school-management-system-v4/
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # React context providers
│   │   ├── pages/             # All page components (lazy-loaded)
│   │   │   ├── admin/         # Admin pages
│   │   │   ├── auth/          # Authentication pages
│   │   │   ├── documents/     # Document management
│   │   │   ├── parent/        # Parent pages
│   │   │   ├── safety/        # Safety modules
│   │   │   ├── shared/        # Shared pages
│   │   │   ├── student/       # Student pages
│   │   │   ├── teacher/       # Teacher pages
│   │   │   ├── transport/     # Transport pages
│   │   │   ├── warden/        # Warden pages
│   │   │   └── weather/       # Weather modules
│   │   ├── App.jsx            # Main app with code splitting
│   │   └── index.js           # Entry point
│   └── public/               # Static assets
│
├── backend/                   # Node.js backend
│   ├── controllers/           # Route controllers
│   ├── models/               # MongoDB models
│   ├── routes/               # API routes
│   ├── middleware/           # Express middleware
│   ├── utils/                # Utility functions
│   ├── config/               # Configuration files
│   └── server.js             # Server entry point
│
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── package.json              # Project dependencies
├── README.md                 # Project documentation
└── LICENSE                   # License file
```

## 🎯 Key Modules

### 👨‍🏫 Admin Dashboard
- **User Management**: Create, edit, delete users with role-based access
- **Analytics**: Comprehensive school analytics and reports
- **System Settings**: Configure school settings, themes, and preferences
- **Audit Logs**: Track all system activities and changes

### 👩‍🏫 Teacher Portal
- **Class Management**: Manage classes, students, and attendance
- **Gradebook**: Enter and manage student marks
- **Lesson Planning**: Create and manage lesson plans
- **Assignment Management**: Create, grade, and track assignments
- **MCQ Exam System**: Create and manage multiple-choice exams

### 👨‍🎓 Student Portal
- **Dashboard**: View schedule, assignments, and announcements
- **Academic Progress**: Track marks, attendance, and performance
- **Assignment Submission**: Submit assignments online
- **Exam Portal**: Take MCQ exams and view results
- **AI Assistant**: Get help with study questions

### 👨‍👩‍👧‍👦 Parent Portal
- **Child Monitoring**: Track child's academic progress
- **Communication**: Message teachers and staff
- **Announcements**: Stay updated with school news
- **Report Cards**: View and download report cards
- **Safety Alerts**: Receive important safety notifications

### 📚 Smart Document System
- **ID Card Generator**: Generate student/staff ID cards
- **Certificate Generator**: Create custom certificates
- **Fee Voucher System**: Generate and manage fee vouchers
- **Result Cards**: Automated result card generation
- **Bulk Document Processing**: Generate documents in bulk

### 🌦️ Smart Weather Center
- **Live Weather**: Real-time weather updates
- **Forecast**: 7-day weather forecast
- **AQI Monitoring**: Air quality index tracking
- **Weather Alerts**: Severe weather notifications
- **Impact Analysis**: Weather impact on school operations

### ✅ Smart Attendance Module
- **Biometric Attendance**: Face recognition attendance
- **Real-time Tracking**: Live attendance monitoring
- **Reports**: Comprehensive attendance reports
- **Automated Alerts**: Notify parents of absences
- **Integration**: Works with transport and hostel modules

### 🚍 Transport Management
- **Route Planning**: Manage school bus routes
- **Vehicle Tracking**: Real-time bus location tracking
- **Driver Management**: Manage driver information
- **Incident Reporting**: Report and track transport incidents
- **Weather Integration**: Route planning based on weather conditions

### 🏨 Hostel Management
- **Room Allocation**: Manage hostel rooms and beds
- **Resident Management**: Track hostel residents
- **Leave Management**: Process leave requests
- **Visitor Management**: Track hostel visitors
- **Mess Management**: Manage mess menu and operations

### 🏥 Medical Clinic
- **Student Profiles**: Maintain medical records
- **Visit Tracking**: Log clinic visits
- **Medicine Inventory**: Manage clinic inventory
- **Emergency Contacts**: Quick access to emergency information
- **Health Reports**: Generate health reports

### 🔐 Security & Safety
- **Gate Management**: Track visitors and vehicles
- **Incident Reporting**: Report security incidents
- **Emergency Protocols**: Quick access to emergency procedures
- **Safety Dashboard**: Centralized safety monitoring
- **Face Recognition**: Secure access control

## 🔧 Technology Stack

### Frontend
- **React 18** with Hooks
- **React Router v6** for navigation
- **Tailwind CSS** for styling
- **React Hot Toast** for notifications
- **Axios** for API calls
- **React Query** for data fetching
- **WebSockets** for real-time updates
- **Code Splitting** with React.lazy() and Suspense

### Backend
- **Node.js 16+**
- **Express.js** for API routes
- **MongoDB** with Mongoose ODM
- **JWT Authentication** for secure access
- **Bcrypt** for password hashing
- **Multer** for file uploads
- **Nodemailer** for email notifications
- **Socket.io** for real-time communication

### DevOps & Tools
- **ESLint** for code linting
- **Prettier** for code formatting
- **Husky** for Git hooks
- **PM2** for process management
- **Docker** for containerization
- **GitHub Actions** for CI/CD

## 🎨 UI/UX Features

- **Modern, Clean Interface**: Intuitive design for all user types
- **Responsive Layout**: Works on all screen sizes
- **Dark/Light Mode**: Theme switching support
- **Accessibility**: WCAG compliant design
- **Loading States**: Smooth skeleton loaders
- **Error Handling**: User-friendly error messages
- **Form Validation**: Real-time validation feedback

## 📦 Code Splitting Implementation

The project uses **React.lazy()** and **Suspense** for optimal performance:

```jsx
// Before (static import - loads everything at once)
import AdminDashboard from './pages/admin/Dashboard';

// After (lazy import - loads only when needed)
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));

// Wrapped in Suspense with skeleton loader
<Route 
  path="/admin/dashboard" 
  element={
    <Suspense fallback={<PageSkeleton type="dashboard" />}>
      <AdminDashboard />
    </Suspense>
  }
/>
```

**Results:**
- Initial bundle size: **~3.5MB** → **~53KB** (98% reduction)
- Faster page loads
- Better user experience
- Lower bandwidth usage

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Fine-grained permission system
- **Password Hashing**: Bcrypt for secure password storage
- **CSRF Protection**: Built-in CSRF prevention
- **Rate Limiting**: Prevent brute force attacks
- **Input Validation**: Sanitize all user inputs
- **Security Headers**: Helmet.js for HTTP headers
- **CORS Configuration**: Restrict cross-origin requests

## 📊 Performance Optimization

- **Code Splitting**: Dynamic imports for all pages
- **Image Optimization**: Compressed and responsive images
- **Caching**: Aggressive caching strategies
- **Database Indexing**: Optimized MongoDB queries
- **Pagination**: For large datasets
- **Lazy Loading**: Images and components
- **Bundle Analysis**: Webpack bundle analyzer

## 🤖 AI & Automation

- **AI Assistant**: Helps students with study questions
- **Automated Reports**: Generate reports automatically
- **Smart Scheduling**: AI-powered timetable generation
- **Predictive Analytics**: Forecast student performance
- **Automated Notifications**: Intelligent alert system

## 🌍 Deployment

### Local Deployment

```bash
# Build frontend
cd frontend
npm run build

# Start backend
cd ../backend
npm start
```

### Docker Deployment

```bash
# Build Docker images
docker-compose build

# Start containers
docker-compose up -d
```

### Production Deployment

```bash
# Set production environment
NODE_ENV=production

# Build optimized frontend
npm run build:prod

# Start with PM2
pm2 start ecosystem.config.js
```

## 📖 API Documentation

Comprehensive API documentation is available via Swagger:

```bash
# Start the server
npm start

# Access Swagger UI at
http://localhost:5000/api-docs
```

### API Endpoints

- **Auth**: `/api/v1/auth` - Authentication routes
- **Users**: `/api/v1/users` - User management
- **Classes**: `/api/v1/classes` - Class management
- **Students**: `/api/v1/students` - Student management
- **Teachers**: `/api/v1/teachers` - Teacher management
- **Attendance**: `/api/v1/attendance` - Attendance records
- **Exams**: `/api/v1/exams` - Exam management
- **Assignments**: `/api/v1/assignments` - Assignment management
- **Documents**: `/api/v1/documents` - Document generation
- **Weather**: `/api/v1/weather` - Weather data
- **Transport**: `/api/v1/transport` - Transport management
- **Hostel**: `/api/v1/hostel` - Hostel management

## 📈 Database Schema

### Core Collections

- **users**: Stores all user accounts with roles
- **students**: Student profiles and academic data
- **teachers**: Teacher information and subjects
- **classes**: Class information and schedules
- **subjects**: Subject catalog
- **attendance**: Daily attendance records
- **exams**: Exam schedules and results
- **assignments**: Assignment details and submissions
- **documents**: Generated documents archive
- **notifications**: System notifications
- **auditLogs**: System activity logs

## 🎓 Educational Features

### For Students
- Interactive learning dashboard
- Assignment tracking and submission
- Exam preparation tools
- Progress monitoring
- AI study assistant
- Digital library access

### For Teachers
- Class management tools
- Gradebook with analytics
- Lesson planning interface
- Student performance tracking
- Parent communication portal
- Professional development resources

### For Parents
- Child progress monitoring
- Teacher communication
- School announcements
- Event calendar
- Safety alerts and notifications
- Fee payment portal

### For Administrators
- Comprehensive school management
- Staff management
- Financial oversight
- Policy implementation
- System configuration
- Analytics and reporting

## 💡 Future Enhancements

- **Mobile App**: Native mobile applications
- **VR Classroom**: Virtual reality learning
- **Blockchain Certificates**: Tamper-proof certificates
- **Predictive Analytics**: Advanced performance prediction
- **Voice Assistant**: Voice-controlled interface
- **AR Campus Tour**: Augmented reality campus navigation

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Include tests for new features
- Update documentation as needed
- Keep pull requests focused and small

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- All contributors who have helped build this system
- Open source community for amazing tools and libraries
- Educational institutions for valuable feedback
- Teachers and students who use this system daily

## 📞 Support

For questions, issues, or support:

- **GitHub Issues**: Report bugs and request features
- **Documentation**: Comprehensive guides and tutorials
- **Community Forum**: Discuss with other users
- **Email Support**: support@schoolmanagement.com

---

🌟 **Built with ❤️ for Education** | **Empowering Schools Worldwide** 🌟

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5.0-green.svg)](https://www.mongodb.com/)
