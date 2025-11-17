import mongoose from "mongoose";

const formFieldSchema = new mongoose.Schema({
  type: { type: String, required: true },
  label: { type: String, required: true },
  name: { type: String, required: true },
  required: { type: Boolean, default: false },
  options: [String],
  placeholder: { type: String, default: "" },
  defaultValue: { type: String, default: "" },
  min: { type: Number },
  max: { type: Number },
  pattern: { type: String },
});

const employeeFormSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    depId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manager",
    },
    fields: [formFieldSchema],
    createdBy: { type: String, default: "System" },
  },
  { timestamps: true }
);

employeeFormSchema.index({ title: 1, depId: 1 }, { unique: true });

export default mongoose.models.EmployeeForm || mongoose.model("EmployeeForm", employeeFormSchema);
