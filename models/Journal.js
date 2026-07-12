import mongoose from 'mongoose';

const JournalSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // Format: YYYY-MM-DD
  content: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.Journal || mongoose.model('Journal', JournalSchema);
