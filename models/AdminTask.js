import mongoose, { Schema, model, models, mongo } from "mongoose";

const adminTaskSchema = Schema(
  {
    title: {
      type: String,
    },
    clientName: {
      type: String,
      required: false,
    },
    fileAttachments: {
      type: String,
      required: false,
    },
    audioUrl: {
      type: String,
      required: true,
      required:false
    },
     priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
      required:false
    },
    endDate: {
      type: Date,
      required: false,
    },
    sharedBYManager:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manager",
      required: false,
    },
    managers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Manager",
      },
    ],
  },
  {
    timestamp: true,
  }
);

const AdminTask = models.AdminTask || model("AdminTask", adminTaskSchema);

export default AdminTask;
