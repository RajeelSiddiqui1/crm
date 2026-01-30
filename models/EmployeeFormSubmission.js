// models/EmployeeFormSubmission.js
import mongoose from "mongoose";

const employeeFormSubmissionSchema = new mongoose.Schema(
    {
        formId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "EmployeeForm",
            required: true
        },
        submittedBy: {
            type: String,
            required: true
        },
        assignedTo: {
            type: String,
            required: true
        },
        subtaskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subtask",
            required: true
        },
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true
        },
        formData: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },
        teamleadstatus: {
            type: String,
            enum: ["pending", "in_progress", "completed", "approved", "rejected", "late"],
            default: "pending"
        },
        managerStatus: {
            type: String,
            enum: ["pending", "in_progress", "completed", "approved", "rejected"],
            default: "pending"
        },
        completedAt: {
            type: Date
        },
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
    },
    { timestamps: true }
);

const EmployeeFormSubmission =
    mongoose.models.EmployeeFormSubmission ||
    mongoose.model("EmployeeFormSubmission", employeeFormSubmissionSchema);

export default EmployeeFormSubmission;