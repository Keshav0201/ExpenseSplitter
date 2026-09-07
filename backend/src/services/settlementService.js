const { db } = require("../config/firebase");
const { getGroupBalances } = require("./balanceService");

const settlementsCollection = db.collection("settlements");

// ============================================================
// 1. CALCULATE SETTLEMENT SUGGESTIONS
// ============================================================

const calculateSettlements = async (groupId) => {
  const balances = await getGroupBalances(groupId);

  const creditors = [];
  const debtors = [];

  for (const user of balances) {
    if (user.balancePaise > 0) {
      creditors.push({
        userId: user.userId,
        amountPaise: user.balancePaise,
      });
    }

    if (user.balancePaise < 0) {
      debtors.push({
        userId: user.userId,
        amountPaise: Math.abs(user.balancePaise),
      });
    }
  }

  const settlements = [];

  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];

    const settlementAmount = Math.min(creditor.amountPaise, debtor.amountPaise);

    settlements.push({
      from: debtor.userId,
      to: creditor.userId,
      amountPaise: settlementAmount,
    });

    creditor.amountPaise -= settlementAmount;
    debtor.amountPaise -= settlementAmount;

    if (creditor.amountPaise === 0) {
      creditorIndex++;
    }

    if (debtor.amountPaise === 0) {
      debtorIndex++;
    }
  }

  return settlements;
};

// ============================================================
// 2. CREATE SETTLEMENT
// ============================================================

const createSettlement = async (settlementData) => {
  const { groupId, from, to, amountPaise, createdBy } = settlementData;

  // --------------------------------------------------------
  // Check group
  // --------------------------------------------------------

  const groupDoc = await db.collection("groups").doc(groupId).get();

  if (!groupDoc.exists) {
    throw new Error("GROUP_NOT_FOUND");
  }

  const group = groupDoc.data();

  // --------------------------------------------------------
  // Check members
  // --------------------------------------------------------

  if (!group.members?.[from]) {
    throw new Error("PAYER_NOT_MEMBER");
  }

  if (!group.members?.[to]) {
    throw new Error("RECEIVER_NOT_MEMBER");
  }

  // --------------------------------------------------------
  // Cannot pay yourself
  // --------------------------------------------------------

  if (from === to) {
    throw new Error("INVALID_SETTLEMENT_USERS");
  }

  // --------------------------------------------------------
  // Validate amount
  // --------------------------------------------------------

  if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
    throw new Error("INVALID_AMOUNT");
  }

  // --------------------------------------------------------
  // Verify that this is a valid current suggestion
  // --------------------------------------------------------

  const suggestions = await calculateSettlements(groupId);

  const validSuggestion = suggestions.find(
    (suggestion) =>
      suggestion.from === from &&
      suggestion.to === to &&
      suggestion.amountPaise === amountPaise
  );

  if (!validSuggestion) {
    throw new Error("INVALID_SETTLEMENT");
  }

  // --------------------------------------------------------
  // Prevent duplicate PENDING settlement
  // --------------------------------------------------------

  const existingSnapshot = await settlementsCollection
    .where("groupId", "==", groupId)
    .where("from", "==", from)
    .where("to", "==", to)
    .where("amountPaise", "==", amountPaise)
    .where("status", "==", "pending")
    .limit(1)
    .get();

  if (!existingSnapshot.empty) {
    const existingDoc = existingSnapshot.docs[0];

    return {
      id: existingDoc.id,
      ...existingDoc.data(),
    };
  }

  // --------------------------------------------------------
  // Create Firestore document
  // --------------------------------------------------------

  const settlementRef = settlementsCollection.doc();

  const settlement = {
    groupId,
    from,
    to,
    amountPaise,
    currency: "INR",

    status: "pending",

    createdBy,

    createdAt: new Date(),
    completedAt: null,
  };

  await settlementRef.set(settlement);

  return {
    id: settlementRef.id,
    ...settlement,
  };
};

// ============================================================
// 3. GET GROUP SETTLEMENTS
// ============================================================

const getGroupSettlements = async (groupId) => {
  const snapshot = await settlementsCollection
    .where("groupId", "==", groupId)
    .get();

  const settlements = [];

  snapshot.forEach((doc) => {
    settlements.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  return settlements;
};

// ============================================================
// 4. GET ONE SETTLEMENT
// ============================================================

const getSettlementById = async (settlementId) => {
  const settlementDoc = await settlementsCollection.doc(settlementId).get();

  if (!settlementDoc.exists) {
    return null;
  }

  return {
    id: settlementDoc.id,
    ...settlementDoc.data(),
  };
};

// ============================================================
// 5. COMPLETE SETTLEMENT
// ============================================================

const completeSettlement = async (settlementId, userId) => {
  const settlementRef = settlementsCollection.doc(settlementId);

  const settlementDoc = await settlementRef.get();

  // --------------------------------------------------------
  // Check settlement
  // --------------------------------------------------------

  if (!settlementDoc.exists) {
    throw new Error("SETTLEMENT_NOT_FOUND");
  }

  const settlement = settlementDoc.data();

  // --------------------------------------------------------
  // Only payer can complete it
  // --------------------------------------------------------

  if (settlement.from !== userId) {
    throw new Error("NOT_SETTLEMENT_PAYER");
  }

  // --------------------------------------------------------
  // Prevent duplicate completion
  // --------------------------------------------------------

  if (settlement.status === "completed") {
    throw new Error("SETTLEMENT_ALREADY_COMPLETED");
  }

  // --------------------------------------------------------
  // Complete settlement
  // --------------------------------------------------------

  await settlementRef.update({
    status: "completed",
    completedAt: new Date(),
  });

  return getSettlementById(settlementId);
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  calculateSettlements,

  createSettlement,

  getGroupSettlements,

  getSettlementById,

  completeSettlement,
};
