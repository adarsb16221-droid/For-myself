import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Challenge from '@/models/Challenge';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { getSession } from '@/lib/auth';
import { notifyUser } from '@/lib/sse';

// Accept or Reject a challenge
export async function POST(req, { params }) {
  try {
    const { action } = await req.json();
    const { id } = await params;
    
    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const challenge = await Challenge.findById(id);
    if (!challenge) return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });

    if (challenge.recipient.toString() !== session.userId) {
      return NextResponse.json({ error: 'Only recipient can accept/reject' }, { status: 403 });
    }

    const currentUser = await User.findById(session.userId);

    if (action === 'accept') {
      challenge.status = 'accepted';
      notifyUser(challenge.creator.toString(), {
        type: 'challenge_accepted',
        from: currentUser.name,
        id: challenge._id,
      });

      await Notification.create({
        recipient: challenge.creator,
        type: 'challenge_accepted',
        title: 'Challenge Accepted!',
        message: `${currentUser.name} has accepted your challenge.`
      });
    } else {
      challenge.status = 'rejected';
    }

    await challenge.save();
    return NextResponse.json({ success: true, challenge });
  } catch (error) {
    console.error('HANDLE CHALLENGE ERROR:', error);
    return NextResponse.json({ error: 'Failed to handle challenge' }, { status: 500 });
  }
}

// Update task completion
export async function PATCH(req, { params }) {
  try {
    const { taskId, completed } = await req.json();
    const { id } = await params;

    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const challenge = await Challenge.findById(id).populate('creator').populate('recipient');
    if (!challenge) return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });

    if (challenge.status !== 'accepted') {
      return NextResponse.json({ error: 'Challenge is not active' }, { status: 400 });
    }

    const isCreator = challenge.creator._id.toString() === session.userId;
    const isRecipient = challenge.recipient._id.toString() === session.userId;

    if (!isCreator && !isRecipient) {
      return NextResponse.json({ error: 'Not participant' }, { status: 403 });
    }

    const task = challenge.tasks.id(taskId);
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    let notificationSent = false;
    let targetUserId = null;
    const currentUser = isCreator ? challenge.creator : challenge.recipient;

    const todayStr = new Date().toISOString().split('T')[0];

    if (isCreator && challenge.type === 'mutual') {
      if (task.isDaily) {
        if (completed) {
          if (!task.creatorHistory.includes(todayStr)) task.creatorHistory.push(todayStr);
        } else {
          task.creatorHistory = task.creatorHistory.filter(d => d !== todayStr);
        }
      } else {
        task.creatorCompleted = completed;
      }
      targetUserId = challenge.recipient._id.toString();
    } else if (isRecipient) {
      if (task.isDaily) {
        if (completed) {
          if (!task.recipientHistory.includes(todayStr)) task.recipientHistory.push(todayStr);
        } else {
          task.recipientHistory = task.recipientHistory.filter(d => d !== todayStr);
        }
      } else {
        task.recipientCompleted = completed;
      }
      targetUserId = challenge.creator._id.toString();
    } else {
      return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }

    const wasCompleted = challenge.status === 'completed';

    // Check if all tasks are completed (only for one-time challenges)
    let allCreator = true;
    let allRecipient = true;
    let hasDaily = false;
    challenge.tasks.forEach(t => {
      if (t.isDaily) hasDaily = true;
      if (!t.isDaily && !t.creatorCompleted) allCreator = false;
      if (!t.isDaily && !t.recipientCompleted) allRecipient = false;
    });

    if (!hasDaily) {
      if (challenge.type === 'mutual' && allCreator && allRecipient) {
        challenge.status = 'completed';
      } else if (challenge.type === 'challenge' && allRecipient) {
        challenge.status = 'completed';
      }
    }

    const isNowCompleted = challenge.status === 'completed' && !wasCompleted;

    await challenge.save();

    if (isNowCompleted) {
      if (challenge.type === 'mutual') {
        await User.findByIdAndUpdate(challenge.creator._id, { $inc: { orbitPoints: 2 } });
        await User.findByIdAndUpdate(challenge.recipient._id, { $inc: { orbitPoints: 2 } });
      } else {
        await User.findByIdAndUpdate(challenge.recipient._id, { $inc: { orbitPoints: 2 } });
      }
    }

    if (targetUserId && targetUserId !== session.userId) {
      notifyUser(targetUserId, {
        type: 'task_completed',
        from: currentUser.name,
        task: task.title,
        completed,
      });

      if (completed) {
        await Notification.create({
          recipient: targetUserId,
          type: 'task_completed',
          title: 'Task Completed!',
          message: `${currentUser.name} completed the task: ${task.title}`
        });
      }
    }

    return NextResponse.json({ success: true, challenge });
  } catch (error) {
    console.error('UPDATE TASK ERROR:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
