'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { formatRupiah } from '@/lib/format'

interface Streamer {
  id: string; username: string; displayName: string; bio: string | null
  avatarUrl: string | null; minDonation: number
}

const PAYMENT_METHODS = [
  { id: 'QRIS',       label: '📱 QRIS',          desc: 'GoPay, OVO, DANA, m-Banking' },
  { id: 'BCA_VA',     label: '🏦 BCA Virtual Account',     desc: '' },
  { id: 'BNI_VA',     label: '🏦 BNI Virtual Account',     desc: '' },
  { id: 'BRI_VA',     label: '🏦 BRI Virtual Account',     desc: '' },
  { id: 'MANDIRI_VA', label: '🏦 Mandiri Virtual Account', desc: '' },
  { id: 'PERMATA_VA', label: '🏦 Permata Virtual Account', desc: '' },
]

const PRESET_AMOUNTS = [5000, 10000, 20000, 50000, 100000]

export default function DonationPage() {
  const { username } = useParams<{ username: string }>()
  const router = useRouter()

  const [streamer, setStreamer]   = useState<Streamer | null>(null)
  const [notFound, setNotFound]   = useState(false)
  const [form,     setForm]       = useState({
    donorName:     '',
    message:       '',
    amount:        0,
    customAmount:  '',
    paymentMethod: 'QRIS',
  })
  const [loading,  setLoading]    = useState(false)
  const [error,    setError]      = useState('')

  useEffect(() => {
    fetch(`/api/streamer/${username}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((s) => { setStreamer(s); setForm((f) => ({ ...f, amount: s.minDonation })) })
      .catch(() => setNotFound(true))
  }, [username])

  const finalAmount = form.amount || parseInt(form.customAmount) || 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!streamer) return

    if (finalAmount < streamer.minDonation) {
      setError(`Minimum donasi ${formatRupiah(streamer.minDonation)}`)
      return
    }

    setLoading(true)
    setError('')

    const res = await fetch('/api/donations/create', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        streamerId:    streamer.id,
        donorName:     form.donorName,
        message:       form.message || undefined,
        amount:        finalAmount,
        paymentMethod: form.paymentMethod,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error ?? 'Gagal memproses pembayaran'); return }

    // Store payment info for the payment page (avoids re-fetching)
    sessionStorage.setItem(`pay_${data.orderId}`, JSON.stringify(data))
    router.push(`/${username}/pay/${data.orderId}`)
  }

  if (notFound) return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl mb-4">😕</p>
        <h1 className="text-2xl font-bold mb-2">Streamer tidak ditemukan</h1>
        <p className="text-gray-500">Periksa kembali link donasi kamu.</p>
      </div>
    </main>
  )

  if (!streamer) return <div className="min-h-screen flex items-center justify-center text-gray-400">Memuat...</div>

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-5">
        {/* Streamer card */}
        <div className="card p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center text-4xl mx-auto mb-3">
            {streamer.avatarUrl
              ? <img src={streamer.avatarUrl} className="w-20 h-20 rounded-full object-cover" alt="" />
              : '🎮'}
          </div>
          <h1 className="text-2xl font-bold">{streamer.displayName}</h1>
          {streamer.bio && <p className="text-gray-500 text-sm mt-1">{streamer.bio}</p>}
          <p className="text-xs text-gray-400 mt-2">Min. donasi {formatRupiah(streamer.minDonation)}</p>
        </div>

        {/* Donation form */}
        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Nama Kamu</label>
            <input className="input" placeholder="Masukkan namamu" value={form.donorName}
              onChange={(e) => setForm({ ...form, donorName: e.target.value })} required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Pesan / Shoutout <span className="text-gray-400 font-normal">(opsional)</span></label>
            <textarea
              className="input resize-none" rows={3}
              placeholder="Pesan yang akan muncul di layar streamer..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              maxLength={200}
            />
            <p className="text-xs text-gray-400 text-right mt-1">{form.message.length}/200</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Jumlah Donasi</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {PRESET_AMOUNTS.filter((v) => v >= streamer.minDonation).slice(0, 6).map((v) => (
                <button key={v} type="button"
                  className={`py-2 rounded-xl text-sm font-semibold border transition ${
                    form.amount === v && !form.customAmount
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-brand-400'
                  }`}
                  onClick={() => setForm({ ...form, amount: v, customAmount: '' })}
                >
                  {formatRupiah(v)}
                </button>
              ))}
            </div>
            <input
              type="number"
              className="input"
              placeholder={`Atau masukkan nominal (min. ${formatRupiah(streamer.minDonation)})`}
              value={form.customAmount}
              onChange={(e) => setForm({ ...form, customAmount: e.target.value, amount: 0 })}
              min={streamer.minDonation}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Metode Pembayaran</label>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((m) => (
                <label key={m.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    form.paymentMethod === m.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input type="radio" name="paymentMethod" value={m.id} checked={form.paymentMethod === m.id}
                    onChange={() => setForm({ ...form, paymentMethod: m.id })} className="accent-brand-600" />
                  <div>
                    <p className="text-sm font-medium">{m.label}</p>
                    {m.desc && <p className="text-xs text-gray-400">{m.desc}</p>}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {finalAmount > 0 && (
            <div className="bg-brand-50 rounded-xl p-3 text-center">
              <p className="text-sm text-gray-600">Total yang dibayarkan</p>
              <p className="text-2xl font-extrabold text-brand-700">{formatRupiah(finalAmount)}</p>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button type="submit" className="btn-primary w-full text-base py-3" disabled={loading || finalAmount < streamer.minDonation}>
            {loading ? 'Memproses...' : `Donasi ${finalAmount > 0 ? formatRupiah(finalAmount) : ''} →`}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400">
          Pembayaran diproses aman oleh Midtrans · Powered by <span className="font-semibold">BagiDuit</span>
        </p>
      </div>
    </main>
  )
}
