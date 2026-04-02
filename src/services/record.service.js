const FinancialRecord = require("../models/FinancialRecord");

const createRecord = async (data, userId) => {
  const record = await FinancialRecord.create({ ...data, createdBy: userId });
  return record;
};

const getRecords = async (query, userId, userRole) => {
  const {
    page = 1,
    limit = 10,
    type,
    category,
    startDate,
    endDate,
    search,
    sortBy = "date",
    sortOrder = "desc",
  } = query;

  const filter = {};

  // Viewers and analysts see all records; we don't restrict by user
  // (business decision: financial records are shared across the org)
  if (type) filter.type = type;
  if (category) filter.category = category;

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  if (search) {
    filter.$or = [
      { notes: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;
  const sortOptions = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [records, total] = await Promise.all([
    FinancialRecord.find(filter)
      .populate("createdBy", "name email")
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit)),
    FinancialRecord.countDocuments(filter),
  ]);

  return {
    records,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getRecordById = async (id) => {
  const record = await FinancialRecord.findById(id).populate("createdBy", "name email");
  if (!record) {
    const error = new Error("Record not found.");
    error.statusCode = 404;
    throw error;
  }
  return record;
};

const updateRecord = async (id, updates) => {
  const record = await FinancialRecord.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (!record) {
    const error = new Error("Record not found.");
    error.statusCode = 404;
    throw error;
  }

  return record;
};

// Soft delete
const deleteRecord = async (id) => {
  const record = await FinancialRecord.findById(id);
  if (!record) {
    const error = new Error("Record not found.");
    error.statusCode = 404;
    throw error;
  }

  record.isDeleted = true;
  record.deletedAt = new Date();
  await record.save();
};

// Hard restore (admin only)
const restoreRecord = async (id) => {
  const record = await FinancialRecord.findOne(
    { _id: id },
    null,
    { includeDeleted: true }
  );

  if (!record) {
    const error = new Error("Record not found.");
    error.statusCode = 404;
    throw error;
  }

  record.isDeleted = false;
  record.deletedAt = null;
  await record.save();

  return record;
};

module.exports = {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  restoreRecord,
};