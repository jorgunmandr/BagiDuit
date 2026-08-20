'use client'

import { useEffect, useRef, useState } from 'react'
import { formatRupiah } from '@/lib/format'

interface Alert {
  donorName: string
  amount:    number
  message:   string | null
}

export default function OverlayPage({ params }: { params: { streamerId: string } }) {
  const [current, setCurrent]  = useState<Alert | null>(null)
  const [visible, setVisible]  = useState(false)
  const queueRef = useRef<Alert[]>([])
  const busyRef  = useRef(false)

  function showNext() {
    if (busyRef.current || queueRef.current.length === 0) return
    busyRef.current = true
    const alert = queueRef.current.shift()!
    setCurrent(alert)
    setVisible(true)

    // Hide after 7s, then show next
    setTimeout(() => {
      setVisible(false)
      setTimeout(() => {
        setCurrent(null)
        busyRef.current = false
        showNext()
      }, 500)
    }, 7_000)
  }

  useEffect(() => {
    const es = new EventSource(`/api/alerts/stream/${params.streamerId}`)
    es.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type !== 'donation') return
      queueRef.current.push(data as Alert)
      showNext()
    }
    return () => es.close()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.streamerId])

  return (
    // Transparent background — OBS browser source uses this page
    <div className="w-full h-screen overflow-hidden flex items-end justify-start p-6" style={{ background: 'transparent' }}>
      {current && (
        <div
          className={`max-w-sm transition-all duration-500 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ background: 'transparent' }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border-l-4 border-brand-500 p-5 space-y-1"
               style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">💸</span>
              <div>
                <p className="font-bold text-gray-900 text-base leading-tight">{current.donorName}</p>
                <p className="text-brand-600 font-extrabold text-xl">{formatRupiah(current.amount)}</p>
              </div>
            </div>
            {current.message && (
              <p className="text-gray-600 text-sm border-t border-gray-100 pt-2 mt-2 italic">
                &ldquo;{current.message}&rdquo;
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
