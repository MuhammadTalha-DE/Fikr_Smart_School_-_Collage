const cron = require('node-cron');
const Student = require('../models/Student');
const { refreshStudentSummary } = require('../services/studentSummaryService');

cron.schedule('0 3 * * *', async () => {
  console.log('Refreshing student summaries...');
  const students = await Student.find({}).select('_id');
  for (const s of students) {
    await refreshStudentSummary(s._id);
  }
  console.log('Summaries refreshed.');
});