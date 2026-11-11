const mongoose = require('mongoose');

const availabilitySchema = mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true, unique: true },
  slots: {
    Monday:    { type: [Boolean], default: [true,true,true,true,true,true,true,true] },
    Tuesday:   { type: [Boolean], default: [true,true,true,true,true,true,true,true] },
    Wednesday: { type: [Boolean], default: [true,true,true,true,true,true,true,true] },
    Thursday:  { type: [Boolean], default: [true,true,true,true,true,true,true,true] },
    Friday:    { type: [Boolean], default: [true,true,true,true,true,true,true,true] },
    Saturday:  { type: [Boolean], default: [true,true,true,true,true,true,true,true] },
    Sunday:    { type: [Boolean], default: [true,true,true,true,true,true,true,true] },
  },
});

module.exports = mongoose.model('TeacherAvailability', availabilitySchema);