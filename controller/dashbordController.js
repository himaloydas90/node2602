const userModel = require("../model/userModel")

 const getAllUserController = async (req,res)=>{
    try {
        const loggedInUserId = req.user._id;
        const users = await userModel.find({ _id: { $ne: loggedInUserId } });
        return res.status(200).json({
        success : true,
        message : ' Users fetched successfully',
        data : users
      });
    
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Data fetching failed',
            error: error.message
        });
    }
    
}
module.exports = {getAllUserController}