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
  resetOtpAttempts: {
    type: Number,
    default: 0,
  },
  lastOtpSentAt: {
    type: Date,
    default: null,
  },
  orbitPoints: {
    type: Number,
    default: 0,
  },
  lastFocusPointsAwardedAt: {
    type: Date,
    default: null,
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  friendRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  fcmToken: {
    type: String,
    default: null,
  },
}, { timestamps: true });

UserSchema.index({ name: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ orbitPoints: -1 });

delete mongoose.models.User;
export default mongoose.model('User', UserSchema);
