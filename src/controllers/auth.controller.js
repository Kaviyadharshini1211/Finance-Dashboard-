const authService = require("../services/auth.service");
const { sendSuccess } = require("../utils/response");

const register = async (req, res, next) => {
  try {
    const { user, token } = await authService.register(req.body);
    return sendSuccess(res, "Registration successful.", { user, token }, 201);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { user, token } = await authService.login(req.body);
    return sendSuccess(res, "Login successful.", { user, token });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res) => {
  return sendSuccess(res, "Profile fetched.", { user: req.user });
};

module.exports = { register, login, getMe };