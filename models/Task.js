import mongoose from 'mongoose';
import { encrypt, decrypt } from '@/lib/encryption';

const TaskSchema = new mongoose.Schema({
  text: { type: String, required: true, get: decrypt, set: encrypt },
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
  isGoal: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
  completedAt: { type: String, default: null },
  history: { type: [String], default: [] },
  lastPenaltyDate: { type: String, default: null },
  subtasksResetAt: { type: String, default: null },
  linkedGoalId: { type: String, default: null },
  subtasks: {
    type: [{
      id: { type: String, required: true },
      text: { type: String, required: true, get: decrypt, set: encrypt },
      completed: { type: Boolean, default: false }
    }],
    default: []
  },
  order: { type: Number, default: () => Date.now() },
}, { 
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

delete mongoose.models.Task;
export default mongoose.model('Task', TaskSchema);
