import mongoose from 'mongoose';

const LinkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.Link || mongoose.model('Link', LinkSchema);
