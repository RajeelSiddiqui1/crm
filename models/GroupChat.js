
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'senderModel'
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
    required: function() {
      return !this.attachment && !this.voiceMessage;
    }
  },
  attachment: {
    url: String,
    filename: String,
    fileType: String,
    fileSize: Number
  },
  voiceMessage: {
    url: String,
    duration: Number,
    filename: String
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  readBy: [{
    userId: mongoose.Schema.Types.ObjectId,
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const groupChatSchema = new mongoose.Schema({
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FormSubmission",
    required: true
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
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
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Update lastActivity when new message is added
groupChatSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.lastActivity = new Date();
  }
  next();
});

const GroupChat = mongoose.models.GroupChat || mongoose.model("GroupChat", groupChatSchema);
export default GroupChat;