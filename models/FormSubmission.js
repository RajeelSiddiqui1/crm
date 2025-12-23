// models/FormSubmission.js
import mongoose from "mongoose";

const formSubmissionSchema = new mongoose.Schema(
  {
    clinetName:{
      type:String,
      required:false
    },
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
      required: true,
    },
    depId:{
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
    sharedBy:{
       type: mongoose.Schema.Types.ObjectId,
        ref: "Manager"
    },
    multipleTeamLeadAssigned: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeamLead",
        default: [],
      },
    ],
     multipleTeamLeadShared: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeamLead",
        default: [],
      },
    ],
     sharedByTeamlead:{
       type: mongoose.Schema.Types.ObjectId,
        ref: "TeamLead"
    },
    assignedTo: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamLead",
    }],
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
      }
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

    teamLeadFeedback: {
      type: String,
      default: "",
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
      default: 0
    },
      teamLeadFeedbackReplies: [
      {
        employeeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
          required: true,
        },
        reply: {
          type: String,
          required: true,
        },
        repliedAt: {
          type: Date,
          default: Date.now,
        },
        // اگر کسی خاص فیڈ بیک کا جواب ہے تو
        feedbackId: {
          type: String, // یا ObjectId اگر آپ علیحدہ کولکشن بناتے ہیں
        }
      }
    ],

    // ایمپلائی کے فیڈ بیک پر کمنٹس (دوسرے ایمپلائی یا ٹیم لیڈز)
    feedbackComments: [
      {
        commentBy: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "feedbackComments.commenterModel",
          required: true,
        },
        commenterModel: {
          type: String,
          enum: ["Employee", "TeamLead", "Manager"],
          required: true,
        },
        commentOnEmployeeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
          required: true,
        },
        comment: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        // اگر کسی خاص فیڈ بیک کا جواب ہے
        feedbackId: {
          type: mongoose.Schema.Types.ObjectId,
        }
      }
    ]
  },
  { timestamps: true }
);

const FormSubmission =
  mongoose.models.FormSubmission ||
  mongoose.model("FormSubmission", formSubmissionSchema);

export default FormSubmission;
