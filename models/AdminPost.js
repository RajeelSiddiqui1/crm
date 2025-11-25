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
    attachmentType: {
      type: String,
      enum: ["image", "video", "file", null],
      default: null,
    },
    visible: {
      type: Boolean,
      default: false,
    },

    views: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'views.userModel' },
        userModel: {
          type: String,
          enum: ["Manager", "TeamLead", "Employee"],
          required: true,
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    reactions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'reactions.userModel' },
        userModel: {
          type: String,
          enum: ["Manager", "TeamLead", "Employee"],
          required: true,
        },
        reactionType: {
          type: String,
          enum: ["like", "love", "care", "haha", "wow", "sad", "angry"],
          default: "like",
        },
        reactedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    comments: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'comments.userModel' },
        userModel: {
          type: String,
          enum: ["Manager", "TeamLead", "Employee"],
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
        likes: [
          {
            userId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'comments.likes.userModel' },
            userModel: {
              type: String,
              enum: ["Manager", "TeamLead", "Employee"],
              required: true,
            },
            likedAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

const AdminPost = models.AdminPost || model("AdminPost", adminPostSchema);

export default AdminPost;