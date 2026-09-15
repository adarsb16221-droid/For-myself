// Store connected clients globally so they persist across API calls in development
const globalForSse = global;

if (!globalForSse.sseClients) {
  globalForSse.sseClients = new Map();
}

/**
 * Add a client to the SSE connections map.
 * @param {string} userId - The ID of the user.
 * @param {object} controller - The ReadableStreamDefaultController.
 */
export function addClient(userId, controller) {
  if (!globalForSse.sseClients.has(userId)) {
    globalForSse.sseClients.set(userId, new Set());
  }
  globalForSse.sseClients.get(userId).add(controller);
}

/**
 * Remove a client from the SSE connections map.
 * @param {string} userId - The ID of the user.
 * @param {object} controller - The ReadableStreamDefaultController.
 */
export function removeClient(userId, controller) {
  if (globalForSse.sseClients.has(userId)) {
    const clients = globalForSse.sseClients.get(userId);
    clients.delete(controller);
    if (clients.size === 0) {
      globalForSse.sseClients.delete(userId);
    }
  }
}

/**
 * Send an event to all active connections for a specific user.
 * @param {string} userId - The ID of the user to send the event to.
 * @param {object} data - The data object to send.
 */
export function notifyUser(userId, data) {
  if (globalForSse.sseClients.has(userId)) {
    const controllers = globalForSse.sseClients.get(userId);
    for (const controller of controllers) {
      try {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      } catch (err) {
        console.error('Failed to notify client, removing it', err);
        removeClient(userId, controller);
      }
    }
  }
}
