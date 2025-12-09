// models/AdminTask.js
import mongoose, { Schema, model, models } from "mongoose";

const adminTaskSchema = Schema(
  {
    title: {
      type: String,
      required: true,
    },
    clientName: {
      type: String,
      required: false,
    },
    fileAttachments: {
      type: String,
      required: false,
    },
    audioUrl: {
      type: String,
      required: false, // Fixed: removed duplicate required
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
      required: false,
    },
    endDate: {
      type: Date,
      required: false,
    },
    sharedBYManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manager",
      required: false,
    },
    managers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Manager",
      },
    ],
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: false,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "overdue"],
      default: "pending",
    },
    completedAt: {
      type: Date,
      required: false,
    }
  },
  {
    timestamps: true, // Fixed: changed from timestamp to timestamps
  }
);

const AdminTask = models.AdminTask || model("AdminTask", adminTaskSchema);

export default AdminTask;