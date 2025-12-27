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
        // Leads tracking fields
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
        // Managers ke liye bhi leads tracking ho sakta hai
        leadsCompleted: { type: Number, default: 0 },
        leadsAssigned: { type: Number, default: 0 },
      },
    ],
    
    startDate: { type: Date, required: false },
    endDate: { type: Date, required: false },
    startTime: { type: String, required: false },
    endTime: { type: String, required: false },
    lead: { type: String, default: "1" },
    fileAttchmentUrl: { type: String, required: false },
    
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

// ✅ Middleware: Agar sab employees ya managers complete kar chuke hain, to overall status update ho
subtaskSchema.pre('save', function(next) {
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
  
  // Leads progress calculation
  if (this.hasLeadsTarget && (this.isModified('assignedEmployees') || this.isModified('assignedManagers'))) {
    let totalCompleted = 0;
    
    // Employees se leads count
    this.assignedEmployees.forEach(emp => {
      totalCompleted += emp.leadsCompleted || 0;
    });
    
    // Managers se leads count
    this.assignedManagers.forEach(mgr => {
      totalCompleted += mgr.leadsCompleted || 0;
    });
    
    this.leadsCompleted = totalCompleted;
  }
  
  next();
});

subtaskSchema.index({ submissionId: 1, teamLeadId: 1 });
subtaskSchema.index({ teamLeadId: 1, status: 1 });
subtaskSchema.index({ "assignedEmployees.employeeId": 1 });
subtaskSchema.index({ "assignedManagers.managerId": 1 });
subtaskSchema.index({ createdAt: -1 });

export default mongoose.models.Subtask ||
  mongoose.model("Subtask", subtaskSchema);