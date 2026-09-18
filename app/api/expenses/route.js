import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Expense from '@/models/Expense';
import { getSession } from '@/lib/auth';

const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education', 'Other'];

function validate(data) {
  const amount = Number(data.amount);
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const date = typeof data.date === 'string' ? data.date : '';
  const category = categories.includes(data.category) ? data.category : 'Other';
  const type = data.type === 'income' ? 'income' : data.type === 'expense' ? 'expense' : null;

  if (!type || !title || title.length > 100 || !Number.isFinite(amount) || amount <= 0 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { error: 'Enter a valid type, title, positive amount, and date.' };
  }

  return {
    value: {
      type,
      title,
      amount: Math.round(amount * 100) / 100,
      category,
      date,
      note: typeof data.note === 'string' ? data.note.trim().slice(0, 500) : '',
    },
  };
}

async function getAuthorizedSession() {
  const session = await getSession();
  return session;
}

export async function GET(req) {
  try {
    await connectToDatabase();
    const session = await getAuthorizedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const query = { userId: session.userId };
    if (month && /^\d{4}-\d{2}$/.test(month)) query.date = { $regex: `^${month}-` };

    const expenses = await Expense.find(query).sort({ date: -1, createdAt: -1 });
    return NextResponse.json(expenses);
  } catch (error) {
    console.error('EXPENSES GET ERROR:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const session = await getAuthorizedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = validate(await req.json());
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

    const expense = await Expense.create({ ...result.value, userId: session.userId });
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('EXPENSES POST ERROR:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connectToDatabase();
    const session = await getAuthorizedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    if (!data._id) return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    const result = validate(data);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

    const expense = await Expense.findOneAndUpdate(
      { _id: data._id, userId: session.userId },
      result.value,
      { new: true, runValidators: true },
    );
    if (!expense) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    return NextResponse.json(expense);
  } catch (error) {
    console.error('EXPENSES PUT ERROR:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectToDatabase();
    const session = await getAuthorizedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    const deleted = await Expense.findOneAndDelete({ _id: id, userId: session.userId });
    if (!deleted) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('EXPENSES DELETE ERROR:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
