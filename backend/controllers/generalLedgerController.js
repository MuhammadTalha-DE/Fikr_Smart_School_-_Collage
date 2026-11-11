const service = require('../services/generalLedgerService');

exports.getAdminOverview = async (req, res) => {
  try {
    const data = await service.getAdminOverview();
    res.json({ success: true, data });
  } catch (error) {
    throw error;
  }
};

exports.listAccounts = async (req, res) => {
  try {
    const data = await service.listAccounts();
    res.json({ success: true, data });
  } catch (error) {
    throw error;
  }
};

exports.createAccount = async (req, res) => {
  try {
    const data = await service.createAccount(req.body);
    res.status(201).json({ success: true, message: 'Ledger account created successfully', data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const data = await service.updateAccount(req.params.id, req.body);
    res.json({ success: true, message: 'Ledger account updated successfully', data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.listVouchers = async (req, res) => {
  try {
    const data = await service.listVouchers();
    res.json({ success: true, data });
  } catch (error) {
    throw error;
  }
};

exports.createVoucher = async (req, res) => {
  try {
    const data = await service.createVoucher(req.body, req.user._id);
    res.status(201).json({ success: true, message: 'Voucher created successfully', data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateVoucher = async (req, res) => {
  try {
    const data = await service.updateVoucher(req.params.id, req.body);
    res.json({ success: true, message: 'Voucher updated successfully', data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

