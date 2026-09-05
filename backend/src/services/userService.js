const { db } = require("../config/firebase");

const usersCollection = db.collection("users");

const createUserProfile = async (userData) => {
    const userRef = usersCollection.doc(userData.uid);

    const userDoc = await userRef.get();

    if (userDoc.exists) {
        return userDoc.data();
    }

    const profile = {
        uid: userData.uid,
        name: userData.name || "",
        email: userData.email || "",
        photoURL: userData.photoURL || "",
        upiId: null,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    await userRef.set(profile);

    return profile;
};

const getUserProfile = async (uid) => {
    const userDoc = await usersCollection.doc(uid).get();

    if (!userDoc.exists) {
        return null;
    }

    return userDoc.data();
};

const updateUserProfile = async (uid, updates) => {
    const allowedFields = [
        "name",
        "upiId",
        "photoURL"
    ];

    const filteredUpdates = {};

    for (const field of allowedFields) {
        if (updates[field] !== undefined) {
            filteredUpdates[field] = updates[field];
        }
    }

    filteredUpdates.updatedAt = new Date();

    await usersCollection.doc(uid).update(filteredUpdates);

    return getUserProfile(uid);
};

const searchUserByEmail = async (email) => {
    const snapshot = await usersCollection
        .where("email", "==", email.toLowerCase().trim())
        .limit(1)
        .get();

    if (snapshot.empty) {
        return null;
    }

    const doc = snapshot.docs[0];
    const user = doc.data();

    return {
        uid: user.uid,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL
    };
};

module.exports = {
    createUserProfile,
    getUserProfile,
    updateUserProfile,
    searchUserByEmail
};