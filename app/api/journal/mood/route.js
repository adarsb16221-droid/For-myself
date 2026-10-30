import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Journal from '@/models/Journal';
import { getSession } from '@/lib/auth';

// Kept separate from /api/journal so that endpoint's { date: content } shape stays unchanged
const MOODS = ['great', 'good', 'okay', 'low', 'rough'];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET() {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const entries = await Journal.find({ userId: session.userId, mood: { $ne: null } }, 'date mood');
    const moods = {};
    entries.forEach(entry => {
      moods[entry.date] = entry.mood;
    });

    return NextResponse.json(moods);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch moods' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { date, mood } = await req.json();
    if (!DATE_PATTERN.test(date || '') || (mood !== null && !MOODS.includes(mood))) {
      return NextResponse.json({ error: 'Invalid date or mood' }, { status: 400 });
    }

    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await Journal.findOneAndUpdate(
      { date, userId: session.userId },
      { $set: { mood } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('JOURNAL MOOD ERROR:', error);
    return NextResponse.json({ error: 'Failed to save mood' }, { status: 500 });
  }
}
