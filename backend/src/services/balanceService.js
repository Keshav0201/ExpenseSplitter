const { db } = require("../config/firebase");

const getGroupBalances = async (groupId) => {
    // Get group
    const groupDoc = await db
        .collection("groups")
        .doc(groupId)
        .get();

    if (!groupDoc.exists) {
        throw new Error("GROUP_NOT_FOUND");
    }

    const group = groupDoc.data();

    const balances = group.balances || {};

    // Return balances in the same format as before
    return Object.entries(balances).map(
        ([userId, balance]) => ({
            userId,

            paidPaise: balance.paidPaise || 0,

            owedPaise: balance.owedPaise || 0,

            balancePaise: balance.balancePaise || 0
        })
    );
};


module.exports = {
    getGroupBalances
};