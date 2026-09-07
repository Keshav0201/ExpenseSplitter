const { db } = require("../config/firebase");

const groupsCollection = db.collection("groups");

// ============================================================
// 1. CREATE GROUP
// ============================================================

const createGroup = async (groupData) => {
    const groupRef = groupsCollection.doc();

    const createdBy = groupData.createdBy;

    const group = {
        name: groupData.name,
        type: groupData.type || "group",
        createdBy,

        members: {
            [createdBy]: {
                role: "admin",
                joinedAt: new Date()
            }
        },

        balances: {
            [createdBy]: {
                paidPaise: 0,
                owedPaise: 0,
                balancePaise: 0
            }
        },

        createdAt: new Date(),
        updatedAt: new Date()
    };

    await groupRef.set(group);

    return {
        id: groupRef.id,
        ...group
    };
};

// ============================================================
// 2. GET USER GROUPS
// ============================================================

const getUserGroups = async (uid) => {
    const snapshot = await groupsCollection.get();

    const groups = [];

    snapshot.forEach((doc) => {
        const data = doc.data();

        if (data.members && data.members[uid]) {
            groups.push({
                id: doc.id,
                ...data
            });
        }
    });

    return groups;
};

// ============================================================
// 3. GET GROUP BY ID
// ============================================================

const getGroupById = async (groupId) => {
    const groupDoc = await groupsCollection
        .doc(groupId)
        .get();

    if (!groupDoc.exists) {
        return null;
    }

    return {
        id: groupDoc.id,
        ...groupDoc.data()
    };
};

// ============================================================
// 4. ADD MEMBER
// ============================================================

const addMember = async (groupId, userId) => {
    const groupRef = groupsCollection.doc(groupId);

    const groupDoc = await groupRef.get();

    if (!groupDoc.exists) {
        throw new Error("GROUP_NOT_FOUND");
    }

    const group = groupDoc.data();

    // Personal groups cannot have additional members
    if (group.type === "personal") {
        throw new Error("PERSONAL_GROUP_RESTRICTED");
    }

    if (group.members && group.members[userId]) {
        throw new Error("USER_ALREADY_MEMBER");
    }

    await groupRef.update({
        [`members.${userId}`]: {
            role: "member",
            joinedAt: new Date()
        },

        [`balances.${userId}`]: {
            paidPaise: 0,
            owedPaise: 0,
            balancePaise: 0
        },

        updatedAt: new Date()
    });

    return getGroupById(groupId);
};

// ============================================================
// 5. REMOVE MEMBER
// ============================================================

const removeMember = async (groupId, userId) => {
    const groupRef = groupsCollection.doc(groupId);

    const groupDoc = await groupRef.get();

    if (!groupDoc.exists) {
        throw new Error("GROUP_NOT_FOUND");
    }

    const group = groupDoc.data();

    // Personal groups cannot have members removed
    if (group.type === "personal") {
        throw new Error("PERSONAL_GROUP_RESTRICTED");
    }

    if (!group.members || !group.members[userId]) {
        throw new Error("USER_NOT_MEMBER");
    }

    if (group.createdBy === userId) {
        throw new Error("CANNOT_REMOVE_OWNER");
    }

    // Don't allow removing someone who still has a balance
    const userBalance =
        group.balances?.[userId]?.balancePaise || 0;

    if (userBalance !== 0) {
        throw new Error("MEMBER_HAS_OUTSTANDING_BALANCE");
    }

    await groupRef.update({
        [`members.${userId}`]:
            require("firebase-admin/firestore")
                .FieldValue.delete(),

        [`balances.${userId}`]:
            require("firebase-admin/firestore")
                .FieldValue.delete(),

        updatedAt: new Date()
    });

    return getGroupById(groupId);
};

module.exports = {
    createGroup,
    getUserGroups,
    getGroupById,
    addMember,
    removeMember
};