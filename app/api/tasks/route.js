import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Task from '@/models/Task';

export async function GET() {
  try {
    await connectToDatabase();
    // Sort by createdAt descending
    const tasks = await Task.find({}).sort({ createdAt: -1 });
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    await connectToDatabase();
    const newTask = await Task.create(data);
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function PUT(req) {
    try {
        const data = await req.json();
        await connectToDatabase();
        if (!data._id) {
            return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
        }
        const updatedTask = await Task.findByIdAndUpdate(data._id, data, { new: true });
        return NextResponse.json(updatedTask);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
        }
        await connectToDatabase();
        await Task.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }
}
