const { db } = require("../config/firebase");

const getGroupBalances = async (groupId) => {
  // Get group
  const groupDoc = await db.collection("groups").doc(groupId).get();

  if (!groupDoc.exists) {
    throw new Error("GROUP_NOT_FOUND");
  }

  const group = groupDoc.data();

  // Get expenses
  const expenseSnapshot = await db
    .collection("expenses")
    .where("groupId", "==", groupId)
    .get();

  // Get settlements
  const settlementSnapshot = await db
    .collection("settlements")
    .where("groupId", "==", groupId)
    .get();

  // Initialize balances
  const balances = {};

  for (const userId of Object.keys(group.members || {})) {
    balances[userId] = {
      userId,
      paidPaise: 0,
      owedPaise: 0,
      settledPaise: 0,
      balancePaise: 0,
    };
  }

  // Process expenses
  expenseSnapshot.forEach((doc) => {
    const expense = doc.data();

    // Money paid by user
    if (balances[expense.paidBy]) {
      balances[expense.paidBy].paidPaise += expense.amountPaise;
    }

    // Money owed by participants
    for (const participant of expense.participants) {
      const userId = participant.userId;

      if (balances[userId]) {
        balances[userId].owedPaise += participant.amountPaise;
      }
    }
  });

  // Process completed settlements
  settlementSnapshot.forEach((doc) => {
    const settlement = doc.data();

    // Ignore pending settlements
    if (settlement.status !== "completed") {
      return;
    }

    const from = settlement.from;
    const to = settlement.to;
    const amount = settlement.amountPaise;

    // The person who paid gets their debt reduced
    if (balances[from]) {
      balances[from].settledPaise += amount;
    }

    // The person who received money gets their credit reduced
    if (balances[to]) {
      balances[to].settledPaise += amount;
    }
  });

  // Calculate final balance
  for (const userId of Object.keys(balances)) {
    const user = balances[userId];

    const originalBalance = user.paidPaise - user.owedPaise;

    if (originalBalance > 0) {
      // Creditor
      user.balancePaise = originalBalance - user.settledPaise;
    } else if (originalBalance < 0) {
      // Debtor
      user.balancePaise = originalBalance + user.settledPaise;
    } else {
      user.balancePaise = 0;
    }
  }

  return Object.values(balances);
};

module.exports = {
  getGroupBalances,
};
