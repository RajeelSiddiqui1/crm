import mongoose from "mongoose";

const subtaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: false, trim: true, maxlength: 200 },
    description: { type: String, required: false, maxlength: 1000 },
    
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FormSubmission",
      required: false,
    },

    teamLeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    depId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },

    // ✅ Yeh employee-specific status store karta hai
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
        completedAt: { type: Date }, // Employee-specific completion time
        feedback: { type: String }, // Employee-specific feedback
      },
    ],
    
    startDate: { type: Date, required: false },
    endDate: { type: Date, required: false },
    startTime: { type: String, required: false },
    endTime: { type: String, required: false },
    lead: { type: String, default: "1" },
    fileAttchmentUrl: { type: String, required: false },
    
    // ✅ Yeh overall subtask ka status hai (team lead set karta hai)
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "approved", "rejected"],
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
    
    // ✅ Team lead ke liye fields
    teamLeadApproved: { type: Boolean, default: false },
    teamLeadApprovedAt: { type: Date },
  },
  { timestamps: true }
);

// ✅ Middleware: Agar sab employees complete kar chuke hain, to overall status update ho
subtaskSchema.pre('save', function(next) {
  if (this.isModified('assignedEmployees')) {
    const allCompleted = this.assignedEmployees.every(
      emp => emp.status === 'completed' || emp.status === 'approved'
    );
    
    const anyInProgress = this.assignedEmployees.some(
      emp => emp.status === 'in_progress'
    );
    
    const anyRejected = this.assignedEmployees.some(
      emp => emp.status === 'rejected'
    );
    
    // Auto-update overall status based on employee statuses
    if (allCompleted && this.assignedEmployees.length > 0) {
      this.status = 'completed';
    } else if (anyInProgress) {
      this.status = 'in_progress';
    } else if (anyRejected) {
      this.status = 'pending'; // Ya koi aur logic aapka
    }
  }
  next();
});

subtaskSchema.index({ submissionId: 1, teamLeadId: 1 });
subtaskSchema.index({ teamLeadId: 1, status: 1 });
subtaskSchema.index({ "assignedEmployees.employeeId": 1 });
subtaskSchema.index({ createdAt: -1 });

export default mongoose.models.Subtask ||
  mongoose.model("Subtask", subtaskSchema);