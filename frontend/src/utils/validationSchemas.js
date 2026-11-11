import { rules } from './validation';

export const loginSchema = {
  username: [
    rules.required('Username or email is required'),
    rules.maxLength(120, 'Username or email is too long'),
  ],
  password: [
    rules.required('Password is required'),
  ],
};

export const resetPasswordSchema = {
  password: [
    rules.required('New password is required'),
    rules.passwordPolicy(),
  ],
  confirmPassword: [
    rules.required('Confirm your new password'),
    rules.sameAs('password', 'Passwords do not match'),
  ],
};

export const createUserSchema = {
  name: [
    rules.required('Full name is required'),
    rules.maxLength(80, 'Full name is too long'),
  ],
  username: [
    rules.required('Username is required'),
    rules.username(),
  ],
  email: [
    rules.required('Email is required'),
    rules.email(),
  ],
  password: [
    rules.required('Password is required'),
    rules.passwordPolicy(),
  ],
  role: [
    rules.required('Role is required'),
    rules.oneOf(['student', 'teacher', 'parent', 'librarian', 'warden', 'transport'], 'Select a valid role'),
  ],
};

export const attendanceSchema = {
  classId: [
    rules.required('Please select a class'),
  ],
  date: [
    rules.required('Please select a date'),
    rules.date(),
  ],
};

export const paymentSchema = {
  amount: [
    rules.required('Payment amount is required'),
    rules.numberMin(0.01, 'Enter a valid payment amount'),
  ],
  mode: [
    rules.required('Payment mode is required'),
    rules.oneOf(['cash', 'online', 'bank_transfer', 'cheque', 'card'], 'Select a valid payment mode'),
  ],
  paymentDate: [
    rules.required('Payment date is required'),
    rules.date(),
  ],
};

export const paymentAmountSchema = {
  amount: [
    rules.required('Payment amount is required'),
    rules.numberMin(0.01, 'Enter a valid payment amount'),
  ],
};

export const validAttendanceStatuses = ['present', 'absent', 'late', 'leave', 'medical_leave'];
