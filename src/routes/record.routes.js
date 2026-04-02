const express = require("express");
const router = express.Router();
const {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  restoreRecord,
} = require("../controllers/record.controller");
const { protect, authorize } = require("../middlewares/auth");
const {
  validate,
  createRecordSchema,
  updateRecordSchema,
} = require("../middlewares/validate");

/**
 * @swagger
 * tags:
 *   name: Records
 *   description: Financial records management
 */

/**
 * @swagger
 * /records:
 *   get:
 *     summary: Get all financial records with filters and pagination
 *     tags: [Records]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-12-31"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [date, amount, category]
 *           default: date
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: List of records with pagination
 */
router.get("/", protect, authorize("viewer", "analyst", "admin"), getRecords);

/**
 * @swagger
 * /records/{id}:
 *   get:
 *     summary: Get a single financial record by ID
 *     tags: [Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record found
 *       404:
 *         description: Record not found
 */
router.get("/:id", protect, authorize("viewer", "analyst", "admin"), getRecordById);

/**
 * @swagger
 * /records:
 *   post:
 *     summary: Create a new financial record (Admin only)
 *     tags: [Records]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 5000
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               category:
 *                 type: string
 *                 example: salary
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-06-01"
 *               notes:
 *                 type: string
 *                 example: Monthly salary
 *     responses:
 *       201:
 *         description: Record created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 */
router.post("/", protect, authorize("admin"), validate(createRecordSchema), createRecord);

/**
 * @swagger
 * /records/{id}:
 *   patch:
 *     summary: Update a financial record (Admin only)
 *     tags: [Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Record updated
 *       404:
 *         description: Record not found
 */
router.patch("/:id", protect, authorize("admin"), validate(updateRecordSchema), updateRecord);

/**
 * @swagger
 * /records/{id}:
 *   delete:
 *     summary: Soft delete a financial record (Admin only)
 *     tags: [Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record soft deleted
 *       404:
 *         description: Record not found
 */
router.delete("/:id", protect, authorize("admin"), deleteRecord);

/**
 * @swagger
 * /records/{id}/restore:
 *   patch:
 *     summary: Restore a soft-deleted record (Admin only)
 *     tags: [Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record restored
 *       404:
 *         description: Record not found
 */
router.patch("/:id/restore", protect, authorize("admin"), restoreRecord);

module.exports = router;