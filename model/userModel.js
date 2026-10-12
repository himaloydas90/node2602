const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const {
    Schema
} = mongoose;

const userSchema =  new Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    profileImage: {
        type: String,
        default: null
    },
    address: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        default: null
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        default: null
    },
    dateOfBirth: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
}, );
userSchema.pre('save', async function () {
    if(!this.isModified('password')){
        return 
    }
    this.password = await bcrypt.hash(this.password,10);
});
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};
module.exports = mongoose.model('User', userSchema);