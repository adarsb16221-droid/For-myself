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

    const user = await User.findById(session.userId).select('name email orbitPoints createdAt friends');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const friendCount = (user.friends || []).length;

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

    // Calculate daily streak (longest consecutive days where at least 1 habit was completed)
    const allHistoryDates = new Set();
    habitsHistory.forEach(h => {
      h.history.forEach(d => allHistoryDates.add(d));
    });

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (allHistoryDates.has(dateStr)) {
        streak++;
      } else {
        // Allow missing today (streak doesn't break if today not done yet)
        if (i === 0) continue;
        break;
      }
    }

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

    // Build activity heatmap data from already-computed timeline + habit history
    const activityMap = {};
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 1);

    // Use the timeline as the source of truth (already has correct dates for challenges & tasks)
    timeline.forEach(item => {
      const d = new Date(item.date);
      if (d >= cutoff) {
        const dateStr = d.toISOString().split('T')[0];
        activityMap[dateStr] = (activityMap[dateStr] || 0) + item.points;
      }
    });

    // Also count habit history dates (habits reset daily so they may not be in completedTasks)
    habitsHistory.forEach(h => {
      h.history.forEach(dateStr => {
        if (new Date(dateStr) >= cutoff) {
          activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
        }
      });
    });

    // Also count all completed tasks by updatedAt (handles tasks without completedAt)
    completedTasks.forEach(t => {
      const d = new Date(t.completedAt || t.updatedAt);
      if (!isNaN(d) && d >= cutoff) {
        const dateStr = d.toISOString().split('T')[0];
        activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
      }
    });

    return NextResponse.json({
      user,
      friendCount,
      streak,
      completedChallengesCount: completedChallenges.length,
      activityMap,
      timeline
    });
  } catch (error) {
    console.error('GET PROFILE ERROR:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}


