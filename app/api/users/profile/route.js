import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import Task from '@/models/Task';
import Challenge from '@/models/Challenge';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await User.findById(session.userId).select('name email orbitPoints createdAt');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Fetch completed tasks (one-offs and habits that are currently completed)
    const completedTasks = await Task.find({
      userId: session.userId,
      completed: true
    }).sort({ updatedAt: -1 }).limit(50);

    // Fetch history from regular habits (history array has dates)
    const habitsHistory = await Task.find({
      userId: session.userId,
      isRegular: true,
      history: { $not: { $size: 0 } }
    });

    // Fetch completed challenges
    const completedChallenges = await Challenge.find({
      $or: [{ creator: session.userId }, { recipient: session.userId }],
      status: 'completed'
    })
      .populate('creator', 'name')
      .populate('recipient', 'name')
      .sort({ updatedAt: -1 })
      .limit(20);

    // Combine history for timeline
    let timeline = [];

    // Add completed simple tasks
    completedTasks.forEach(t => {
      if (!t.isRegular) {
        timeline.push({
          id: `task_${t._id}`,
          type: 'task',
          title: t.text,
          date: new Date(t.updatedAt || t.createdAt),
          points: 1
        });
      }
    });

    // Add habit history
    habitsHistory.forEach(h => {
      h.history.forEach(dateStr => {
        timeline.push({
          id: `habit_${h._id}_${dateStr}`,
          type: 'habit',
          title: h.text,
          date: new Date(dateStr),
          points: 1
        });
      });
    });

    // Add completed challenges
    completedChallenges.forEach(c => {
      timeline.push({
        id: `challenge_${c._id}`,
        type: 'challenge',
        title: c.type === 'mutual' ? 'Mutual Challenge' : 'Solo Challenge',
        with: c.creator._id.toString() === session.userId ? c.recipient.name : c.creator.name,
        date: new Date(c.updatedAt),
        points: 2
      });
    });

    // Sort timeline descending by date
    timeline.sort((a, b) => b.date - a.date);

    return NextResponse.json({
      user,
      timeline
    });
  } catch (error) {
    console.error('GET PROFILE ERROR:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
