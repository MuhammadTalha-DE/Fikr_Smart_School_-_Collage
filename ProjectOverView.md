# Fikr Smart School ERP

## Project Overview

Fikr Smart is a multi-role school ERP built on:

- Frontend: React, React Router, Tailwind CSS
- Backend: Node.js, Express
- Database: MongoDB with Mongoose
- Realtime: Socket.io
- Auth: JWT with role-based route protection

## Active Roles

- Admin
- Teacher
- Student
- Parent
- Librarian
- Warden
- Transport

## Implemented Core Modules

- Authentication and user management
- Classes, subjects, teachers, students, parents
- Timetable designer, generator, conflict center, reports, substitutions
- Attendance, marks, exams, results, report cards
- Assignments, projects, lab management, practical marks
- Admissions, promotion, transcripts, academic records
- Curriculum builder, syllabus planner, lesson planning, course coverage
- Finance: fee heads, class fee plans, student fee accounts, installments, payments
- Messaging and announcements
- Library management
- Hostel management
- Transport management
- Safety and weather intelligence
- Notification Center
- Admin Audit Center

## Weather Intelligence Status

Weather is now a dedicated ERP module, not a widget. It includes:

- Admin weather command center
- Student, teacher, parent, librarian, warden, and transport weather views
- AQI, forecast, history, alerts, analytics, system health
- Weather impact views for attendance, transport, hostel, and LMS continuity

## Notification Center Status

Notification Center is now connected to live ERP actions:

- Weather alerts
- Safety incidents
- Announcements
- Fee payments and late-fee actions
- Hostel leave and visitor workflows
- Transport delay broadcasts

The system includes:

- Admin campaign management
- Role inbox
- Delivery receipts
- Preferences
- Audit logging

## Transport Module Status

Transport is now available as a dedicated role module with:

- Transport dashboard
- Fleet operations
- Route and vehicle management
- Allocation and roster views
- Trip sheet access
- Transport weather dashboard
- Delay alert broadcasting into Notification Center

## LMS / Learning Continuity Status

Learning continuity is now modeled in the backend with event logging for:

- Assignment publishing
- Lesson plan creation
- Lesson completion
- Student submissions
- Weather-triggered continuity activity

This data now feeds the LMS vs Weather admin view.

## Current Quality Guardrails

- Backend API tests
- Weather service tests
- Learning continuity service tests
- Role dashboard smoke tests

## Near-Term Improvement Opportunities

- Split large frontend chunks with route-level code splitting
- Fix the remaining `react-big-calendar` CSS import order warning
- Expand transport live tracking with per-stop coordinates and driver apps
- Add payment gateway integration
- Add richer LMS workflows on top of continuity data
- Add HR/payroll and inventory/assets
