const { db } = require("../config/firebase");
const {
    getGroupBalances
} = require("./balanceService");

const settlementsCollection = db.collection("settlements");


// Calculate settlement suggestions
const calculateSettlements = async (groupId) => {

    const balances = await getGroupBalances(groupId);

    const creditors = [];
    const debtors = [];

    for (const user of balances) {

        if (user.balancePaise > 0) {
            creditors.push({
                userId: user.userId,
                amountPaise: user.balancePaise
            });
        }

        if (user.balancePaise < 0) {
            debtors.push({
                userId: user.userId,
                amountPaise: Math.abs(user.balancePaise)
            });
        }
    }

    const settlements = [];

    let creditorIndex = 0;
    let debtorIndex = 0;

    while (
        creditorIndex < creditors.length &&
        debtorIndex < debtors.length
    ) {

        const creditor = creditors[creditorIndex];
        const debtor = debtors[debtorIndex];

        const settlementAmount = Math.min(
            creditor.amountPaise,
            debtor.amountPaise
        );

        settlements.push({
            from: debtor.userId,
            to: creditor.userId,
            amountPaise: settlementAmount
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


// Create a settlement record
const createSettlement = async (settlementData) => {

    const {
        groupId,
        from,
        to,
        amountPaise,
        createdBy
    } = settlementData;

    const groupDoc = await db
        .collection("groups")
        .doc(groupId)
        .get();

    if (!groupDoc.exists) {
        throw new Error("GROUP_NOT_FOUND");
    }

    const group = groupDoc.data();

    // Both users must belong to the group
    if (!group.members?.[from]) {
        throw new Error("PAYER_NOT_MEMBER");
    }

    if (!group.members?.[to]) {
        throw new Error("RECEIVER_NOT_MEMBER");
    }

    // Cannot pay yourself
    if (from === to) {
        throw new Error("INVALID_SETTLEMENT_USERS");
    }

    // Validate amount
    if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
        throw new Error("INVALID_AMOUNT");
    }

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
        completedAt: null
    };

    await settlementRef.set(settlement);

    return {
        id: settlementRef.id,
        ...settlement
    };
};


// Get all settlements for a group
const getGroupSettlements = async (groupId) => {

    const snapshot = await settlementsCollection
        .where("groupId", "==", groupId)
        .get();

    const settlements = [];

    snapshot.forEach((doc) => {
        settlements.push({
            id: doc.id,
            ...doc.data()
        });
    });

    return settlements;
};


// Get one settlement
const getSettlementById = async (settlementId) => {

    const settlementDoc = await settlementsCollection
        .doc(settlementId)
        .get();

    if (!settlementDoc.exists) {
        return null;
    }

    return {
        id: settlementDoc.id,
        ...settlementDoc.data()
    };
};

const completeSettlement = async (settlementId, userId) => {

    const settlementRef = settlementsCollection.doc(settlementId);

    const settlementDoc = await settlementRef.get();

    if (!settlementDoc.exists) {
        throw new Error("SETTLEMENT_NOT_FOUND");
    }

    const settlement = settlementDoc.data();

    // Only the person who needs to pay can complete it
    if (settlement.from !== userId) {
        throw new Error("NOT_SETTLEMENT_PAYER");
    }

    // Prevent completing an already completed settlement
    if (settlement.status === "completed") {
        throw new Error("SETTLEMENT_ALREADY_COMPLETED");
    }

    await settlementRef.update({
        status: "completed",
        completedAt: new Date()
    });

    return getSettlementById(settlementId);
};

module.exports = {
    calculateSettlements,
    createSettlement,
    getGroupSettlements,
    getSettlementById,
    completeSettlement
};