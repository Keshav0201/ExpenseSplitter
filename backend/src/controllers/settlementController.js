const {
  calculateSettlements,
  createSettlement,
  getGroupSettlements,
  getSettlementById,
  completeSettlement
} = require("../services/settlementService");

// GET settlement suggestions
const getSettlements = async (req, res) => {
  try {
    const settlements = await calculateSettlements(req.params.groupId);

    res.status(200).json({
      success: true,
      data: settlements,
    });
  } catch (error) {
    console.error("Get settlements error:", error);

    if (error.message === "GROUP_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to calculate settlements",
    });
  }
};

// POST create settlement
const createNewSettlement = async (req, res) => {
  try {
    const { from, to, amountPaise } = req.body;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: "From and to users are required",
      });
    }

    if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a positive integer in paise",
      });
    }

    const settlement = await createSettlement({
      groupId: req.params.groupId,
      from,
      to,
      amountPaise,
      createdBy: req.user.uid,
    });

    res.status(201).json({
      success: true,
      data: settlement,
    });
  } catch (error) {
    console.error("Create settlement error:", error);

    if (error.message === "GROUP_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    if (
      error.message === "PAYER_NOT_MEMBER" ||
      error.message === "RECEIVER_NOT_MEMBER"
    ) {
      return res.status(403).json({
        success: false,
        message: "Both users must be members of the group",
      });
    }

    if (error.message === "INVALID_SETTLEMENT_USERS") {
      return res.status(400).json({
        success: false,
        message: "A user cannot settle with themselves",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create settlement",
    });
  }
};

// GET all settlements
const getAllSettlements = async (req, res) => {
  try {
    const settlements = await getGroupSettlements(req.params.groupId);

    res.status(200).json({
      success: true,
      data: settlements,
    });
  } catch (error) {
    console.error("Get settlements error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get settlements",
    });
  }
};

// GET one settlement
const getSettlement = async (req, res) => {
  try {
    const settlement = await getSettlementById(req.params.settlementId);

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: "Settlement not found",
      });
    }

    // Make sure settlement belongs to requested group
    if (settlement.groupId !== req.params.groupId) {
      return res.status(404).json({
        success: false,
        message: "Settlement not found",
      });
    }

    res.status(200).json({
      success: true,
      data: settlement,
    });
  } catch (error) {
    console.error("Get settlement error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get settlement",
    });
  }
};

const completeExistingSettlement = async (req, res) => {

    try {

        const settlement = await completeSettlement(
            req.params.settlementId,
            req.user.uid
        );

        res.status(200).json({
            success: true,
            data: settlement
        });

    } catch (error) {

        console.error(
            "Complete settlement error:",
            error
        );

        if (error.message === "SETTLEMENT_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Settlement not found"
            });
        }

        if (error.message === "NOT_SETTLEMENT_PAYER") {
            return res.status(403).json({
                success: false,
                message: "Only the payer can complete this settlement"
            });
        }

        if (error.message === "SETTLEMENT_ALREADY_COMPLETED") {
            return res.status(400).json({
                success: false,
                message: "Settlement is already completed"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to complete settlement"
        });
    }
};

module.exports = {
  getSettlements,
  createNewSettlement,
  getAllSettlements,
  getSettlement,
  completeExistingSettlement
};
