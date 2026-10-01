import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function GET(req) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const currentUser = await User.findById(session.userId);
    if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');

    // Default query: only return friends
    let query = {
      $and: [
        { _id: { $ne: session.userId } },
        { _id: { $in: currentUser.friends || [] } }
      ]
    };

    if (search) {
      // If searching, return friends AND matching users
      query = {
        $and: [
          { _id: { $ne: session.userId } },
          {
            $or: [
              { _id: { $in: currentUser.friends || [] } },
              { name: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } }
            ]
          }
        ]
      };
    }

    const users = await User.find(
      query,
      'name email orbitPoints friendRequests'
    ).sort({ orbitPoints: -1 });

    const friendsList = currentUser.friends ? currentUser.friends.map(id => id.toString()) : [];
    const myRequests = currentUser.friendRequests ? currentUser.friendRequests.map(id => id.toString()) : [];

    const usersData = users.map(user => {
      const theirRequests = user.friendRequests ? user.friendRequests.map(id => id.toString()) : [];
      
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        orbitPoints: user.orbitPoints,
        isFriend: friendsList.includes(user._id.toString()),
        hasRequested: theirRequests.includes(currentUser._id.toString()), // I sent them a request
        isRequesting: myRequests.includes(user._id.toString()), // They sent me a request
      };
    });
    
    return NextResponse.json(usersData);
  } catch (error) {
    console.error('GET USERS ERROR:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
