import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    await connectToDatabase();
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: 'Please provide all fields' }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    // Check expiration
    if (!user.resetOtpExpires || user.resetOtpExpires < new Date()) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

    // Verify OTP
    const isMatch = await bcrypt.compare(otp, user.resetOtp);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password and clear OTP fields
    user.password = hashedPassword;
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();

    return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
