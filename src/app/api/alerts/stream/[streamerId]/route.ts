import { NextRequest } from 'next/server'
import { addSSEClient, removeSSEClient } from '@/lib/sse'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { streamerId: string } }
) {
  const { streamerId } = params
  const encoder = new TextEncoder()

  let controller: ReadableStreamDefaultController<Uint8Array>

  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c
      addSSEClient(streamerId, controller)
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`))

      const heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(': ping\n\n')) }
        catch { clearInterval(heartbeat) }
      }, 25_000)

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        removeSSEClient(streamerId, controller)
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':     'text/event-stream',
      'Cache-Control':    'no-cache, no-transform',
      'Connection':       'keep-alive',
      'X-Accel-Buffering': 'no', // disable nginx buffering
    },
  })
}
