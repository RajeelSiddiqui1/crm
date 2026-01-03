// models/AdminTask2.js - Fixed Schema
import mongoose, { Schema, model, models } from "mongoose";

const shareSchema = new Schema({
  sharedTo: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  sharedToModel: {
    type: String,
    enum: ["TeamLead", "Employee"],
    required: true
  },
  sharedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  sharedByModel: {
    type: String,
    enum: ["TeamLead", "Employee"],
    required: true
  },
  sharedAt: {
    type: Date,
    default: Date.now
  },
  canRemove: {
    type: Boolean,
    default: true
  }
}, { _id: true });

const adminTaskSchema2 = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: ""
    },
    
    clientName: String,

    fileAttachments: String,
    fileName: String,
    fileType: String,

    audioUrl: String,

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },

    endDate: Date,

    // Original sharer
    sharedBY: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "sharedByModel",
    },
    sharedByModel: {
      type: String,
      enum: ["TeamLead", "Employee"],
    },

    // Current sharing details
    shares: [shareSchema],

    teamleads: [
      {
        teamleadId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "TeamLead",
        },
        status: {
          type: String,
          enum: ["pending", "in_progress", "completed", "overdue"],
          default: "pending",
        },
        assignedAt: {
          type: Date,
          default: Date.now,
        },
        completedAt: Date,
        sharedBy: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "teamleads.sharedByModel"
        },
        sharedByModel: {
          type: String,
          enum: ["TeamLead", "Employee"]
        }
      },
    ],

    employees: [
      {
        employeeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        status: {
          type: String,
          enum: ["pending", "in_progress", "completed", "overdue"],
          default: "pending",
        },
        assignedAt: {
          type: Date,
          default: Date.now,
        },
        completedAt: Date,
        sharedBy: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "employees.sharedByModel"
        },
        sharedByModel: {
          type: String,
          enum: ["TeamLead", "Employee"]
        }
      },
    ],

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },

    departments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
      },
    ],

    isLate: {
      type: Boolean,
      default: false,
    },

    completedAt: Date,

    filePublicId: String,
    audioPublicId: String,
  },
  { timestamps: true }
);

const AdminTask2 = models.AdminTask2 || model("AdminTask2", adminTaskSchema2);

export default AdminTask2;