import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  text: { type: String, required: true },
  category: { type: String, default: 'General' },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isRegular: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
  completedAt: { type: String, default: null },
  history: { type: [String], default: [] },
}, { timestamps: true });

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);
