// models/Notification.js
import mongoose, { Schema, model, models } from "mongoose";

const notificationSchema = new Schema(
    {
        sender: {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
            },
            model: {
                type: String,
                enum: ["Admin", "Manager", "TeamLead", "Employee"],
                required: true,
            },
            name: {
                type: String,
                required: true
            }
        },
        receiver: {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
            },
            model: {
                type: String,
                enum: ["Admin", "Manager", "TeamLead", "Employee"],
                required: true,
            }
        },
        type: {
            type: String,
            required: true
        },
        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },
        referenceModel: {
            type: String,
            default: null
        },
        title: {
            type: String,
            required: false
        },
        message: {
            type: String,
            required: true
        },
        link: {
            type: String,
            required: true
        },
        seen: {
            type: Boolean,
            default: false
        },
        read: {
            type: Boolean,
            default: false
        },
        seenBy: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            userRole: {
                type: String,
                enum: ["Admin", "Manager", "TeamLead", "Employee"],
                required: true
            },
            seenAt: {
                type: Date,
                default: Date.now
            }
        }]
    },
    { timestamps: true }
);

const Notification = models.Notification || model("Notification", notificationSchema);

export default Notification;