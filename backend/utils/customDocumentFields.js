const normalizeCustomDocumentFields = (template, values = {}) => {
  const fields = (template.fields || []).filter((field) => field.customInput && field.key);
  const normalized = {};
  const errors = [];

  for (const field of fields) {
    const raw = values[field.key];
    const empty = raw === undefined || raw === null || String(raw).trim() === '';
    if (empty) {
      if (field.required) errors.push(`${field.label || field.key} is required`);
      continue;
    }

    if (field.inputType === 'number') {
      const number = Number(raw);
      if (!Number.isFinite(number)) errors.push(`${field.label || field.key} must be a number`);
      else normalized[field.key] = number;
    } else if (field.inputType === 'date') {
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) errors.push(`${field.label || field.key} must be a valid date`);
      else normalized[field.key] = date.toISOString().slice(0, 10);
    } else {
      const value = String(raw).trim();
      if (field.inputType === 'select' && !(field.options || []).includes(value)) {
        errors.push(`Choose a valid option for ${field.label || field.key}`);
      } else {
        normalized[field.key] = value;
      }
    }
  }

  if (errors.length) {
    const error = new Error('Please complete the custom document fields');
    error.statusCode = 422;
    error.errors = errors;
    throw error;
  }

  return normalized;
};

module.exports = { normalizeCustomDocumentFields };
