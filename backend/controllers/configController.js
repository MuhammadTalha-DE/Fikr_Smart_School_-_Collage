const { getDefaultLoad, setDefaultLoad } = require('../services/configService');
const asyncHandler = require('express-async-handler');

// @desc    Get the global default weekly load configuration
// @route   GET /api/config/default-load
const getLoadConfig = asyncHandler(async (req, res) => {
  const load = await getDefaultLoad();
  res.json(load);
});

// @desc    Update the global default weekly load configuration
// @route   PUT /api/config/default-load
const updateLoadConfig = asyncHandler(async (req, res) => {
  await setDefaultLoad(req.body);
  res.json({ message: 'Default load updated' });
});

module.exports = { getLoadConfig, updateLoadConfig };