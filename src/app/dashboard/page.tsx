'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { formatRupiah, formatDate } from '@/lib/format'
import Link from 'next/link'

interface Donation {
  id: string; donorName: string; message: string | null; amount: number
  paymentMethod: string; status: string; paidAt: string | null; createdAt: string
}

interface DashboardData {
  donations: Donation[]
  stats: {
    today:   { total: number; count: number }
    allTime: { total: number; count: number }
  }
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PAID:      { label: 'Lunas',    color: 'text-green-700 bg-green-100' },
  PENDING:   { label: 'Menunggu', color: 'text-yellow-700 bg-yellow-100' },
  EXPIRED:   { label: 'Expired',  color: 'text-gray-500 bg-gray-100' },
  FAILED:    { label: 'Gagal',    color: 'text-red-700 bg-red-100' },
  CANCELLED: { label: 'Batal',    color: 'text-gray-500 bg-gray-100' },
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data,    setData]    = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const donationLink = `${appUrl}/${session?.user?.username}`
  const overlayLink  = `${appUrl}/overlay/${session?.user?.id}`

  useEffect(() => {
    fetch('/api/dashboard/donations')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
  }, [])

  if (loading) return <div className="text-center py-20 text-gray-400">Memuat...</div>
  if (!data)   return null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Halo, {session?.user?.name} 👋</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Donasi Hari Ini"    value={formatRupiah(data.stats.today.total)}   sub={`${data.stats.today.count} transaksi`} />
        <StatCard label="Total Semua Waktu"  value={formatRupiah(data.stats.allTime.total)} sub={`${data.stats.allTime.count} transaksi`} />
        <div className="card p-5 col-span-2">
          <p className="text-xs text-gray-500 mb-1">Link Donasi</p>
          <div className="flex gap-2 items-center">
            <code className="text-sm text-brand-700 font-mono break-all">{donationLink}</code>
            <button
              onClick={() => navigator.clipboard.writeText(donationLink)}
              className="shrink-0 text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-2 py-1"
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      {/* OBS Overlay link */}
      <div className="card p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-semibold">🎙️ OBS Alert Overlay</p>
            <p className="text-sm text-gray-500">Tambahkan URL ini sebagai Browser Source di OBS / XSplit</p>
          </div>
          <div className="flex gap-2 items-center">
            <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-lg break-all">{overlayLink}</code>
            <button
              onClick={() => navigator.clipboard.writeText(overlayLink)}
              className="shrink-0 text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-2 py-1"
            >
              Copy
            </button>
          </div>
          <Link href={`/overlay/${session?.user?.id}`} target="_blank" className="btn-secondary text-sm py-1.5 px-3">
            Preview
          </Link>
        </div>
      </div>

      {/* Donations list */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold">Donasi Terbaru</h2>
        </div>
        {data.donations.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Belum ada donasi. Share link donasi kamu!</div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {data.donations.map((d) => {
              const s = STATUS_LABEL[d.status] ?? { label: d.status, color: 'text-gray-500 bg-gray-100' }
              return (
                <li key={d.id} className="px-5 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium">{d.donorName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>{s.label}</span>
                    </div>
                    {d.message && <p className="text-sm text-gray-500 truncate">{d.message}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(d.paidAt ?? d.createdAt)}</p>
                  </div>
                  <span className="font-bold text-brand-700 whitespace-nowrap">{formatRupiah(d.amount)}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-brand-700">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  )
}
