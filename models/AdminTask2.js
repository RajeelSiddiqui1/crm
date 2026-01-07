// models/AdminTask2.js - Updated Schema
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

const fileAttachmentSchema = new Schema({
  url: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  publicId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const audioFileSchema = new Schema({
  url: {
    type: String,
    required: true
  },
  name: {
    type: String,
    default: "Voice Recording"
  },
  type: {
    type: String,
    default: "audio/webm"
  },
  size: {
    type: Number,
    required: true
  },
  publicId: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: false
  },
  isRecording: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

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

    // Multiple files support
    fileAttachments: [fileAttachmentSchema],

    // Multiple audio files support
    audioFiles: [audioFileSchema],

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
  },
  { timestamps: true }
);

const AdminTask2 = models.AdminTask2 || model("AdminTask2", adminTaskSchema2);

export default AdminTask2;