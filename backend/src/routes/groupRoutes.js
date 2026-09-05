const express = require("express");

const authenticateUser = require("../middleware/authMiddleware");

const {
  requireGroupMember,
  requireGroupAdmin,
} = require("../middleware/groupMiddleware");

const {
  createNewGroup,
  getMyGroups,
  getSingleGroup,
  addGroupMember,
  removeGroupMember,
} = require("../controllers/groupController");

const router = express.Router();

router.post("/", authenticateUser, createNewGroup);

router.get("/", authenticateUser, getMyGroups);

router.get("/:groupId", authenticateUser, requireGroupMember, getSingleGroup);

router.post(
  "/:groupId/members",
  authenticateUser,
  requireGroupMember,
  requireGroupAdmin,
  addGroupMember
);

router.delete(
  "/:groupId/members/:userId",
  authenticateUser,
  requireGroupMember,
  requireGroupAdmin,
  removeGroupMember
);

module.exports = router;
