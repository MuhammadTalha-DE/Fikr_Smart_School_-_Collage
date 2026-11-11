const isEmpty = (value) => (
  value === undefined ||
  value === null ||
  (typeof value === 'string' && value.trim() === '') ||
  (Array.isArray(value) && value.length === 0)
);

const getValue = (values, field) => field
  .split('.')
  .reduce((current, key) => (current == null ? undefined : current[key]), values);

const makeRule = (validate) => validate;

export const rules = {
  required: (message = 'This field is required') => makeRule((value) => (
    isEmpty(value) ? message : ''
  )),

  email: (message = 'Enter a valid email address') => makeRule((value) => {
    if (isEmpty(value)) return '';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim()) ? '' : message;
  }),

  username: (message = 'Username can use letters, numbers, dots, underscores, and hyphens') => makeRule((value) => {
    if (isEmpty(value)) return '';
    return /^[a-zA-Z0-9._-]{3,40}$/.test(String(value).trim()) ? '' : message;
  }),

  minLength: (min, message = `Must be at least ${min} characters`) => makeRule((value) => {
    if (isEmpty(value)) return '';
    return String(value).length >= min ? '' : message;
  }),

  maxLength: (max, message = `Must be ${max} characters or fewer`) => makeRule((value) => {
    if (isEmpty(value)) return '';
    return String(value).length <= max ? '' : message;
  }),

  oneOf: (allowed, message = 'Select a valid option') => makeRule((value) => (
    isEmpty(value) || allowed.includes(value) ? '' : message
  )),

  numberMin: (min, message = `Must be at least ${min}`) => makeRule((value) => {
    if (isEmpty(value)) return '';
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && numberValue >= min ? '' : message;
  }),

  date: (message = 'Enter a valid date') => makeRule((value) => {
    if (isEmpty(value)) return '';
    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? message : '';
  }),

  sameAs: (otherField, message = 'Values do not match') => makeRule((value, values) => (
    value === getValue(values, otherField) ? '' : message
  )),

  passwordPolicy: (message = 'Password must be at least 10 characters and include uppercase, lowercase, number, and special character') => makeRule((value) => {
    if (isEmpty(value)) return '';
    const password = String(value);
    const isValid = (
      password.length >= 10 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
    return isValid ? '' : message;
  }),
};

export const validateForm = (schema, values) => {
  const errors = {};

  Object.entries(schema).forEach(([field, fieldRules]) => {
    const value = getValue(values, field);
    const error = fieldRules
      .map((rule) => rule(value, values))
      .find(Boolean);

    if (error) errors[field] = error;
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const getFirstValidationError = (errors) => Object.values(errors)[0] || '';

export const hasValidationErrors = (schema, values) => !validateForm(schema, values).isValid;
