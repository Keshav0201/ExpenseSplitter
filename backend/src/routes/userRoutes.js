const express = require("express");

const authenticateUser = require("../middleware/authMiddleware");

const {
  getMyProfile,
  updateMyProfile,
  searchUser,
  getUserById,
} = require("../controllers/userController");

const router = express.Router();

router.get("/me", authenticateUser, getMyProfile);

router.put("/me", authenticateUser, updateMyProfile);

router.get("/search", authenticateUser, searchUser);

router.get("/:id", authenticateUser, getUserById);

module.exports = router;
