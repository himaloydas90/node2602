const usermodel = require('../model/userModel');
const authController =  async (req, res) => {
    const {
        username,
        email,
        password
    } = req.body
     try {

        if (!username) {
            return res.status(400).json({
                success: false,
                message: "Username is required"
            });
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const emailRegex = /^[a-zA-Z0-9.\_%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format!"
            });
        }

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password is required"
            });
        }

        const user = new usermodel({
            username: username,
            email: email,
            password: password
        });

        const existingUser = await usermodel.findOne({
            email
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered!"
            });
        }

        await user.save();

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: user
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error creating user",
            error: error.message
        });
    }

}
module.exports = authController;