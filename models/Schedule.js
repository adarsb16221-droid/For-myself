import mongoose from 'mongoose';

const ScheduleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  startTime: { type: String, required: true }, // Format HH:MM (e.g. "09:00")
  endTime: { type: String, required: true },
  color: { type: String, default: 'primary' }, // Tailwind color mapping (e.g. primary, secondary)
}, { timestamps: true });

export default mongoose.models.Schedule || mongoose.model('Schedule', ScheduleSchema);
