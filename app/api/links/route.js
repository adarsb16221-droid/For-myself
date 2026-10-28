import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Link from '@/models/Link';
import { getSession } from '@/lib/auth';
import { isSafePublicUrl } from '@/lib/urlValidator';

export async function GET(req) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const links = await Link.find({ userId: session.userId }).sort({ createdAt: -1 });
    return NextResponse.json(links);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    const { name, url, trackChanges, aiInstruction } = data;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Link name is required' }, { status: 400 });
    }

    if (!isSafePublicUrl(url)) {
      return NextResponse.json({ 
        error: 'Please enter a valid, public HTTP/HTTPS URL (internal/local addresses are disallowed).' 
      }, { status: 400 });
    }

    const newLink = await Link.create({
      name: name.trim().slice(0, 100),
      url: url.trim(),
      trackChanges: Boolean(trackChanges),
      aiInstruction: typeof aiInstruction === 'string' ? aiInstruction.trim().slice(0, 500) : '',
      userId: session.userId
    });

    return NextResponse.json(newLink, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create link' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Link ID is required' }, { status: 400 });
    }

    await Link.findOneAndDelete({ _id: id, userId: session.userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 });
  }
}
