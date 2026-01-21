import mongoose from "mongoose";

// Message subdocument schema
const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'messages.senderModel'
    },
    senderModel: {
      type: String,
      required: true,
      enum: ['Admin', 'Manager', 'TeamLead', 'Employee']
    },
    senderName: {
      type: String,
      required: true
    },
    senderEmail: {
      type: String,
      required: true
    },
    content: {
      type: String,
      default: ''
    },
    attachment: {
      url: String,
      filename: String,
      fileType: String,
      fileSize: Number,
      public_id: String
    },
    voiceMessage: {
      url: String,
      duration: Number,
      filename: String,
      public_id: String
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    readBy: [{
      userId: mongoose.Schema.Types.ObjectId,
      readAt: Date
    }],
    isEdited: {
      type: Boolean,
      default: false
    },
    updatedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

// SharedTaskChat main schema
const sharedTaskChatSchema = new mongoose.Schema(
  {
    sharedTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SharedTask",
      required: true,
      unique: true // unique index automatically created
    },
    taskTitle: {
      type: String,
      required: true
    },
    taskDescription: {
      type: String,
      default: ""
    },
    participants: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'participants.userModel'
      },
      userModel: {
        type: String,
        required: true,
        enum: ['Admin', 'Manager', 'TeamLead', 'Employee']
      },
      email: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      role: {
        type: String,
        required: true
      },
      department: {
        type: String
      },
      joinedAt: {
        type: Date,
        default: Date.now
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    messages: [messageSchema],
    lastActivity: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Indexes for faster queries
sharedTaskChatSchema.index({ lastActivity: -1 });
sharedTaskChatSchema.index({ 'participants.email': 1 });

const SharedTaskChat = mongoose.models.SharedTaskChat || mongoose.model("SharedTaskChat", sharedTaskChatSchema);
export default SharedTaskChat;
