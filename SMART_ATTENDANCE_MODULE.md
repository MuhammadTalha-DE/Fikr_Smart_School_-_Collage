# 🎯 Smart Attendance & Access Control Module

## 📋 Overview

This module provides comprehensive attendance management for **students, teachers, hostel residents, and transport** with QR code support, AI-powered risk analysis, parent alerts, and detailed reporting.

---

## 🚀 Features Implemented

### 1. ✅ Student Attendance (Enhanced)
- **Status options**: Present, Absent, Late, Leave, Medical Leave
- **Methods**: Manual, QR code, Bulk import
- **Subject & teacher tracking**
- **Parent alerts** for absent/late students

### 2. ✅ Teacher Attendance
- Check-in / Check-out system
- Late arrival tracking (auto-calculated)
- Monthly attendance reports
- Leave records

### 3. ✅ QR Code Attendance
- Generate unique QR codes per class session
- 10-minute expiry for security
- Student scans QR → auto-marked present
- Teacher verifies list after scanning

### 4. ✅ Parent Alerts
- **Absence alerts** sent via email/notification
- **Weekly attendance summaries**
- **Low attendance warnings** (<75%)

### 5. ✅ Hostel Attendance
- Morning & Night session tracking
- Present / Absent / On Leave status
- Room & bed tracking integrated

### 6. ✅ Transport Attendance
- Boarded / Dropped tracking
- Per-route, per-vehicle management
- Morning pickup & evening drop sessions

### 7. ✅ AI Attendance Risk Analysis
- Identifies low attendance students (<75%)
- Risk levels: High (<40%), Medium (40-60%), Low (60-75%)
- Auto-generates recommendations
- Low attendance → academic risk alert
- Integrates with AI Recommendation system

### 8. ✅ Reports & Analytics
- Today's attendance stats (admin dashboard)
- Class-wise attendance summary
- Monthly trends with charts
- Low attendance list with details
- Export to CSV

---

## 📁 File Structure

### Backend

```
backend/
├── models/
│   ├── Attendance.js              # Enhanced with subject, method, remarks
│   ├── TeacherAttendance.js       # NEW - teacher check-in/out
│   ├── TransportAttendance.js     # NEW - transport boarding/drop
│   └── HostelAttendance.js        # Existing (reused)
│
├── controllers/
│   ├── attendanceController.js    # Enhanced with stats, alerts, risk
│   ├── teacherAttendanceController.js  # NEW
│   └── transportAttendanceController.js # NEW
│
├── routes/
│   └── attendanceRoutes.js        # Enhanced with all new endpoints
│
├── services/
│   ├── attendanceAnalyticsService.js    # NEW - statistics & risk analysis
│   ├── attendanceAlertService.js        # NEW - parent alerts
│   └── qrAttendanceService.js           # NEW - QR code logic
```

### Frontend

```
frontend/src/
├── pages/attendance/
│   ├── AdminAttendanceDashboard.jsx    # Admin dashboard with stats
│   ├── TeacherAttendancePage.jsx       # Enhanced teacher marking
│   ├── StudentAttendanceView.jsx       # Student view with calendar
│   ├── ParentAttendanceView.jsx        # Parent view with alerts
│   ├── HostelAttendancePage.jsx        # Hostel morning/night
│   ├── TransportAttendancePage.jsx     # Boarding/drop tracking
│   └── AttendanceReports.jsx           # Reports & CSV export
│
├── components/attendance/
│   ├── AttendanceStatsCard.jsx         # Stats display card
│   ├── AttendanceTable.jsx             # Tabular attendance view
│   ├── MarkAttendanceForm.jsx          # Quick marking interface
│   ├── AttendanceCalendar.jsx          # Calendar view
│   ├── AttendanceChart.jsx             # Bar & donut charts
│   ├── AttendanceRiskCard.jsx          # AI risk display
│   ├── AbsenceAlertCard.jsx            # Alert notification
│   ├── QRGenerator.jsx                 # QR code generation
│   └── QRScanner.jsx                   # QR scanning interface
│
├── services/
│   ├── attendanceApi.js                # NEW - all attendance API calls
│   └── api.js                          # Existing (extended)
```

---

## 🔗 Integration Points

| Module | Integration |
|--------|------------|
| **AI Recommendation** | `attendanceAnalyticsService.js` generates risk analysis → stored as `Recommendation` model |
| **Parent Portal** | `attendanceAlertService.js` sends absence alerts via email/notification |
| **Teacher Dashboard** | Teacher marks attendance, sees class stats |
| **Hostel System** | Hostel attendance (morning/night) per resident |
| **Transport System** | Boarding/drop tracking per route/vehicle |
| **Safety Module** | Low attendance → missing student alerts |
| **Finance** | Attendance-based fee reports |
| **Student Dashboard** | View own attendance, scan QR |
| **Admin Dashboard** | Full analytics, risk analysis, reports |

---

## 🔧 API Endpoints

### Student Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/attendance` | Mark attendance |
| GET | `/api/attendance` | Get attendance records |
| POST | `/api/attendance/bulk` | Bulk import |
| GET | `/api/attendance/stats/today` | Today's stats |
| GET | `/api/attendance/stats/low-attendance` | Low attendance students |
| GET | `/api/attendance/stats/risk-analysis` | AI risk analysis |
| GET | `/api/attendance/stats/monthly-trends` | Monthly trends |
| GET | `/api/attendance/stats/student/:studentId` | Student stats |
| GET | `/api/attendance/stats/class/:classId` | Class summary |
| POST | `/api/attendance/ai-recommendations` | Generate AI recommendations |

### Teacher Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/attendance/teacher` | Mark teacher attendance |
| GET | `/api/attendance/teacher` | Get teacher records |
| GET | `/api/attendance/teacher/stats` | Teacher stats |
| POST | `/api/attendance/teacher/check-in` | Quick check-in |
| POST | `/api/attendance/teacher/check-out` | Quick check-out |

### Transport Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/attendance/transport` | Mark transport attendance |
| GET | `/api/attendance/transport` | Get transport records |
| GET | `/api/attendance/transport/stats` | Transport stats |
| GET | `/api/attendance/transport/my` | Student's own transport |

---

## 🎯 Role-Based Access

| Role | Pages/Features |
|------|---------------|
| **Admin** | `AdminAttendanceDashboard`, `AttendanceReports`, `TransportAttendancePage`, `HostelAttendancePage` |
| **Teacher** | `TeacherAttendancePage` (manual + QR), class stats |
| **Student** | `StudentAttendanceView` (own record, calendar, chart, QR scan) |
| **Parent** | `ParentAttendanceView` (child attendance, alerts, reports) |
| **Warden** | `HostelAttendancePage` (reused for warden role) |

---

## 🧪 Test the Module

1. **Admin**: Navigate to `/admin/attendance` to see dashboard
2. **Teacher**: Go to `/teacher/attendance` to mark attendance with QR option
3. **Student**: View at `/student/attendance` with calendar/chart
4. **Parent**: Check at `/parent/attendance` for child's records

---

## 📊 Dashboard Shows

- ✅ Total present today
- ✅ Total absent today
- ✅ Late students  
- ✅ Attendance percentage
- ✅ Class-wise attendance
- ✅ Low attendance students  
- ✅ Monthly trends
- ✅ AI risk students
