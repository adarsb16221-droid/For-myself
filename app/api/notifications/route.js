import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const notifications = await Notification.find({
      recipient: session.userId,
      read: false
    }).sort({ createdAt: -1 });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('GET NOTIFICATIONS ERROR:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { notificationId } = await req.json();

    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (notificationId) {
      await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: session.userId },
        { read: true }
      );
    } else {
      // Mark all as read if no ID provided
      await Notification.updateMany(
        { recipient: session.userId, read: false },
        { read: true }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH NOTIFICATION ERROR:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
