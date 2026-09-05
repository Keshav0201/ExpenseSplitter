const {
  createExpense,
  getGroupExpenses,
  getExpenseById,
} = require("../services/expenseService");

const createNewExpense = async (req, res) => {
  try {
    const {
      description,
      amountPaise,
      paidBy,
      splitType,
      participants,
      category,
      expenseDate,
    } = req.body;

    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Description is required",
      });
    }

    if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a positive integer in paise",
      });
    }

    if (!paidBy) {
      return res.status(400).json({
        success: false,
        message: "Paid by is required",
      });
    }

    if (!splitType) {
      return res.status(400).json({
        success: false,
        message: "Split type is required",
      });
    }

    if (!Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Participants are required",
      });
    }

    const expense = await createExpense({
      groupId: req.params.groupId,
      description: description.trim(),
      amountPaise,
      paidBy,
      splitType,
      participants,
      category: category || "Other",
      expenseDate: expenseDate || new Date().toISOString(),
      createdBy: req.user.uid,
    });

    res.status(201).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error("Create expense error:", error);

    if (error.message === "GROUP_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    if (error.message === "PAYER_NOT_MEMBER") {
      return res.status(403).json({
        success: false,
        message: "Payer is not a group member",
      });
    }

    if (error.message === "PARTICIPANT_NOT_MEMBER") {
      return res.status(403).json({
        success: false,
        message: "All participants must be group members",
      });
    }

    const validationErrors = {
      INVALID_AMOUNT: "Invalid amount",
      INVALID_PARTICIPANTS: "Invalid participants",
      INVALID_PARTICIPANT: "Invalid participant",
      DUPLICATE_PARTICIPANTS: "Duplicate participants are not allowed",
      INVALID_SPLIT_TYPE: "Invalid split type",
      INVALID_EXACT_AMOUNT: "Invalid exact amount",
      EXACT_SPLIT_TOTAL_MISMATCH: "Exact amounts must equal the expense amount",
      INVALID_PERCENTAGE: "Invalid percentage",
      PERCENTAGE_TOTAL_MISMATCH: "Percentages must total 100",
    };

    if (validationErrors[error.message]) {
      return res.status(400).json({
        success: false,
        message: validationErrors[error.message],
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create expense",
    });
  }
};

const getExpenses = async (req, res) => {
  try {
    const expenses = await getGroupExpenses(req.params.groupId);

    res.status(200).json({
      success: true,
      data: expenses,
    });
  } catch (error) {
    console.error("Get expenses error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get expenses",
    });
  }
};

const getExpense = async (req, res) => {
  try {
    const expense = await getExpenseById(req.params.expenseId);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    if (expense.groupId !== req.params.groupId) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error("Get expense error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get expense",
    });
  }
};

module.exports = {
  createNewExpense,
  getExpenses,
  getExpense,
};
