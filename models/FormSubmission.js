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
        }, // Manager ka name/ID
        assignedTo: {
            type: String,
            required: true
        }, // TeamLead ka ID (jo aapke existing API se aata hai)

        formData: {
            type: Map,
            of: mongoose.Schema.Types.Mixed
        },
        status: {
            type: String,
            enum: ["pending", "in_progress", "completed", "approved", "rejected"],
            default: "pending"
        },
        teamLeadFeedback: {
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