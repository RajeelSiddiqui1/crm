
import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  date: { type: String, required: true },
  status: { type: String, enum: ["Present", "Late", "Absent"], default: "Present" },
  timestamp: { type: Date, default: Date.now },
  timeMarked: { type: String },
});

export default mongoose.models.Attendance ||
  mongoose.model("Attendance", AttendanceSchema);
