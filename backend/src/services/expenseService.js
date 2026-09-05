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
        createdBy
    } = expenseData;

    // Get group
    const groupDoc = await db
        .collection("groups")
        .doc(groupId)
        .get();

    if (!groupDoc.exists) {
        throw new Error("GROUP_NOT_FOUND");
    }

    const group = groupDoc.data();

    // Check payer is a group member
    if (!group.members?.[paidBy]) {
        throw new Error("PAYER_NOT_MEMBER");
    }

    // Check all participants are group members
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

    // Calculate final split
    const calculatedParticipants = calculateSplit(
        amountPaise,
        splitType,
        participants
    );

    // Create expense
    const expenseRef = expensesCollection.doc();

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
        updatedAt: new Date()
    };

    await expenseRef.set(expense);

    return {
        id: expenseRef.id,
        ...expense
    };
};

const getGroupExpenses = async (groupId) => {
    const snapshot = await expensesCollection
        .where("groupId", "==", groupId)
        .get();

    const expenses = [];

    snapshot.forEach((doc) => {
        expenses.push({
            id: doc.id,
            ...doc.data()
        });
    });

    return expenses;
};

const getExpenseById = async (expenseId) => {
    const expenseDoc = await expensesCollection
        .doc(expenseId)
        .get();

    if (!expenseDoc.exists) {
        return null;
    }

    return {
        id: expenseDoc.id,
        ...expenseDoc.data()
    };
};

module.exports = {
    createExpense,
    getGroupExpenses,
    getExpenseById
};