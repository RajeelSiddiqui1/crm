import mongoose from "mongoose";

const managerSchema = mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    profilePic: { type: String, required: false },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    departments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Department" }],
    verified: { type: Boolean, default: false },
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    lastOtpSentAt: { type: Date, default: null },
    otpAttempts: {
      type: Number,
      default: 0,
    },
    otpLockedUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Manager =
  mongoose.models.Manager || mongoose.model("Manager", managerSchema);

export default Manager;
