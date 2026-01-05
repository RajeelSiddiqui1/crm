import mongoose from "mongoose";

// models/Subtask.js - Update the schema
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
      ref: "TeamLead",
      required: true,
    },

    depId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },

    // ✅ Employees ke liye
    assignedEmployees: [
      {
        employeeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
          required: false,
        },
        email: { type: String, required: true, trim: true },
        name: { type: String, required: false },
        status: {
          type: String,
          enum: ["pending", "in_progress", "completed", "rejected"],
          default: "pending",
        },
        assignedAt: { type: Date, default: Date.now },
        completedAt: { type: Date },
        feedback: { type: String },
        leadsCompleted: { type: Number, default: 0 },
        leadsAssigned: { type: Number, default: 0 },
      },
    ],

    // ✅ Managers ke liye
    assignedManagers: [
      {
        managerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Manager",
          required: false,
        },
        email: { type: String, required: true, trim: true },
        name: { type: String, required: false },
        status: {
          type: String,
          enum: ["pending", "in_progress", "completed", "rejected"],
          default: "pending",
        },
        assignedAt: { type: Date, default: Date.now },
        completedAt: { type: Date },
        feedback: { type: String },
        leadsCompleted: { type: Number, default: 0 },
        leadsAssigned: { type: Number, default: 0 },
      },
    ],

    // ✅ TeamLeads ke liye (NEW)
    assignedTeamLeads: [
      {
        teamLeadId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "TeamLead",
          required: false,
        },
        email: { type: String, required: true, trim: true },
        name: { type: String, required: false },
        status: {
          type: String,
          enum: ["pending", "in_progress", "completed", "rejected"],
          default: "pending",
        },
        assignedAt: { type: Date, default: Date.now },
        completedAt: { type: Date },
        feedback: { type: String },
        leadsCompleted: { type: Number, default: 0 },
        leadsAssigned: { type: Number, default: 0 },
      },
    ],

    // Rest of the schema remains same...
    startDate: { type: Date, required: false },
    endDate: { type: Date, required: false },
    startTime: { type: String, required: false },
    endTime: { type: String, required: false },
    lead: { type: String, default: "1" },
    fileAttachmentUrl: { type: String, required: false },

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

    // ✅ Additional fields for lead tracking
    totalLeadsRequired: { type: Number, default: 0 },
    leadsCompleted: { type: Number, default: 0 },
    hasLeadsTarget: { type: Boolean, default: false },

    teamLeadApproved: { type: Boolean, default: false },
    teamLeadApprovedAt: { type: Date },
  },
  { timestamps: true }
);

// ✅ Middleware: Update to include team leads
subtaskSchema.pre('save', function (next) {
  // Check employees
  if (this.isModified('assignedEmployees')) {
    const allEmployeesCompleted = this.assignedEmployees.length > 0 &&
      this.assignedEmployees.every(emp =>
        emp.status === 'completed' || emp.status === 'approved'
      );

    const anyEmployeeInProgress = this.assignedEmployees.some(
      emp => emp.status === 'in_progress'
    );

    if (allEmployeesCompleted) {
      this.status = 'completed';
    } else if (anyEmployeeInProgress) {
      this.status = 'in_progress';
    }
  }

  // Check managers
  if (this.isModified('assignedManagers')) {
    const allManagersCompleted = this.assignedManagers.length > 0 &&
      this.assignedManagers.every(mgr =>
        mgr.status === 'completed' || mgr.status === 'approved'
      );

    const anyManagerInProgress = this.assignedManagers.some(
      mgr => mgr.status === 'in_progress'
    );

    if (allManagersCompleted) {
      this.status = 'completed';
    } else if (anyManagerInProgress && this.status !== 'in_progress') {
      this.status = 'in_progress';
    }
  }

  // Check team leads
  if (this.isModified('assignedTeamLeads')) {
    const allTeamLeadsCompleted = this.assignedTeamLeads.length > 0 &&
      this.assignedTeamLeads.every(tl =>
        tl.status === 'completed' || tl.status === 'approved'
      );

    const anyTeamLeadInProgress = this.assignedTeamLeads.some(
      tl => tl.status === 'in_progress'
    );

    if (allTeamLeadsCompleted) {
      this.status = 'completed';
    } else if (anyTeamLeadInProgress && this.status !== 'in_progress') {
      this.status = 'in_progress';
    }
  }

  // Leads progress calculation
  if (this.hasLeadsTarget &&
    (this.isModified('assignedEmployees') ||
      this.isModified('assignedManagers') ||
      this.isModified('assignedTeamLeads'))) {
    let totalCompleted = 0;

    // Employees se leads count
    this.assignedEmployees.forEach(emp => {
      totalCompleted += emp.leadsCompleted || 0;
    });

    // Managers se leads count
    this.assignedManagers.forEach(mgr => {
      totalCompleted += mgr.leadsCompleted || 0;
    });

    // Team leads se leads count
    this.assignedTeamLeads.forEach(tl => {
      totalCompleted += tl.leadsCompleted || 0;
    });

    this.leadsCompleted = totalCompleted;
  }

  next();
});

// Add index for team leads
subtaskSchema.index({ "assignedTeamLeads.teamLeadId": 1 });

const Subtask =
  mongoose.models.Subtask ||
  mongoose.model("Subtask", subtaskSchema);

export default Subtask;
