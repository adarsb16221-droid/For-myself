import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Task from '@/models/Task';
import { getSession } from '@/lib/auth';

export async function GET(req) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let tasks = await Task.find({ userId: session.userId }).sort({ order: 1, createdAt: -1 });
    const todayDateStr = new Date().toISOString().split('T')[0];

    let hasUpdates = false;
    for (let task of tasks) {
      if (task.isRegular && task.completed && task.completedAt) {
        const completedDateStr = task.completedAt.split('T')[0];
        if (completedDateStr !== todayDateStr) {
          task.completed = false;
          task.completedAt = null;
          await task.save();
          hasUpdates = true;
        }
      }
    }

    if (hasUpdates) {
      tasks = await Task.find({ userId: session.userId }).sort({ order: 1, createdAt: -1 });
    }

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("TASKS GET ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    const task = await Task.create({ ...data, userId: session.userId });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    const { _id, history, ...restUpdateData } = data;
    
    const existingTask = await Task.findOne({ _id, userId: session.userId });
    if (!existingTask) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updateOps = { $set: restUpdateData };
    
    if (existingTask.isRegular) {
      const todayDateStr = new Date().toISOString().split('T')[0];
      if (restUpdateData.completed === true && !existingTask.completed) {
        updateOps.$addToSet = { history: todayDateStr };
      } else if (restUpdateData.completed === false && existingTask.completed) {
        updateOps.$pull = { history: todayDateStr };
      }
    }
    
    const task = await Task.findOneAndUpdate(
      { _id, userId: session.userId },
      updateOps,
      { new: true }
    );
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    const task = await Task.findOneAndDelete({ _id: id, userId: session.userId });
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
