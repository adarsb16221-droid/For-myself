import mongoose from 'mongoose';

const JournalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  content: { type: String, default: '' },
}, { timestamps: true });

// Ensure a user can only have one journal entry per date
JournalSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.Journal || mongoose.model('Journal', JournalSchema);
