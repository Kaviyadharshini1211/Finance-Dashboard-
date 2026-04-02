const User = require("../models/User");
const { generateToken } = require("../utils/jwt");

const register = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error("Email already registered.");
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({ name, email, password, role });
  const token = generateToken(user._id);

  return { user, token };
};

const login = async ({ email, password }) => {
  // Explicitly select password since it's excluded by default
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("Your account has been deactivated. Contact an admin.");
    error.statusCode = 403;
    throw error;
  }

  const token = generateToken(user._id);
  return { user, token };
};

module.exports = { register, login };