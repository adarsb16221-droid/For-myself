import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetOtp: {
    type: String,
    default: null,
  },
  resetOtpExpires: {
    type: Date,
    default: null,
  },
  orbitPoints: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
