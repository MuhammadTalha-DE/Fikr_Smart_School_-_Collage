const assertDocumentRecipient = (template, ownerType, data) => {
  const actualRole = ownerType === 'student'
    ? 'student'
    : ownerType === 'teacher'
      ? 'teacher'
      : ownerType === 'staff'
        ? 'staff'
        : data.user?.role;
  const targetRole = template.roleTarget;
  const matches = targetRole === 'user'
    || (targetRole === 'staff' && !['student', 'parent'].includes(actualRole))
    || targetRole === actualRole;

  if (!matches) {
    const error = new Error(`This template is configured for ${targetRole} recipients.`);
    error.statusCode = 422;
    throw error;
  }
};

module.exports = { assertDocumentRecipient };
