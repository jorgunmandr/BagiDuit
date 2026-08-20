// In-memory SSE store — works for single-process deployments.
// For multi-worker / multi-server setups, replace with Redis Pub/Sub.

type Controller = ReadableStreamDefaultController<Uint8Array>

const clients = new Map<string, Set<Controller>>()

export function addSSEClient(streamerId: string, controller: Controller) {
  if (!clients.has(streamerId)) clients.set(streamerId, new Set())
  clients.get(streamerId)!.add(controller)
}

export function removeSSEClient(streamerId: string, controller: Controller) {
  clients.get(streamerId)?.delete(controller)
}

export function broadcastDonationAlert(
  streamerId: string,
  data: { donorName: string; amount: number; message: string | null }
) {
  const pool = clients.get(streamerId)
  if (!pool || pool.size === 0) return

  const encoder = new TextEncoder()
  const payload = encoder.encode(`data: ${JSON.stringify({ type: 'donation', ...data })}\n\n`)

  for (const controller of Array.from(pool)) {
    try {
      controller.enqueue(payload)
    } catch {
      pool.delete(controller)
    }
  }
}
