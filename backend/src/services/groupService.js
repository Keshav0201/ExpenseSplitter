const { db } = require("../config/firebase");

const groupsCollection = db.collection("groups");

const createGroup = async (groupData) => {
    const groupRef = groupsCollection.doc();

    const group = {
        name: groupData.name,
        createdBy: groupData.createdBy,

        members: {
            [groupData.createdBy]: {
                role: "admin",
                joinedAt: new Date()
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

const getGroupById = async (groupId) => {
    const groupDoc = await groupsCollection.doc(groupId).get();

    if (!groupDoc.exists) {
        return null;
    }

    return {
        id: groupDoc.id,
        ...groupDoc.data()
    };
};

const addMember = async (groupId, userId) => {
    const groupRef = groupsCollection.doc(groupId);

    const groupDoc = await groupRef.get();

    if (!groupDoc.exists) {
        throw new Error("GROUP_NOT_FOUND");
    }

    const group = groupDoc.data();

    if (group.members && group.members[userId]) {
        throw new Error("USER_ALREADY_MEMBER");
    }

    await groupRef.update({
        [`members.${userId}`]: {
            role: "member",
            joinedAt: new Date()
        },
        updatedAt: new Date()
    });

    return getGroupById(groupId);
};

const removeMember = async (groupId, userId) => {
    const groupRef = groupsCollection.doc(groupId);

    const groupDoc = await groupRef.get();

    if (!groupDoc.exists) {
        throw new Error("GROUP_NOT_FOUND");
    }

    const group = groupDoc.data();

    if (!group.members || !group.members[userId]) {
        throw new Error("USER_NOT_MEMBER");
    }

    if (group.createdBy === userId) {
        throw new Error("CANNOT_REMOVE_OWNER");
    }

    await groupRef.update({
        [`members.${userId}`]: require("firebase-admin/firestore").FieldValue.delete(),
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