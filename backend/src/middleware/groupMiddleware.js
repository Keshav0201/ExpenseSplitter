const { getGroupById } = require("../services/groupService");

const requireGroupMember = async (req, res, next) => {
    try {
        const group = await getGroupById(req.params.groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found"
            });
        }

        const member = group.members?.[req.user.uid];

        if (!member) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this group"
            });
        }

        req.group = group;
        req.groupMember = member;

        next();

    } catch (error) {
        console.error("Group authorization error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to authorize group access"
        });
    }
};

const requireGroupAdmin = async (req, res, next) => {
    try {
        const group = req.group;

        if (!group) {
            return res.status(500).json({
                success: false,
                message: "Group information missing"
            });
        }

        if (req.groupMember.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access required"
            });
        }

        next();

    } catch (error) {
        console.error("Group admin authorization error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to authorize admin access"
        });
    }
};

module.exports = {
    requireGroupMember,
    requireGroupAdmin
};