// seedBehaviourCategories.js (run once)
const mongoose = require('mongoose');
const BehaviourCategory = require('./models/BehaviourCategory');
require('dotenv').config();

const categories = [
  { name: 'helping_others', label: 'Helping Others', type: 'positive', severity: 'minor', defaultPoints: 5 },
  { name: 'excellent_participation', label: 'Excellent Participation', type: 'positive', severity: 'minor', defaultPoints: 5 },
  { name: 'leadership', label: 'Leadership', type: 'positive', severity: 'moderate', defaultPoints: 10 },
  { name: 'teamwork', label: 'Teamwork', type: 'positive', severity: 'minor', defaultPoints: 5 },
  { name: 'disruptive', label: 'Disruptive Behaviour', type: 'negative', severity: 'moderate', defaultPoints: -10 },
  { name: 'late_to_class', label: 'Late to Class', type: 'negative', severity: 'minor', defaultPoints: -5 },
  { name: 'homework_not_done', label: 'Homework Not Done', type: 'negative', severity: 'minor', defaultPoints: -3 },
  { name: 'bullying', label: 'Bullying', type: 'negative', severity: 'serious', defaultPoints: -20 },
  { name: 'vandalism', label: 'Vandalism', type: 'negative', severity: 'serious', defaultPoints: -15 },
  { name: 'cheating', label: 'Cheating', type: 'negative', severity: 'serious', defaultPoints: -20 },
  { name: 'other', label: 'Other', type: 'positive', severity: 'minor', defaultPoints: 0 },
];

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await BehaviourCategory.deleteMany({});
  await BehaviourCategory.insertMany(categories);
  console.log('Behaviour categories seeded');
  process.exit();
});