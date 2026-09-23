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
    }).sort({ updatedAt: -1 });

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
      .sort({ updatedAt: -1 });

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

    //build heatmap data 
    // error i fixed not from antigravity but from the fact that i was not filtering the completed tasks and habits correctly for the heatmap
    const activityMap = {};
    const cutoff= new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 1); // 1 year ago 
    const addActivity = (date) =>{
      if(!date) return;
      const d = new Date(date);

      if(isNaN(d) || d<cutoff) return; // ignore invalid n 1 yr old 
      const dateStr = d.toISOString().split('T')[0]; 
      activityMap[dateStr] = (activityMap[dateStr] || 0) +1;
    };

    completedTasks.forEach(t=>{
      if(!t.isRegular){
        addActivity( t.completedAt || t.updatedAt || t.createdAt);
      }
    });

    habitsHistory.forEach(h=>{
      h.history.forEach(dateStr=>{
        addActivity(dateStr);
      })
    });
    completedChallenges.forEach(c=>{
      addActivity(c.completedAt || c.updatedAt);
    });

    // calc streak as last was creating some blunder maybe date issue was there
    let streak = 0;
    const today = new Date();
    today.setHours(0,0,0,0); 
    for(let i=0; i<365;i++){
      const d = new Date(today);
      d.setDate(d.getDate()-i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth()+1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');

      const dateStr = `${yyyy}-${mm}-${dd}`;
      if(activityMap[dateStr] >0){
        streak++;
      }else{
        if(i==0)continue; // we can check tmrw 
        break;
      }
    }
    console.log('ACTIVITY MAP:', activityMap);
    console.log('COMPLETED TASKS:', completedTasks.map(t => ({
  id: t._id,
  text: t.text,
  isRegular: t.isRegular,
  completedAt: t.completedAt,
  updatedAt: t.updatedAt,
  createdAt: t.createdAt
})));

console.log('CHALLENGES:', completedChallenges.map(c => ({
  id: c._id,
  updatedAt: c.updatedAt,
  completedAt: c.completedAt
})));

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


