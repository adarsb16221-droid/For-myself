import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { sendEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    await connectToDatabase();
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return NextResponse.json({ message: 'If that email exists, an OTP has been sent.' }, { status: 200 });
    }

    // Rate limiting: 60-second cooldown between OTP requests
    if (user.lastOtpSentAt) {
      const elapsed = Date.now() - new Date(user.lastOtpSentAt).getTime();
      if (elapsed < 60 * 1000) {
        const remainingSec = Math.ceil((60 * 1000 - elapsed) / 1000);
        return NextResponse.json({ 
          error: `Please wait ${remainingSec} seconds before requesting another OTP.` 
        }, { status: 429 });
      }
    }

    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash OTP for storage
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    // Set expiration (10 minutes)
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Update user record and reset failed attempt count
    user.resetOtp = hashedOtp;
    user.resetOtpExpires = otpExpires;
    user.resetOtpAttempts = 0;
    user.lastOtpSentAt = new Date();
    await user.save();

    // Send Email
    await sendEmail({
      to: cleanEmail,
      subject: 'Password Reset OTP - HAWK',
      text: `Your password reset OTP is: ${otp}. It is valid for 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #4648D4;">HAWK Dashboard</h2>
          <p>You requested a password reset. Your One-Time Password (OTP) is:</p>
          <h1 style="font-size: 32px; letter-spacing: 4px; color: #333;">${otp}</h1>
          <p>This OTP is valid for 10 minutes. For your security, entering the wrong code 5 times will invalidate it.</p>
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
