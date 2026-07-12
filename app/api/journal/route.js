import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Journal from '@/models/Journal';

export async function GET(req) {
  try {
    await connectToDatabase();
    
    // Convert array of entries to an object keyed by date string to match old behavior
    const entries = await Journal.find({});
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
    
    // We only expect one entry to be updated at a time from the client in this new architecture,
    // but if we receive the whole object, let's process it.
    for (const [date, content] of Object.entries(data)) {
        await Journal.findOneAndUpdate(
            { date },
            { date, content },
            { upsert: true, new: true }
        );
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update journal' }, { status: 500 });
  }
}
