const recordService = require("../services/record.service");
const { sendSuccess } = require("../utils/response");

const createRecord = async (req, res, next) => {
  try {
    const record = await recordService.createRecord(req.body, req.user._id);
    return sendSuccess(res, "Record created successfully.", { record }, 201);
  } catch (err) {
    next(err);
  }
};

const getRecords = async (req, res, next) => {
  try {
    const result = await recordService.getRecords(req.query, req.user._id, req.user.role);
    return sendSuccess(res, "Records fetched successfully.", result);
  } catch (err) {
    next(err);
  }
};

const getRecordById = async (req, res, next) => {
  try {
    const record = await recordService.getRecordById(req.params.id);
    return sendSuccess(res, "Record fetched successfully.", { record });
  } catch (err) {
    next(err);
  }
};

const updateRecord = async (req, res, next) => {
  try {
    const record = await recordService.updateRecord(req.params.id, req.body);
    return sendSuccess(res, "Record updated successfully.", { record });
  } catch (err) {
    next(err);
  }
};

const deleteRecord = async (req, res, next) => {
  try {
    await recordService.deleteRecord(req.params.id);
    return sendSuccess(res, "Record deleted successfully (soft delete).");
  } catch (err) {
    next(err);
  }
};

const restoreRecord = async (req, res, next) => {
  try {
    const record = await recordService.restoreRecord(req.params.id);
    return sendSuccess(res, "Record restored successfully.", { record });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  restoreRecord,
};