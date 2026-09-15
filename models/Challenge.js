import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  isDaily: {
    type: Boolean,
    default: false,
  },
  creatorCompleted: {
    type: Boolean,
    default: false,
  },
  recipientCompleted: {
    type: Boolean,
    default: false,
  },
  creatorHistory: {
    type: [String],
    default: [],
  },
  recipientHistory: {
    type: [String],
    default: [],
  },
});

const ChallengeSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['mutual', 'challenge'],
    required: true,
  },
  tasks: [TaskSchema],
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'failed'],
    default: 'pending',
  },
}, { timestamps: true });

delete mongoose.models.Challenge;
export default mongoose.model('Challenge', ChallengeSchema);
