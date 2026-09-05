const express = require("express");

const authenticateUser = require("../middleware/authMiddleware");
const { requireGroupMember } = require("../middleware/groupMiddleware");

const {
  getSettlements,
  createNewSettlement,
  getAllSettlements,
  getSettlement,
  completeExistingSettlement,
} = require("../controllers/settlementController");

const router = express.Router();

// Calculate settlement suggestions
router.get(
  "/:groupId/settlements",
  authenticateUser,
  requireGroupMember,
  getSettlements
);

// Create settlement record
router.post(
  "/:groupId/settlements",
  authenticateUser,
  requireGroupMember,
  createNewSettlement
);

// Get settlement history
router.get(
  "/:groupId/settlements/history",
  authenticateUser,
  requireGroupMember,
  getAllSettlements
);

// Get one settlement
router.get(
  "/:groupId/settlements/:settlementId",
  authenticateUser,
  requireGroupMember,
  getSettlement
);

router.patch(
  "/:groupId/settlements/:settlementId/complete",
  authenticateUser,
  requireGroupMember,
  completeExistingSettlement
);

module.exports = router;
