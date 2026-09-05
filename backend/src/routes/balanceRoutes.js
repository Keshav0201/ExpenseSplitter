const express = require("express");

const authenticateUser = require("../middleware/authMiddleware");
const { requireGroupMember } = require("../middleware/groupMiddleware");

const { getBalances } = require("../controllers/balanceController");

const router = express.Router();

router.get(
  "/:groupId/balances",
  authenticateUser,
  requireGroupMember,
  getBalances
);

module.exports = router;
