/**
 * Calculate fine for an overdue book.
 * @param {Date} dueDate
 * @param {Date} returnDate
 * @param {number} finePerDay – default 5
 * @returns {number} total fine
 */
exports.calculateFine = (dueDate, returnDate, finePerDay = 5) => {
  const due = new Date(dueDate).getTime();
  const returned = new Date(returnDate).getTime();
  if (returned <= due) return 0;
  const daysLate = Math.ceil((returned - due) / (1000 * 60 * 60 * 24));
  return daysLate * finePerDay;
};