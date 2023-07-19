const User = require("../models/User");

// Get user details
const getUserDetailsbyid = async (req, res) => {
  try {
    const { userId } = req.user;

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Get user details error:", error);
    res.status(500).json({ error: "Failed to get user details" });
  }
};

module.exports = {
  getUserDetailsbyid,
};

// Get all user details
const getAllUserDetails = async (req, res) => {
  try {
    // Find all users
    const users = await User.find();

    if (users.length === 0) {
      return res.status(404).json({ error: "No users found" });
    }

    res.status(200).json({ users: users });
  } catch (error) {
    console.error("Get all user details error:", error);
    res.status(500).json({ error: "Failed to get user details" });
  }
};

module.exports = {
  getAllUserDetails,
};
