const usermodel = require('../model/userModel');
// const bcrypt = require('bcrypt');

const registrationController = async (req, res) => {
    const {
        username,
        email,
        password,
        profileImage,
        address,
        phone,
        gender,
        dateOfBirth
    } = req.body
    
    try {

        if (!username) {
            return res.status(400).json({
                success: false,
                message: "Username is required"
            });
        }
        if (username.length < 4 || username.length > 20) {
            return res.status(400).json({
                success: false,
                message: "Username must be between 4 and 20 characters long"
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
        const checks = [{
                test: p => p.length >= 8,
                msg: "Password must be at least 8 characters long"
            },
            {
                test: p => /[A-Z]/.test(p),
                msg: "Password must include an uppercase letter"
            },
            {
                test: p => /[a-z]/.test(p),
                msg: "Password must include a lowercase letter"
            },
            {
                test: p => /\d/.test(p),
                msg: "Password must include a number"
            },
            {
                test: p => /[@$!%*?&]/.test(p),
                msg: "Password must include a special character(@$!%*?&)"
            }
        ];


        const failedCheck = checks.find(c => !c.test(password));

        if (failedCheck) {
            return res.status(400).json({
                success: false,
                message: failedCheck.msg
            });
        }
        if (gender && !['male', 'female', 'other'].includes(gender)) {
            return res.status(400).json({
                success: false,
                message: " Gender must be 'male', 'female', or 'other'"
            });
        }
        
 //   ==================== bcrypt password=======================      
//         const saltRounds =10;
//         const hashedPassword = await bcrypt.hash(password,saltRounds)

        const user = new usermodel({
            username: username,
            email: email,
            password: password,
            profileImage: profileImage || null,
            address: address || null,
            phone: phone || null,
            gender: gender || null,
            dateOfBirth: dateOfBirth || null
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
        // === === === === === === database save operation === === === === === === === === ==
        //     const user = await usermodel.create({
        //         username: username,
        //         email: email,
        //         password: password,
        //         profileImage: profileImage || null,
        //         address: address || null,
        //         phone: phone || null,
        //         gender: gender || null,
        //         dateOfBirth: dateOfBirth || null
        //     });
        // await user.save();



        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: user
        });

    } catch (error) {
        console.error("Registration Error:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating user",
            error: error.message
        });
    }

}
const imageUpload = async (req, res) => {
    try {
        console.log(req.file);

        if (!req.file) {
            return res.status(400).json({
                error: "No image was uploaded!"
            });
        }
        const imageUrl = req.file.path;
        res.status(200).json({
            message: "Image uploaded successfully",
            url: imageUrl
        });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({
            success: false,
            message: "Image upload failed!",
            error: error.message
        });
    }
}
module.exports = {
    registrationController,
    imageUpload
}