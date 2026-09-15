import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { getSession } from '@/lib/auth';
import { notifyUser } from '@/lib/sse';

export async function POST(req) {
  try {
    const { friendId } = await req.json();
    if (!friendId) {
      return NextResponse.json({ error: 'friendId is required' }, { status: 400 });
    }

    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const currentUser = await User.findById(session.userId);
    if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const friendUser = await User.findById(friendId);
    if (!friendUser) return NextResponse.json({ error: 'Target user not found' }, { status: 404 });

    // Check if they are already friends
    if (currentUser.friends && currentUser.friends.includes(friendId)) {
      // Remove friend
      currentUser.friends.pull(friendId);
      friendUser.friends.pull(currentUser._id);
      await currentUser.save();
      await friendUser.save();
      return NextResponse.json({ success: true, isFriend: false });
    }

    // Check if friendUser has already requested currentUser
    if (currentUser.friendRequests && currentUser.friendRequests.includes(friendId)) {
      // Accept the request
      currentUser.friendRequests.pull(friendId);
      currentUser.friends.push(friendId);
      friendUser.friends.push(currentUser._id);
      await currentUser.save();
      await friendUser.save();

      notifyUser(friendId, { type: 'friend_accepted', from: currentUser.name });
      return NextResponse.json({ success: true, isFriend: true });
    }

    // Check if currentUser already requested friendUser
    if (friendUser.friendRequests && friendUser.friendRequests.includes(currentUser._id)) {
      // Withdraw request
      friendUser.friendRequests.pull(currentUser._id);
      await friendUser.save();
      return NextResponse.json({ success: true, isFriend: false, hasRequested: false });
    }

    // Otherwise, send a new friend request
    if (!friendUser.friendRequests) {
      friendUser.friendRequests = [];
    }
    friendUser.friendRequests.push(currentUser._id);
    await friendUser.save();

    // Trigger instant SSE notification
    notifyUser(friendId, {
      type: 'friend_request',
      from: currentUser.name,
      id: currentUser._id,
    });

    return NextResponse.json({ success: true, isFriend: false, hasRequested: true });
  } catch (error) {
    console.error('TOGGLE FRIEND ERROR:', error);
    return NextResponse.json({ error: 'Failed to process friend action' }, { status: 500 });
  }
}
