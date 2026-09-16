import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Challenge from '@/models/Challenge';
import User from '@/models/User';
import { getSession } from '@/lib/auth';
import { notifyUser } from '@/lib/sse';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const challenges = await Challenge.find({
      $or: [{ creator: session.userId }, { recipient: session.userId }]
    })
      .populate('creator', 'name email')
      .populate('recipient', 'name email')
      .sort({ createdAt: -1 });

    const today = new Date();
    today.setHours(0,0,0,0);
    let hasUpdates = false;

    for (let c of challenges) {
      if (c.status === 'accepted') {
        const endDate = new Date(c.endDate);
        endDate.setHours(0,0,0,0);
        
        if (endDate < today) {
          const startDate = new Date(c.startDate);
          startDate.setHours(0,0,0,0);
          const diffTime = Math.abs(endDate - startDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

          let creatorFailed = false;
          let recipientFailed = false;
          
          c.tasks.forEach(t => {
            if (t.isDaily) {
              if (c.type === 'mutual' && t.creatorHistory.length < diffDays) creatorFailed = true;
              if (t.recipientHistory.length < diffDays) recipientFailed = true;
            } else {
              if (c.type === 'mutual' && !t.creatorCompleted) creatorFailed = true;
              if (!t.recipientCompleted) recipientFailed = true;
            }
          });
          
          if (c.type !== 'mutual') creatorFailed = false;
          
          if (!creatorFailed && !recipientFailed) {
            c.status = 'completed';
            if (c.type === 'mutual') {
              const creator = await User.findById(c.creator._id);
              if (creator) await User.findByIdAndUpdate(c.creator._id, { orbitPoints: Math.max(0, creator.orbitPoints || 0) + 2 });
              const recipient = await User.findById(c.recipient._id);
              if (recipient) await User.findByIdAndUpdate(c.recipient._id, { orbitPoints: Math.max(0, recipient.orbitPoints || 0) + 2 });
            } else {
              const recipient = await User.findById(c.recipient._id);
              if (recipient) await User.findByIdAndUpdate(c.recipient._id, { orbitPoints: Math.max(0, recipient.orbitPoints || 0) + 2 });
            }
          } else {
            c.status = 'failed';
            if (creatorFailed) {
              // await User.findByIdAndUpdate(c.creator._id, { $inc: { orbitPoints: -2 } });
            } else if (c.type === 'mutual') {
              const creator = await User.findById(c.creator._id);
              if (creator) await User.findByIdAndUpdate(c.creator._id, { orbitPoints: Math.max(0, creator.orbitPoints || 0) + 2 });
            }

            if (recipientFailed) {
              // await User.findByIdAndUpdate(c.recipient._id, { $inc: { orbitPoints: -2 } });
            } else {
              const recipient = await User.findById(c.recipient._id);
              if (recipient) await User.findByIdAndUpdate(c.recipient._id, { orbitPoints: Math.max(0, recipient.orbitPoints || 0) + 2 });
            }
          }
          
          await c.save();
          hasUpdates = true;
        }
      }
    }

    if (hasUpdates) {
      const updatedChallenges = await Challenge.find({
        $or: [{ creator: session.userId }, { recipient: session.userId }]
      })
        .populate('creator', 'name email')
        .populate('recipient', 'name email')
        .sort({ createdAt: -1 });
      return NextResponse.json(updatedChallenges);
    }

    return NextResponse.json(challenges);
  } catch (error) {
    console.error('GET CHALLENGES ERROR:', error);
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { recipientId, type, startDate, endDate, tasks } = await req.json();

    if (!recipientId || !type || !startDate || !endDate || !tasks || tasks.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const creator = await User.findById(session.userId);
    if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 });

    const recipient = await User.findById(recipientId);
    if (!recipient) return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });

    const isSelfChallenge = session.userId === recipientId;

    const challenge = new Challenge({
      creator: session.userId,
      recipient: recipientId,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      tasks: tasks.map(t => ({ title: t.title, isDaily: !!t.isDaily })),
      status: isSelfChallenge ? 'accepted' : 'pending',
    });

    await challenge.save();

    if (!isSelfChallenge) {
      notifyUser(recipientId, {
        type: 'challenge_received',
        from: creator.name,
        id: challenge._id,
      });
    }

    return NextResponse.json({ success: true, challenge });
  } catch (error) {
    console.error('CREATE CHALLENGE ERROR:', error);
    return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 });
  }
}
