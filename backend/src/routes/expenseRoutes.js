const express = require("express");

const authenticateUser = require("../middleware/authMiddleware");
const { requireGroupMember } = require("../middleware/groupMiddleware");

const {
  createNewExpense,
  getExpenses,
  getExpense,
  deleteExistingExpense,
  getMyExpenses
} = require("../controllers/expenseController");

const router = express.Router();

router.post(
  "/:groupId/expenses",
  authenticateUser,
  requireGroupMember,
  createNewExpense
);

router.get(
  "/:groupId/expenses",
  authenticateUser,
  requireGroupMember,
  getExpenses
);

router.get(
  "/:groupId/expenses/:expenseId",
  authenticateUser,
  requireGroupMember,
  getExpense
);

router.delete(
    "/:groupId/expenses/:expenseId",
    authenticateUser,
    requireGroupMember,
    deleteExistingExpense
);


module.exports = router;
