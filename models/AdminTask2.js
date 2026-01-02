import mongoose, { Schema, model, models } from "mongoose";

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

    sharedBY: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "sharedByModel",
    },

    sharedByModel: {
      type: String,
      enum: ["TeamLead", "Employee"],
    },

    sharedTo: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "sharedToModel",
    },

    sharedToModel: {
      type: String,
      enum: ["TeamLead", "Employee"],
    },


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

const AdminTask2 =
  models.AdminTask2 || model("AdminTask2", adminTaskSchema2);

export default AdminTask2;
