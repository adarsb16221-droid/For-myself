import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Journal from '@/models/Journal';
import { getSession } from '@/lib/auth';

export async function GET(req) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const entries = await Journal.find({ userId: session.userId });
    const journalData = {};
    entries.forEach(entry => {
        journalData[entry.date] = entry.content;
    });
    
    return NextResponse.json(journalData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch journal' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const data = await req.json(); // data is an object like { "YYYY-MM-DD": "content" }
    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    for (const [date, content] of Object.entries(data)) {
        await Journal.findOneAndUpdate(
            { date, userId: session.userId },
            { date, content, userId: session.userId },
            { upsert: true, new: true }
        );
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("JOURNAL POST ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
