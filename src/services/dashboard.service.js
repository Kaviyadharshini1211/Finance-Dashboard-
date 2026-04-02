const FinancialRecord = require("../models/FinancialRecord");

// Summary: total income, expenses, and net balance
const getSummary = async () => {
  const result = await FinancialRecord.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: "$type",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  const summary = { income: 0, expense: 0, incomeCount: 0, expenseCount: 0 };
  result.forEach(({ _id, total, count }) => {
    if (_id === "income") {
      summary.income = total;
      summary.incomeCount = count;
    } else {
      summary.expense = total;
      summary.expenseCount = count;
    }
  });

  summary.netBalance = summary.income - summary.expense;
  summary.totalRecords = summary.incomeCount + summary.expenseCount;

  return summary;
};

// Category-wise breakdown for income and expenses
const getCategoryBreakdown = async () => {
  const result = await FinancialRecord.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: { type: "$type", category: "$category" },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
  ]);

  const breakdown = { income: [], expense: [] };
  result.forEach(({ _id, total, count }) => {
    breakdown[_id.type].push({ category: _id.category, total, count });
  });

  return breakdown;
};

// Monthly trends for the past N months
const getMonthlyTrends = async (months = 6) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months + 1);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const result = await FinancialRecord.aggregate([
    {
      $match: {
        isDeleted: false,
        date: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          type: "$type",
        },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // Reshape into a clean month-by-month array
  const monthMap = {};
  result.forEach(({ _id, total, count }) => {
    const key = `${_id.year}-${String(_id.month).padStart(2, "0")}`;
    if (!monthMap[key]) {
      monthMap[key] = { month: key, income: 0, expense: 0, incomeCount: 0, expenseCount: 0 };
    }
    monthMap[key][_id.type] = total;
    monthMap[key][`${_id.type}Count`] = count;
  });

  return Object.values(monthMap).map((m) => ({
    ...m,
    netBalance: m.income - m.expense,
  }));
};

// Weekly trends for the past N weeks
const getWeeklyTrends = async (weeks = 4) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);

  const result = await FinancialRecord.aggregate([
    {
      $match: {
        isDeleted: false,
        date: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $isoWeekYear: "$date" },
          week: { $isoWeek: "$date" },
          type: "$type",
        },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.week": 1 } },
  ]);

  const weekMap = {};
  result.forEach(({ _id, total, count }) => {
    const key = `${_id.year}-W${String(_id.week).padStart(2, "0")}`;
    if (!weekMap[key]) {
      weekMap[key] = { week: key, income: 0, expense: 0 };
    }
    weekMap[key][_id.type] = total;
  });

  return Object.values(weekMap);
};

// Recent N transactions
const getRecentActivity = async (limit = 10) => {
  return await FinancialRecord.find()
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 })
    .limit(Number(limit));
};

module.exports = {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getWeeklyTrends,
  getRecentActivity,
};