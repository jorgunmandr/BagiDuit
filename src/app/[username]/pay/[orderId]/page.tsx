'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { formatRupiah } from '@/lib/format'
import { QRCodeSVG } from 'qrcode.react'

interface DonationStatus {
  status:    string
  amount:    number
  donorName: string
  paidAt:    string | null
  expiredAt: string | null
}

interface PaymentInfo {
  orderId:       string
  paymentMethod: string
  qrString:      string | null
  vaNumber:      string | null
  amount:        number
  expiredAt:     string | null
}

const BANK_LABELS: Record<string, { name: string; icon: string; instructions: string[] }> = {
  BCA_VA:     { name: 'BCA',     icon: '🏦', instructions: ['Buka m-BCA atau KlikBCA', 'Pilih Transfer → Virtual Account', 'Masukkan nomor VA di atas', 'Cek nominal dan konfirmasi'] },
  BNI_VA:     { name: 'BNI',     icon: '🏦', instructions: ['Buka mobile banking BNI', 'Pilih Transfer → Virtual Account', 'Masukkan nomor VA di atas', 'Cek nominal dan konfirmasi'] },
  BRI_VA:     { name: 'BRI',     icon: '🏦', instructions: ['Buka BRImo', 'Pilih Pembayaran → BRIVA', 'Masukkan nomor VA di atas', 'Cek nominal dan konfirmasi'] },
  MANDIRI_VA: { name: 'Mandiri', icon: '🏦', instructions: ['Buka Livin by Mandiri', 'Pilih Bayar → Multi Payment', 'Masukkan nomor VA di atas', 'Cek nominal dan konfirmasi'] },
  PERMATA_VA: { name: 'Permata', icon: '🏦', instructions: ['Buka PermataMobile X', 'Pilih Pembayaran → Virtual Account', 'Masukkan nomor VA di atas', 'Cek nominal dan konfirmasi'] },
}

export default function PaymentPage() {
  const { username, orderId } = useParams<{ username: string; orderId: string }>()

  // Payment info comes from sessionStorage (set by donation form) or refetched
  const [payInfo,   setPayInfo]   = useState<PaymentInfo | null>(null)
  const [status,    setStatus]    = useState<DonationStatus | null>(null)
  const [polling,   setPolling]   = useState(true)
  const [copied,    setCopied]    = useState(false)
  const [timeLeft,  setTimeLeft]  = useState<number | null>(null)

  // Load payment info from sessionStorage (put there by donation form via URL state)
  useEffect(() => {
    const raw = sessionStorage.getItem(`pay_${orderId}`)
    if (raw) setPayInfo(JSON.parse(raw))
  }, [orderId])

  const checkStatus = useCallback(async () => {
    const res = await fetch(`/api/donations/status/${orderId}`)
    if (!res.ok) return
    const data: DonationStatus = await res.json()
    setStatus(data)
    if (['PAID', 'EXPIRED', 'FAILED', 'CANCELLED'].includes(data.status)) {
      setPolling(false)
    }
  }, [orderId])

  // Poll every 3 seconds while pending
  useEffect(() => {
    checkStatus()
    if (!polling) return
    const interval = setInterval(checkStatus, 3_000)
    return () => clearInterval(interval)
  }, [checkStatus, polling])

  // Countdown timer
  useEffect(() => {
    if (!payInfo?.expiredAt) return
    const expired = new Date(payInfo.expiredAt).getTime()
    const tick = () => {
      const diff = Math.max(0, Math.floor((expired - Date.now()) / 1000))
      setTimeLeft(diff)
      if (diff === 0) setPolling(false)
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [payInfo?.expiredAt])

  function copyVA() {
    if (!payInfo?.vaNumber) return
    navigator.clipboard.writeText(payInfo.vaNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function formatCountdown(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  if (status?.status === 'PAID') return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-sm w-full p-8 text-center">
        <div className="text-6xl mb-4 animate-bounce">🎉</div>
        <h1 className="text-2xl font-bold mb-2">Pembayaran Berhasil!</h1>
        <p className="text-gray-500 mb-1">Terima kasih, <strong>{status.donorName}</strong>!</p>
        <p className="text-brand-700 font-bold text-xl mb-4">{formatRupiah(status.amount)}</p>
        <p className="text-sm text-gray-400 mb-6">Pesanmu sudah terkirim ke streamer 💌</p>
        <Link href={`/${username}`} className="btn-primary w-full justify-center">
          Donasi Lagi
        </Link>
      </div>
    </main>
  )

  if (status?.status === 'EXPIRED') return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-sm w-full p-8 text-center">
        <div className="text-6xl mb-4">⏰</div>
        <h1 className="text-2xl font-bold mb-2">Waktu Habis</h1>
        <p className="text-gray-500 mb-6">Pembayaran kadaluarsa. Silakan buat donasi baru.</p>
        <Link href={`/${username}`} className="btn-primary w-full justify-center">Coba Lagi</Link>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm text-gray-500">Menyelesaikan pembayaran untuk <strong>{username}</strong></p>
          {payInfo && (
            <p className="text-2xl font-extrabold text-brand-700 mt-1">{formatRupiah(payInfo.amount)}</p>
          )}
        </div>

        {/* QR Code */}
        {payInfo?.paymentMethod === 'QRIS' && payInfo.qrString && (
          <div className="card p-6 text-center space-y-4">
            <h2 className="font-bold text-lg">Scan QRIS</h2>
            <div className="flex justify-center">
              <div className="p-3 bg-white rounded-xl border border-gray-100 inline-block">
                <QRCodeSVG value={payInfo.qrString} size={220} level="M" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Buka m-Banking, GoPay, OVO, atau DANA kamu → Scan QR</p>
            {timeLeft !== null && timeLeft > 0 && (
              <div className="bg-amber-50 text-amber-700 rounded-xl py-2 px-3 text-sm font-medium">
                ⏱ Berlaku {formatCountdown(timeLeft)}
              </div>
            )}
          </div>
        )}

        {/* Virtual Account */}
        {payInfo?.paymentMethod !== 'QRIS' && payInfo?.vaNumber && (
          <div className="card p-6 space-y-4">
            <h2 className="font-bold text-lg">
              {BANK_LABELS[payInfo.paymentMethod]?.icon} {BANK_LABELS[payInfo.paymentMethod]?.name} Virtual Account
            </h2>
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between gap-3">
              <code className="font-mono text-xl font-bold tracking-wider">{payInfo.vaNumber}</code>
              <button onClick={copyVA} className="btn-secondary text-sm py-1.5 px-3 shrink-0">
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
            <div className="space-y-1.5">
              {(BANK_LABELS[payInfo.paymentMethod]?.instructions ?? []).map((step, i) => (
                <div key={i} className="flex gap-2 text-sm text-gray-600">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Waiting indicator */}
        {polling && (
          <div className="card p-4 flex items-center gap-3 text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
            Menunggu konfirmasi pembayaran...
          </div>
        )}

        <p className="text-center text-xs text-gray-400">
          Sudah bayar? Halaman ini akan otomatis update. Jangan tutup halaman ini.
        </p>

        <Link href={`/${username}`} className="block text-center text-sm text-gray-400 hover:text-gray-600">
          ← Batal dan kembali
        </Link>
      </div>
    </main>
  )
}
