const express = require("express");

const authenticateUser = require("../middleware/authMiddleware");

const {
  getMyProfile,
  updateMyProfile,
  searchUser
} = require("../controllers/userController");

const router = express.Router();

router.get("/me", authenticateUser, getMyProfile);

router.put("/me", authenticateUser, updateMyProfile);

router.get("/search", authenticateUser, searchUser);

module.exports = router;
