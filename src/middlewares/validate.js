const { z } = require("zod");
const { sendError } = require("../utils/response");

// Middleware factory — wraps a Zod schema and validates req.body
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }
  req.body = result.data; // use parsed & coerced data
  next();
};

// ── Auth Schemas ──────────────────────────────────────────────
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["viewer", "analyst", "admin"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ── User Schemas ──────────────────────────────────────────────
const updateUserSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  role: z.enum(["viewer", "analyst", "admin"]).optional(),
  isActive: z.boolean().optional(),
});

// ── Financial Record Schemas ──────────────────────────────────
const CATEGORIES = [
  "salary",
  "freelance",
  "investment",
  "business",
  "food",
  "transport",
  "utilities",
  "entertainment",
  "healthcare",
  "education",
  "rent",
  "shopping",
  "other",
];

const createRecordSchema = z.object({
  amount: z.number({ invalid_type_error: "Amount must be a number" }).positive("Amount must be greater than 0"),
  type: z.enum(["income", "expense"], { errorMap: () => ({ message: "Type must be 'income' or 'expense'" }) }),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: `Category must be one of: ${CATEGORIES.join(", ")}` }) }),
  date: z.string().optional(),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

const updateRecordSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0").optional(),
  type: z.enum(["income", "expense"]).optional(),
  category: z.enum(CATEGORIES).optional(),
  date: z.string().optional(),
  notes: z.string().max(500).optional(),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  updateUserSchema,
  createRecordSchema,
  updateRecordSchema,
};