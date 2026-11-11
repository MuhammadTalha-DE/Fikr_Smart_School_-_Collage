const phonePattern = /^[+()\-\s\d]{7,20}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clean = (value) => (typeof value === 'string' ? value.trim() : '');

export const getApiErrorMessage = (error, fallback = 'Something went wrong') => (
  error?.response?.data?.message || error?.message || fallback
);

export const validateSafetyAlert = (form = {}) => {
  const title = clean(form.title);
  const message = clean(form.message);
  const targetRoles = Array.isArray(form.targetRoles) ? form.targetRoles : [];

  if (title.length < 5) return 'Alert title must be at least 5 characters';
  if (title.length > 120) return 'Alert title cannot exceed 120 characters';
  if (message.length < 10) return 'Alert message must be at least 10 characters';
  if (message.length > 1000) return 'Alert message cannot exceed 1000 characters';
  if (!form.type) return 'Select an alert type';
  if (!form.severity) return 'Select an alert severity';
  if (!targetRoles.length) return 'Select at least one alert audience';
  return '';
};

export const validateIncidentReport = (form = {}) => {
  const title = clean(form.title);
  const description = clean(form.description);

  if (!form.type) return 'Select an incident type';
  if (!form.severity) return 'Select an incident severity';
  if (title.length < 5) return 'Incident title must be at least 5 characters';
  if (title.length > 140) return 'Incident title cannot exceed 140 characters';
  if (description.length < 20) return 'Incident description must be at least 20 characters';
  if (description.length > 2000) return 'Incident description cannot exceed 2000 characters';
  return '';
};

export const validateEmergencyContact = (form = {}) => {
  const name = clean(form.name);
  const phone = clean(form.phone);
  const alternatePhone = clean(form.alternatePhone);
  const email = clean(form.email);
  const priority = Number(form.priority || 0);

  if (name.length < 2) return 'Contact name must be at least 2 characters';
  if (!form.relationship) return 'Select a contact category';
  if (!phonePattern.test(phone)) return 'Enter a valid phone number';
  if (alternatePhone && !phonePattern.test(alternatePhone)) return 'Enter a valid alternate phone number';
  if (email && !emailPattern.test(email)) return 'Enter a valid email address';
  if (!Number.isFinite(priority) || priority < 0 || priority > 10) return 'Priority must be between 0 and 10';
  return '';
};

export const normalizeEmergencyContact = (form = {}) => ({
  ...form,
  name: clean(form.name),
  phone: clean(form.phone),
  alternatePhone: clean(form.alternatePhone),
  email: clean(form.email),
  address: clean(form.address),
  notes: clean(form.notes),
  priority: Math.min(10, Math.max(0, Number(form.priority || 0))),
});
