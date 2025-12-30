// models/FormSubmission.js
import mongoose from "mongoose";

const formSubmissionSchema = new mongoose.Schema(
  {
    clinetName: {
      type: String,
      required: false,
    },
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
      required: true,
    },
    depId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manager",
      required: true,
    },
    multipleManagerShared: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Manager",
        default: [],
      },
    ],
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manager",
    },
    multipleTeamLeadAssigned: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeamLead",
      },
    ],

    multipleTeamLeadShared: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeamLead",
        default: [],
      },
    ],
    sharedByTeamlead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamLead",
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeamLead",
      },
    ],
    claimedAt: {
      type: Date,
    },
    assignedEmployees: [
      {
        employeeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
          required: true,
        },
        email: {
          type: String,
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "in_progress", "completed", "rejected"],
          default: "pending",
        },
        assignedAt: {
          type: Date,
          default: Date.now,
        },
        completedAt: {
          type: Date,
        },
      },
    ],
    employeeFeedbacks: [
      {
        employeeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
          required: true,
        },
        feedback: {
          type: String,
          required: true,
        },
        submittedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    teamLeadFeedbacks: [
      {
        teamLeadId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "TeamLead",
          required: true,
        },
        feedback: {
          type: String,
          required: true,
        },
        submittedAt: {
          type: Date,
          default: Date.now,
        },
        replies: [
          {
            repliedBy: {
              type: mongoose.Schema.Types.ObjectId,
              required: true,
              refPath: "teamLeadFeedbacks.replies.repliedByModel",
            },
            repliedByModel: {
              type: String,
              required: true,
              enum: ["Employee", "TeamLead"],
            },
            reply: {
              type: String,
              required: true,
            },
            repliedAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
      },
    ],
    formData: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "approved", "rejected"],
      default: "pending",
    },
    status2: {
      type: String,
      enum: ["pending", "in_progress", "completed", "approved", "rejected"],
      default: "pending",
    },
    adminStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    managerComments: {
      type: String,
      default: "",
    },
    completedAt: {
      type: Date,
    },
    adminTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminTask",
    },
    sharedTasksCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const FormSubmission =
  mongoose.models.FormSubmission ||
  mongoose.model("FormSubmission", formSubmissionSchema);

export default FormSubmission;
