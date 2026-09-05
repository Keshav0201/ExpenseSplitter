const {
    createUserProfile,
    getUserProfile,
    updateUserProfile,
    searchUserByEmail
} = require("../services/userService");

const getMyProfile = async (req, res) => {
    try {
        const uid = req.user.uid;

        let profile = await getUserProfile(uid);

        if (!profile) {
            profile = await createUserProfile({
                uid: req.user.uid,
                name: req.user.name,
                email: req.user.email,
                photoURL: req.user.picture
            });
        }

        res.status(200).json({
            success: true,
            data: profile
        });

    } catch (error) {
        console.error("Get profile error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get user profile"
        });
    }
};

const updateMyProfile = async (req, res) => {
    try {
        const uid = req.user.uid;

        const profile = await updateUserProfile(uid, req.body);

        res.status(200).json({
            success: true,
            data: profile
        });

    } catch (error) {
        console.error("Update profile error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update user profile"
        });
    }
};

const searchUser = async (req, res) => {
    try {
        const { email } = req.query;

        if (!email || email.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const user = await searchUserByEmail(email);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error("Search user error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to search user"
        });
    }
};

const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await getUserProfile(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error("Get user by ID error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get user by ID"
        });
    }
};


module.exports = {
    getMyProfile,
    updateMyProfile,
    searchUser,
    getUserById
};