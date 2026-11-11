const cron = require('node-cron');
const SchoolPeriod = require('../models/SchoolPeriod');
const FeeInstallment = require('../models/FeeInstallment');
const sendEmail = require('../utils/sendEmail');
const { getIO } = require('../socket/socketServer');

let currentState = { period: null, remaining: 0, nextPeriod: null, status: 'idle' };
let schedulerInterval = null;
let feeReminderJob = null;

const getCurrentState = () => currentState;

const emitPeriodState = (state) => {
  currentState = state;
  getIO().emit('period-update', currentState);
};

const updateState = async () => {
  try {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });

    if (dayOfWeek === 'Sunday') {
      if (currentState.status !== 'off') {
        emitPeriodState({ period: null, remaining: 0, nextPeriod: null, status: 'off' });
        console.log('Emitted period-update:', currentState);
      }
      return;
    }

    const periods = await SchoolPeriod.find({}).sort('periodNumber');

    if (periods.length === 0) {
      if (currentState.status !== 'unconfigured') {
        emitPeriodState({ period: null, remaining: 0, nextPeriod: null, status: 'unconfigured' });
      }
      return;
    }

    let activePeriod = null;
    for (const period of periods) {
      const [startHour, startMinute] = period.startTime.split(':').map(Number);
      const [endHour, endMinute] = period.endTime.split(':').map(Number);
      const start = startHour * 60 + startMinute;
      const end = endHour * 60 + endMinute;

      if (currentMinutes >= start && currentMinutes < end) {
        activePeriod = period;
        break;
      }
    }

    if (activePeriod) {
      const [activeEndHour, activeEndMinute] = activePeriod.endTime.split(':').map(Number);
      const activeEnd = activeEndHour * 60 + activeEndMinute;
      const remaining = activeEnd - currentMinutes;
      const nextPeriod = periods.find((period) => {
        const [nextStartHour, nextStartMinute] = period.startTime.split(':').map(Number);
        return (nextStartHour * 60 + nextStartMinute) > activeEnd;
      });

      const newState = {
        period: activePeriod.periodNumber,
        type: activePeriod.type,
        remaining,
        nextPeriod: nextPeriod ? (nextPeriod.type === 'break' ? 'Break' : `Period ${nextPeriod.periodNumber}`) : null,
        status: 'active',
      };

      if (JSON.stringify(newState) !== JSON.stringify(currentState)) {
        emitPeriodState(newState);
      }
      return;
    }

    const firstPeriod = periods[0];
    const lastPeriod = periods[periods.length - 1];
    const [firstStartHour, firstStartMinute] = firstPeriod.startTime.split(':').map(Number);
    const [lastEndHour, lastEndMinute] = lastPeriod.endTime.split(':').map(Number);
    const firstStart = firstStartHour * 60 + firstStartMinute;
    const lastEnd = lastEndHour * 60 + lastEndMinute;

    if (currentMinutes < firstStart) {
      const newState = {
        period: null,
        remaining: firstStart - currentMinutes,
        nextPeriod: `Period ${firstPeriod.periodNumber}`,
        status: 'before-school',
      };
      if (JSON.stringify(newState) !== JSON.stringify(currentState)) {
        emitPeriodState(newState);
      }
    } else if (currentMinutes >= lastEnd && currentState.status !== 'finished') {
      emitPeriodState({ period: null, remaining: 0, nextPeriod: null, status: 'finished' });
    }
  } catch (error) {
    console.error('Period scheduler error:', error);
  }
};

const sendFeeDeadlineReminders = async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const start = new Date(tomorrow.setHours(0, 0, 0, 0));
  const end = new Date(tomorrow.setHours(23, 59, 59, 999));

  const dueInstalments = await FeeInstallment.find({
    status: 'unpaid',
    dueDate: { $gte: start, $lte: end },
  }).populate({
    path: 'studentFeeAccount',
    populate: {
      path: 'studentId',
      populate: { path: 'userId', select: 'name email' },
    },
  });

  for (const installment of dueInstalments) {
    const email = installment.studentFeeAccount?.studentId?.userId?.email;
    if (!email) continue;

    try {
      await sendEmail({
        email,
        subject: 'Upcoming Fee Deadline',
        message: `Dear parent/student, your installment #${installment.instalmentNumber} of PKR ${installment.amount} is due on ${installment.dueDate.toDateString()}. Please pay before the due date to avoid late fees.`,
      });
    } catch (err) {
      console.error('Failed to send reminder', err);
    }
  }
};

const startScheduler = () => {
  if (schedulerInterval) {
    console.log('Period scheduler already started');
    return;
  }

  console.log('Period scheduler started');
  schedulerInterval = setInterval(updateState, 10000);
  updateState();
  feeReminderJob = cron.schedule('0 8 * * *', sendFeeDeadlineReminders);
};

module.exports = {
  startScheduler,
  updateState,
  getCurrentState,
  sendFeeDeadlineReminders,
};
