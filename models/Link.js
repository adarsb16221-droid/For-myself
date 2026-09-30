import mongoose from 'mongoose';

const LinkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  trackChanges: { type: Boolean, default: false },
  aiInstruction: { type: String, default: '' },
  lastSummary: { type: String, default: '' },
  lastCheckedAt: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.models.Link || mongoose.model('Link', LinkSchema);
