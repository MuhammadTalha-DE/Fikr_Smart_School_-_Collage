const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    dueDate: Date,
    attachments: [String],
    submissions: [
      {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
        submittedAt: Date,
        fileUrl: String,
        marks: Number,
        feedback: String, //    new   Field 
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);