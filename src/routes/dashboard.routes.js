const express = require("express");
const router = express.Router();
const dashboardService = require("../services/dashboard.service");
const { protect, authorize } = require("../middlewares/auth");
const { sendSuccess } = require("../utils/response");

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Summary and analytics APIs (Analyst + Admin)
 */

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     summary: Get total income, expenses, and net balance
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Financial summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     income:
 *                       type: number
 *                     expense:
 *                       type: number
 *                     netBalance:
 *                       type: number
 *                     totalRecords:
 *                       type: integer
 */
router.get("/summary", protect, authorize("analyst", "admin"), async (req, res, next) => {
  try {
    const summary = await dashboardService.getSummary();
    return sendSuccess(res, "Summary fetched successfully.", summary);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /dashboard/category-breakdown:
 *   get:
 *     summary: Get income and expense totals broken down by category
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Category-wise breakdown
 */
router.get("/category-breakdown", protect, authorize("analyst", "admin"), async (req, res, next) => {
  try {
    const breakdown = await dashboardService.getCategoryBreakdown();
    return sendSuccess(res, "Category breakdown fetched.", breakdown);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /dashboard/monthly-trends:
 *   get:
 *     summary: Get monthly income and expense trends
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Number of past months to include
 *     responses:
 *       200:
 *         description: Monthly trend data
 */
router.get("/monthly-trends", protect, authorize("analyst", "admin"), async (req, res, next) => {
  try {
    const trends = await dashboardService.getMonthlyTrends(req.query.months);
    return sendSuccess(res, "Monthly trends fetched.", trends);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /dashboard/weekly-trends:
 *   get:
 *     summary: Get weekly income and expense trends
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: weeks
 *         schema:
 *           type: integer
 *           default: 4
 *         description: Number of past weeks to include
 *     responses:
 *       200:
 *         description: Weekly trend data
 */
router.get("/weekly-trends", protect, authorize("analyst", "admin"), async (req, res, next) => {
  try {
    const trends = await dashboardService.getWeeklyTrends(req.query.weeks);
    return sendSuccess(res, "Weekly trends fetched.", trends);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /dashboard/recent-activity:
 *   get:
 *     summary: Get the most recent financial transactions
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Recent transactions
 */
router.get("/recent-activity", protect, authorize("analyst", "admin"), async (req, res, next) => {
  try {
    const activity = await dashboardService.getRecentActivity(req.query.limit);
    return sendSuccess(res, "Recent activity fetched.", { records: activity });
  } catch (err) {
    next(err);
  }
});

module.exports = router;