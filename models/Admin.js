import mongoose from "mongoose";

const adminSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    profilePic: {
        type: String,
        required: false
    },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    otp: {
        type: String,
        default: null,
    },
    otpExpiry: {
        type: Date,
        default: null,
    },

},
    {
        timestamps: true
    })

const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema)

export default Admin;