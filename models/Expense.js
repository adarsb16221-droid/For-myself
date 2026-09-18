import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['expense', 'income'], default: 'expense' },
  amount: { type: Number, required: true, min: 0.01 },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  category: {
    type: String,
    enum: ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education', 'Other'],
    default: 'Other',
  },
  date: { type: String, required: true },
  note: { type: String, trim: true, maxlength: 500 },
}, { timestamps: true });

ExpenseSchema.index({ userId: 1, date: -1 });

export default mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
