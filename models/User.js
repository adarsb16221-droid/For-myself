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
    required: function() {
      // Password is required only if the user is not logging in via Google
      return this.authProvider !== 'google';
    },
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true,
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
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  friendRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, { timestamps: true });

delete mongoose.models.User;
export default mongoose.model('User', UserSchema);
