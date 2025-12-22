// models/SharedTask.js
import mongoose from "mongoose";

const sharedTaskSchema = new mongoose.Schema(
  {
    originalTaskId: {
      type: String,
      required: true,
    },
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmployeeFormSubmission",
      required: true,
    },
    taskTitle: {
      type: String,
      required: true,
    },
    taskDescription: {
      type: String,
      default: "",
    },
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manager",
    },
    sharedManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manager",
    },

    sharedTeamlead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamLead",
    },

    sharedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },

    sharedOperationManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manager",
    },
    sharedOperationTeamlead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamLead",
    },

    sharedOperationEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },

    dueDate: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "signed",
        "not_avaiable",
        "not_intrested",
        "re_shedule",
      ],
      default: "pending",
    },
    attachmentUrl: {
      type: String,
      default: null,
    },

    attachmentPublicId: {
      type: String,
      default: null,
    },

    attachmentUpdatedAt: {
      type: Date,
      default: null,
    },

    employeeFeedback: {
      type: String,
      default: "",
    },

    feedbackUpdatedAt: {
      type: Date,
      default: null,
    },
    VendorStatus: {
      type: String,
      enum: ["pending", "approved", "not_approved"],
      default: "pending",
    },
    MachineStatus: {
      type: String,
      enum: ["pending", "deployed", "cancelled"],
      default: "pending",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const SharedTask =
  mongoose.models.SharedTask || mongoose.model("SharedTask", sharedTaskSchema);
export default SharedTask;
