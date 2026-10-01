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
    const { points } = body;

    if (!points || typeof points !== 'number' || points <= 0) {
      return NextResponse.json({ error: 'Invalid points value' }, { status: 400 });
    }

    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.orbitPoints = (user.orbitPoints || 0) + points;
    await user.save();

    return NextResponse.json({ success: true, orbitPoints: user.orbitPoints });
  } catch (error) {
    console.error('Error awarding points:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
