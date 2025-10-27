import mongoose from "mongoose";

const teamLeadSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
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
        minlength: 6
    },
    profilePic: {
        type: String,
        required: false
    },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Manager"
    },
    depId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        required: true
    },
    startTime: { type: String, default: "09:00 AM" }, // ✅ Added
    endTime: { type: String, default: "05:00 PM" },
    otp: {
        type: String,
        default: null
    },
    otpExpiry: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// ✅ Use the same variable name
const TeamLead = mongoose.models.TeamLead || mongoose.model("TeamLead", teamLeadSchema);

// ✅ Fix the export name (capitalization)
export default TeamLead;
