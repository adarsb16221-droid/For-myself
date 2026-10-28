import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function POST(req) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const points = Number(body.points);

    // Validate points: must be integer between 1 and 180 (standard focus session max duration)
    if (!Number.isInteger(points) || points < 1 || points > 180) {
      return NextResponse.json({ 
        error: 'Invalid points value. Points must be an integer between 1 and 180.' 
      }, { status: 400 });
    }

    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Cooldown check: prevent automated rapid-fire point requests
    if (user.lastFocusPointsAwardedAt) {
      const elapsedMs = Date.now() - new Date(user.lastFocusPointsAwardedAt).getTime();
      if (elapsedMs < 45 * 1000) {
        return NextResponse.json({ 
          error: 'Please wait before claiming more focus points.' 
        }, { status: 429 });
      }
    }

    // Atomic update to avoid race conditions
    const updatedUser = await User.findByIdAndUpdate(
      session.userId,
      { 
        $inc: { orbitPoints: points },
        $set: { lastFocusPointsAwardedAt: new Date() }
      },
      { new: true }
    );

    return NextResponse.json({ success: true, orbitPoints: updatedUser.orbitPoints });
  } catch (error) {
    console.error('Error awarding points:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
