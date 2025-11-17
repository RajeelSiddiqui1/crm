import mongoose from "mongoose";

const subtaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 1000 },
    // ✅ FIX: Correct reference name — matches actual model file
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmployeeFormSubmission",
      required: true,
    },
    teamLeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamLead",
      required: true,
    },
    assignedEmployees: [
      {
        employeeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
          required: true,
        },
        email: { type: String, required: true, trim: true },
        status: {
          type: String,
          enum: ["pending", "in_progress", "completed", "rejected"],
          default: "pending",
        },
        assignedAt: { type: Date, default: Date.now },
      },
    ],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    lead: { type: String, default: "1" },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "rejected"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    attachments: [
      {
        filename: String,
        originalName: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    teamLeadFeedback: String,
    completedAt: Date,
  },
  { timestamps: true }
);

subtaskSchema.index({ submissionId: 1, teamLeadId: 1 });
subtaskSchema.index({ teamLeadId: 1, status: 1 });
subtaskSchema.index({ "assignedEmployees.employeeId": 1 });
subtaskSchema.index({ createdAt: -1 });

// ✅ FIX: Safe export for Next.js hot reload
export default mongoose.models.Subtask ||
  mongoose.model("Subtask", subtaskSchema);
