import mongoose, { Schema, model, models } from "mongoose";

const adminPostSchema = new Schema(
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
          enum: ["Manager", "TeamLead", "Employee"],
          required: true,
        },
      },
    ],

    likedBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, required: true },
        userModel: {
          type: String,
          enum: ["Manager", "TeamLead", "Employee"],
          required: true,
        },
      },
    ],

    commentBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, required: true },
        userModel: {
          type: String,
          enum: ["Manager", "TeamLead", "Employee"],
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

const AdminPost = models.AdminPost || model("AdminPost", adminPostSchema);

export default AdminPost;
