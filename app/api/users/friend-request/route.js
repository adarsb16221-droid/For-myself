import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { getSession } from '@/lib/auth';
import { notifyUser } from '@/lib/sse';

export const dynamic = 'force-dynamic';

// Get pending friend requests for current user
export async function GET(req) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const currentUser = await User.findById(session.userId).populate('friendRequests', 'name email orbitPoints');
    if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json(currentUser.friendRequests || []);
  } catch (error) {
    console.error('GET FRIEND REQUESTS ERROR:', error);
    return NextResponse.json({ error: 'Failed to fetch friend requests' }, { status: 500 });
  }
}

// Accept or reject a friend request
export async function POST(req) {
  try {
    const { requesterId, action } = await req.json(); // action: 'accept' or 'reject'
    if (!requesterId || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const currentUser = await User.findById(session.userId);
    const requesterUser = await User.findById(requesterId);

    if (!currentUser || !requesterUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove from friendRequests
    if (currentUser.friendRequests) {
      currentUser.friendRequests.pull(requesterId);
    }

    if (action === 'accept') {
      // Add to friends
      if (!currentUser.friends) currentUser.friends = [];
      if (!requesterUser.friends) requesterUser.friends = [];

      if (!currentUser.friends.includes(requesterId)) currentUser.friends.push(requesterId);
      if (!requesterUser.friends.includes(currentUser._id)) requesterUser.friends.push(currentUser._id);

      await requesterUser.save();
      notifyUser(requesterId, { type: 'friend_accepted', from: currentUser.name });
    }

    await currentUser.save();
    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error('HANDLE FRIEND REQUEST ERROR:', error);
    return NextResponse.json({ error: 'Failed to handle request' }, { status: 500 });
  }
}
