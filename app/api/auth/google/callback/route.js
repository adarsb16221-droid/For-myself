import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { login } from '@/lib/auth';

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Google OAuth token error:', tokenData.error_description || tokenData.error);
      return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
    }

    // Get user profile
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profileData = await profileResponse.json();

    if (!profileData.email) {
      return NextResponse.redirect(new URL('/login?error=oauth_no_email', request.url));
    }

    await connectToDatabase();

    // Find or create user
    let user = await User.findOne({ email: profileData.email });

    if (user) {
      // If user exists but doesn't have googleId, we can link it
      if (!user.googleId) {
        user.googleId = profileData.id;
        if (!user.authProvider) user.authProvider = 'google';
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        name: profileData.name || profileData.email.split('@')[0],
        email: profileData.email,
        googleId: profileData.id,
        authProvider: 'google',
      });
    }

    // Log the user in
    await login(user);

    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/login?error=internal_error', request.url));
  }
}
