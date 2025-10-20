    import mongoose from "mongoose";

    const teamleadSchema = mongoose.Schema({
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
            minlength: 6,
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

    const Teamlead = mongoose.models.Teamlead || mongoose.model("Teamlead", teamleadSchema)

    export default Teamlead;