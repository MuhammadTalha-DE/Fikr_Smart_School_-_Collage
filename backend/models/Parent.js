const mongoose = require('mongoose');
const parentSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
});
module.exports = mongoose.model('Parent', parentSchema);
