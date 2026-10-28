// Store connected clients globally so they persist across API calls
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
  if (!userId || !controller) return;
  const key = userId.toString();
  if (!globalForSse.sseClients.has(key)) {
    globalForSse.sseClients.set(key, new Set());
  }
  globalForSse.sseClients.get(key).add(controller);
}

/**
 * Remove a client from the SSE connections map.
 * @param {string} userId - The ID of the user.
 * @param {object} controller - The ReadableStreamDefaultController.
 */
export function removeClient(userId, controller) {
  if (!userId) return;
  const key = userId.toString();
  if (globalForSse.sseClients.has(key)) {
    const clients = globalForSse.sseClients.get(key);
    clients.delete(controller);
    if (clients.size === 0) {
      globalForSse.sseClients.delete(key);
    }
  }
}

/**
 * Send an event to all active connections for a specific user.
 * @param {string} userId - The ID of the user to send the event to.
 * @param {object} data - The data object to send.
 */
export function notifyUser(userId, data) {
  if (!userId) return;
  const key = userId.toString();
  if (globalForSse.sseClients.has(key)) {
    const controllers = globalForSse.sseClients.get(key);
    const toRemove = [];
    
    for (const controller of controllers) {
      try {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      } catch (err) {
        toRemove.push(controller);
      }
    }

    for (const deadController of toRemove) {
      removeClient(key, deadController);
    }
  }
}
