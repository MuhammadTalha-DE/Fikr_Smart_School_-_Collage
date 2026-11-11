const Config = require('../models/Config');

const DEFAULT_HARD_CODED = {
  'Mathematics': 6, 'English': 5, 'Science': 5, 'Urdu': 4,
  'Islamiat': 3, 'Social Studies': 3, 'Computer': 3,
  'History': 2, 'Geography': 2, 'Art': 2, 'Music': 1, 'Physical Education': 2,
};

const getDefaultLoad = async () => {
  const config = await Config.findOne({ key: 'default_weekly_load' });
  return config ? config.value : DEFAULT_HARD_CODED;
};

const setDefaultLoad = async (loadObject) => {
  await Config.findOneAndUpdate(
    { key: 'default_weekly_load' },
    { value: loadObject },
    { upsert: true, new: true }
  );
};

module.exports = { getDefaultLoad, setDefaultLoad };