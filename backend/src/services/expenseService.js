const { db } = require("../config/firebase");
const { calculateSplit } = require("../utils/splitCalculator");

const expensesCollection = db.collection("expenses");

const createExpense = async (expenseData) => {
  const {
    groupId,
    description,
    amountPaise,
    paidBy,
    splitType,
    participants,
    category,
    expenseDate,
    createdBy,
  } = expenseData;

  const groupRef = db.collection("groups").doc(groupId);
  const expenseRef = expensesCollection.doc();

  const result = await db.runTransaction(async (transaction) => {
    // --------------------------------------------------------
    // 1. Get group
    // --------------------------------------------------------

    const groupDoc = await transaction.get(groupRef);

    if (!groupDoc.exists) {
      throw new Error("GROUP_NOT_FOUND");
    }

    const group = groupDoc.data();

    // --------------------------------------------------------
    // 2. Check payer
    // --------------------------------------------------------

    if (!group.members?.[paidBy]) {
      throw new Error("PAYER_NOT_MEMBER");
    }

    // --------------------------------------------------------
    // 3. Check participants
    // --------------------------------------------------------

    const participantIds = participants.map((participant) => {
      if (typeof participant === "string") {
        return participant;
      }

      return participant.userId;
    });

    for (const userId of participantIds) {
      if (!group.members?.[userId]) {
        throw new Error("PARTICIPANT_NOT_MEMBER");
      }
    }

    // --------------------------------------------------------
    // 4. Calculate split
    // --------------------------------------------------------

    const calculatedParticipants = calculateSplit(
      amountPaise,
      splitType,
      participants
    );

    // --------------------------------------------------------
    // 5. Create expense
    // --------------------------------------------------------

    const expense = {
      groupId,
      description,
      amountPaise,
      currency: "INR",

      paidBy,

      splitType,

      participants: calculatedParticipants,

      category,

      expenseDate,

      createdBy,

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    transaction.set(expenseRef, expense);

    // --------------------------------------------------------
    // 6. Get existing balances
    // --------------------------------------------------------

    const balances = group.balances || {};

    // Make sure every group member has a balance
    for (const userId of Object.keys(group.members)) {
      if (!balances[userId]) {
        balances[userId] = {
          paidPaise: 0,
          owedPaise: 0,
          balancePaise: 0,
        };
      }
    }

    // --------------------------------------------------------
    // 7. Update payer's balance
    // --------------------------------------------------------

    balances[paidBy].paidPaise += amountPaise;

    balances[paidBy].balancePaise += amountPaise;

    // --------------------------------------------------------
    // 8. Update participants' balances
    // --------------------------------------------------------

    for (const participant of calculatedParticipants) {
      const userId = participant.userId;
      const amount = participant.amountPaise;

      balances[userId].owedPaise += amount;

      balances[userId].balancePaise -= amount;
    }

    // --------------------------------------------------------
    // 9. Update group
    // --------------------------------------------------------

    transaction.update(groupRef, {
      balances,
      updatedAt: new Date(),
    });

    return {
      id: expenseRef.id,
      ...expense,
    };
  });

  return result;
};

const getGroupExpenses = async (groupId) => {
  const snapshot = await expensesCollection
    .where("groupId", "==", groupId)
    .get();

  const expenses = [];

  snapshot.forEach((doc) => {
    expenses.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  return expenses;
};

const getExpenseById = async (expenseId) => {
  const expenseDoc = await expensesCollection.doc(expenseId).get();

  if (!expenseDoc.exists) {
    return null;
  }

  return {
    id: expenseDoc.id,
    ...expenseDoc.data(),
  };
};

const getUserExpensesFromDate = async (uid, fromDate) => {
  const today = new Date().toISOString().split("T")[0];

  const snapshot = await expensesCollection
    .where("expenseDate", ">=", fromDate)
    .where("expenseDate", "<=", today)
    .get();

  const expenses = [];

  snapshot.forEach((doc) => {
    const expense = doc.data();

    const isParticipant = expense.participants?.some(
      (participant) => participant.userId === uid
    );

    if (isParticipant) {
      expenses.push({
        date: expense.expenseDate,
        amountPaise: expense.amountPaise,
      });
    }
  });

  return expenses;
};

module.exports = {
  createExpense,
  getGroupExpenses,
  getExpenseById,
  getUserExpensesFromDate,
};
