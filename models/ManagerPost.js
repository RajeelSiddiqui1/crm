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

    submmittedBy:{
       type:mongoose.Schema.Types.ObjectId,
       ref:"Manager"
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
          enum: ["Admin", "TeamLead", "Employee"],
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
          enum: ["Admin", "TeamLead", "Employee"],
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
              enum: ["Admin", "TeamLead", "Employee"],
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

const ManagerPost = models.ManagerPost || model("ManagerPost", managerPostSchema);

export default ManagerPost;
