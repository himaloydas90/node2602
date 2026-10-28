const userModel = require("../model/userModel")

function formatUser(user) {
    return {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        address: user.address,
        phone: user.phone,
        gender: user.gender,
        dob: user.dob,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
}

const getAllUserController = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const loggedInUser = await userModel.findById(loggedInUserId);
        const users = await userModel.find({
            _id: {
                $ne: loggedInUserId
            }
        });
        return res.status(200).json({
            success: true,
            message: ' Users fetched successfully',
            data: {
                user : users.map(formatUser),
                length: users.length
            },
            loggedInUser: loggedInUser
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Data fetching failed',
            error: error.message
        });
    }

}
module.exports = {
    getAllUserController
}