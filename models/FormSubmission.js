// models/FormSubmission.js
import mongoose from "mongoose";

const formSubmissionSchema = new mongoose.Schema(
    {
        formId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Form",
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
        assignedEmployees: [{
            employeeId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Employee",
                required: true
            },
            email: {
                type: String,
                required: true
            },
            status: {
                type: String,
                enum: ["pending", "in_progress", "completed", "rejected"],
                default: "pending"
            },
            assignedAt: {
                type: Date,
                default: Date.now
            },
            completedAt: {
                type: Date
            }
        }],
        formData: {
            type: Map,
            of: mongoose.Schema.Types.Mixed
        },
        status: {
            type: String,
            enum: ["pending", "in_progress", "completed", "approved", "rejected"],
            default: "pending"
        },
        status2: {
            type: String,
            enum: ["pending", "in_progress", "completed", "approved", "rejected"],
            default: "pending"
        },
        teamLeadFeedback: {
            type: String,
            default: ""
        },
        managerComments: {
            type: String,
            default: ""
        },
        completedAt: {
            type: Date
        }
    },
    { timestamps: true }
);

const FormSubmission =
    mongoose.models.FormSubmission ||
    mongoose.model("FormSubmission", formSubmissionSchema);

export default FormSubmission;