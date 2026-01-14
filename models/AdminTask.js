import mongoose, { Schema, model, models } from "mongoose";

const adminTaskSchema = Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    clientName: {
      type: String,
      required: false,
    },
    // Multiple files array
    fileAttachments: [
      {
        url: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          required: true,
        },
        size: {
          type: Number,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Multiple audio files array
    audioFiles: [
      {
        url: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          required: true,
        },
        size: {
          type: Number,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
        duration: {
          type: Number,
          required: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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
    // Manager responses array
    managerResponses: [
      {
        managerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Manager",
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "in-progress", "rejected", "completed"],
          default: "pending",
        },
        feedback: {
          type: String,
          default: "",
        },
        submittedFiles: [
          {
            url: String,
            name: String,
            type: String,
            size: Number,
            publicId: String,
            uploadedAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
        submittedAt: {
          type: Date,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: false,
    },
    departments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        default: [],
      },
    ],
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
    },
  },
  {
    timestamps: true,
  }
);

const AdminTask = models.AdminTask || model("AdminTask", adminTaskSchema);

export default AdminTask;