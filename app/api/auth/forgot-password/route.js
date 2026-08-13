import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { sendEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    await connectToDatabase();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return NextResponse.json({ message: 'If that email exists, an OTP has been sent.' }, { status: 200 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash OTP for storage
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    // Set expiration (10 minutes)
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Update user record
    user.resetOtp = hashedOtp;
    user.resetOtpExpires = otpExpires;
    await user.save();

    // Send Email
    await sendEmail({
      to: email,
      subject: 'Password Reset OTP - Deep Work Space',
      text: `Your password reset OTP is: ${otp}. It is valid for 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #4648D4;">Deep Work Space</h2>
          <p>You requested a password reset. Your One-Time Password (OTP) is:</p>
          <h1 style="font-size: 32px; letter-spacing: 4px; color: #333;">${otp}</h1>
          <p>This OTP is valid for 10 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ message: 'If that email exists, an OTP has been sent.' }, { status: 200 });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
