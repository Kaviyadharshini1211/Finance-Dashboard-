const User = require("../models/User");

const getAllUsers = async ({ page = 1, limit = 10, role, isActive }) => {
  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === "true";

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }
  return user;
};

const updateUser = async (id, updates, requestingUser) => {
  // Non-admins can only update their own profile
  if (requestingUser.role !== "admin" && requestingUser._id.toString() !== id) {
    const error = new Error("You are not allowed to update other users.");
    error.statusCode = 403;
    throw error;
  }

  // Only admins can change roles or active status
  if (requestingUser.role !== "admin") {
    delete updates.role;
    delete updates.isActive;
  }

  const user = await User.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

const deleteUser = async (id, requestingUserId) => {
  if (id === requestingUserId.toString()) {
    const error = new Error("You cannot delete your own account.");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findByIdAndDelete(id);
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };