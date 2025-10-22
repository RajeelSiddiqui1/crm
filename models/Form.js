import mongoose from "mongoose";

const formFieldSchema = new mongoose.Schema({
  type: { type: String, required: true }, // 👈 No enum, fully flexible
  label: { type: String, required: true },
  name: { type: String, required: true },
  required: { type: Boolean, default: false },
  options: [String], // for select, radio, checkbox
  placeholder: { type: String, default: "" },
  defaultValue: { type: String, default: "" },
  min: { type: Number },
  max: { type: Number },
  pattern: { type: String },
});

const formSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    depId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    fields: [formFieldSchema],
    createdBy: { type: String, default: "System" },
  },
  { timestamps: true }
);

formSchema.index({ title: 1, depId: 1 }, { unique: true });

export default mongoose.models.Form || mongoose.model("Form", formSchema);
