import { getSession } from '@/lib/auth';
import { addClient, removeClient } from '@/lib/sse';
import { NextResponse } from 'next/server';

// Opt out of caching for this stream
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const session = await getSession();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userId = session.userId.toString();
  let controllerRef = null;
  let isCleanedUp = false;

  const cleanup = (intervalId) => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    if (intervalId) clearInterval(intervalId);
    if (controllerRef) {
      removeClient(userId, controllerRef);
    }
  };

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
      addClient(userId, controller);
      
      const encoder = new TextEncoder();
      try {
        controller.enqueue(encoder.encode(`data: {"type": "connected"}\n\n`));
      } catch (e) {
        cleanup();
        return;
      }

      // Keep connection alive with a heartbeat every 30 seconds
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: {"type": "heartbeat"}\n\n`));
        } catch (e) {
          cleanup(heartbeatInterval);
        }
      }, 30000);

      req.signal.addEventListener('abort', () => {
        cleanup(heartbeatInterval);
      });
    },
    cancel() {
      cleanup();
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
