const mongoose = require('mongoose');
require('dotenv').config();
const Timetable = require('../models/Timetable');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await Timetable.deleteMany({});
  console.log('All timetables deleted');
  process.exit();
});