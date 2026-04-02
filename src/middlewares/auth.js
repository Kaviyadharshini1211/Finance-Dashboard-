const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendError } = require("../utils/response");

// Verify JWT token and attach user to request
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return sendError(res, "Access denied. No token provided.", 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return sendError(res, "User no longer exists.", 401);
    }

    if (!user.isActive) {
      return sendError(res, "Your account has been deactivated.", 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return sendError(res, "Invalid token.", 401);
    }
    if (error.name === "TokenExpiredError") {
      return sendError(res, "Token has expired. Please log in again.", 401);
    }
    return sendError(res, "Authentication failed.", 401);
  }
};

// Role-based access control - pass allowed roles
// Usage: authorize("admin") or authorize("admin", "analyst")
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Your role '${req.user.role}' is not permitted to perform this action.`,
        403
      );
    }
    next();
  };
};

module.exports = { protect, authorize };