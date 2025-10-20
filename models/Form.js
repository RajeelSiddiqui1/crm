import mongoose from 'mongoose';

const formFieldSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['text', 'email', 'number', 'date', 'select', 'textarea'],
    required: true
  },
  label: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  required: {
    type: Boolean,
    default: false
  },
  options: [String],
  foreignKey: {
    type: Boolean,
    default: false
  },
  depId: {
    type: String
  }
});

const formSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  fields: [formFieldSchema],

  // 👇 ye optional field hai, error nahi ayega agar empty ho
  createdBy: {
    type: String,
    default: "System" // ya null bhi rakh sakte ho
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Form || mongoose.model('Form', formSchema);