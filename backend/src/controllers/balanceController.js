const { getGroupBalances } = require("../services/balanceService");

const getBalances = async (req, res) => {
  try {
    const balances = await getGroupBalances(req.params.groupId);

    res.status(200).json({
      success: true,
      data: balances,
    });
  } catch (error) {
    console.error("Get balances error:", error);

    if (error.message === "GROUP_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to calculate balances",
    });
  }
};

module.exports = {
  getBalances,
};
