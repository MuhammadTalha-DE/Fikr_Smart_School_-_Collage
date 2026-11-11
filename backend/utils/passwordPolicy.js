const PASSWORD_MIN_LENGTH = 10;

const validatePasswordPolicy = (password) => {
  const errors = [];

  if (typeof password !== 'string' || password.length === 0) {
    return ['Password is required'];
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must include a lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must include an uppercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must include a number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must include a special character');
  }

  return errors;
};

const assertPasswordPolicy = (password) => {
  const errors = validatePasswordPolicy(password);
  if (errors.length) {
    const error = new Error(errors.join('. '));
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }
};

const generateTemporaryPassword = () => {
  const random = Math.random().toString(36).slice(2, 10);
  const timestamp = Date.now().toString(36).slice(-4);
  return `Sch@${random}${timestamp}9A`;
};

module.exports = {
  PASSWORD_MIN_LENGTH,
  assertPasswordPolicy,
  generateTemporaryPassword,
  validatePasswordPolicy,
};
