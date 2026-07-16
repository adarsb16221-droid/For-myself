import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Schedule from '@/models/Schedule';
import { getSession } from '@/lib/auth';

export async function GET(req) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const scheduleItems = await Schedule.find({ userId: session.userId }).sort({ startTime: 1 });
    return NextResponse.json(scheduleItems);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    const newSchedule = await Schedule.create({ ...data, userId: session.userId });
    return NextResponse.json(newSchedule, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create schedule item' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }
    
    await Schedule.findOneAndDelete({ _id: id, userId: session.userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete schedule item' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    const { _id, ...updateData } = data;
    
    if (!_id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    const updatedSchedule = await Schedule.findOneAndUpdate(
      { _id, userId: session.userId },
      updateData,
      { new: true }
    );
    
    if (!updatedSchedule) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(updatedSchedule);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update schedule item' }, { status: 500 });
  }
}
