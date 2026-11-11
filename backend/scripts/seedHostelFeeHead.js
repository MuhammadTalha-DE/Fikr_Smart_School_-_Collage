// scripts/seedHostelFeeHead.js
const mongoose = require('mongoose');
const FeeHead = require('../models/FeeHead');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, async () => {
  await FeeHead.findOneAndUpdate(
    { name: 'Hostel Accommodation' },
    { name: 'Hostel Accommodation', code: 'HOSTEL', type: 'hostel' },
    { upsert: true, new: true }
  );
  console.log('Hostel fee head seeded');
  process.exit();
});