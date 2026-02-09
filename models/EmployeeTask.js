import mongoose from "mongoose";

const EmployeeTaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "in_progress", "completed", "approved", "rejected"],
        default: "pending"
    },

    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee"
    },

    startDate: { type: Date, required: false },
    endDate: { type: Date, required: false },
    startTime: { type: String, required: false },
    endTime: { type: String, required: false },
    assignedTeamLead: [
        {
            teamLeadId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "TeamLead"
            },
            status: {
                type: String,
                enum: ["pending", "in_progress", "completed", "approved", "rejected"],
                default: "pending"
            },
            feedbacks: [
                {
                    feedback: { type: String },
                    sentAt: { type: Date, default: Date.now },
                },
            ],
        }
    ],

        assignedManager: [
            {
                managerId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Manager"
                },
                status: {
                    type: String,
                    enum: ["pending", "in_progress", "completed", "approved", "rejected"],
                    default: "pending"
                },
                feedback: {
                    type: String,
                    default: ""
                }
            }
        ],
        assignedEmployee: [
            {
                employeeId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Employee"
                },
                status: {
                    type: String,
                    enum: ["pending", "in_progress", "completed", "approved", "rejected"],
                    default: "pending"
                },
                feedback: {
                    type: String,
                    default: ""
                }
            }
        ],
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
    }, {
        timestamps: true
    })

const EmployeeTask =
    mongoose.models.EmployeeTask || mongoose.model("EmployeeTask", EmployeeTaskSchema);
export default EmployeeTask;