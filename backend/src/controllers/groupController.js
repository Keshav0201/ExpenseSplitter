const {
    createGroup,
    getUserGroups,
    getGroupById,
    addMember,
    removeMember
} = require("../services/groupService");

const createNewGroup = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Group name is required"
            });
        }

        const group = await createGroup({
            name: name.trim(),
            createdBy: req.user.uid
        });

        res.status(201).json({
            success: true,
            data: group
        });

    } catch (error) {
        console.error("Create group error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create group"
        });
    }
};

const getMyGroups = async (req, res) => {
    try {
        const groups = await getUserGroups(req.user.uid);

        res.status(200).json({
            success: true,
            data: groups
        });

    } catch (error) {
        console.error("Get groups error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get groups"
        });
    }
};

const getSingleGroup = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: req.group
        });

    } catch (error) {
        console.error("Get group error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get group"
        });
    }
};

const addGroupMember = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const group = await addMember(
            req.params.groupId,
            userId
        );

        res.status(200).json({
            success: true,
            data: group
        });

    } catch (error) {
        console.error("Add member error:", error);

        if (error.message === "GROUP_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        if (error.message === "USER_ALREADY_MEMBER") {
            return res.status(409).json({
                success: false,
                message: "User is already a member"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to add member"
        });
    }
};

const removeGroupMember = async (req, res) => {
    try {
        const { userId } = req.params;

        const group = await removeMember(
            req.params.groupId,
            userId
        );

        res.status(200).json({
            success: true,
            data: group
        });

    } catch (error) {
        console.error("Remove member error:", error);

        if (error.message === "USER_NOT_MEMBER") {
            return res.status(404).json({
                success: false,
                message: "User is not a member"
            });
        }

        if (error.message === "CANNOT_REMOVE_OWNER") {
            return res.status(400).json({
                success: false,
                message: "Group owner cannot be removed"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to remove member"
        });
    }
};

module.exports = {
    createNewGroup,
    getMyGroups,
    getSingleGroup,
    addGroupMember,
    removeGroupMember
};