import mongoose, { Schema, model, models } from "mongoose";

const managerPostSchema = new Schema(
  {
    title: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    attachmentUrl: {
      type: String,
      default: null,
    },
    visible: {
      type: Boolean,
      default: false,
    },

    views: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, required: true },
        userModel: {
          type: String,
          enum: ["Admin", "TeamLead", "Employee"],
          required: true,
        },
      },
    ],

    likedBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, required: true },
        userModel: {
          type: String,
          enum: ["Admin", "TeamLead", "Employee"],
          required: true,
        },
      },
    ],

    commentBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, required: true },
        userModel: {
          type: String,
          enum: ["Admin", "TeamLead", "Employee"],
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

const ManagerPost = models.ManagerPost || model("ManagerPost", managerPostSchema);

export default ManagerPost;
