'use client'

import { useEffect, useState } from 'react'
import { formatRupiah } from '@/lib/format'

interface BankAccount {
  id: string; bankCode: string; bankName: string; accountNumber: string; accountName: string
}

interface Settings {
  displayName: string; bio: string; minDonation: number; alertDuration: number
  bankAccounts: BankAccount[]
}

const BANKS = [
  { code: 'BCA',     name: 'BCA' },
  { code: 'BNI',     name: 'BNI' },
  { code: 'BRI',     name: 'BRI' },
  { code: 'MANDIRI', name: 'Mandiri' },
  { code: 'PERMATA', name: 'Permata' },
  { code: 'CIMB',    name: 'CIMB Niaga' },
  { code: 'BSI',     name: 'BSI' },
]

export default function SettingsPage() {
  const [settings,  setSettings]  = useState<Settings | null>(null)
  const [saving,    setSaving]     = useState(false)
  const [saved,     setSaved]      = useState(false)
  const [newBank,   setNewBank]    = useState({ bankCode: 'BCA', accountNumber: '', accountName: '' })
  const [addingBank, setAddingBank] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard/settings')
      .then((r) => r.json())
      .then(setSettings)
  }, [])

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault()
    if (!settings) return
    setSaving(true)
    await fetch('/api/dashboard/settings', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        displayName:   settings.displayName,
        bio:           settings.bio,
        minDonation:   settings.minDonation,
        alertDuration: settings.alertDuration,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function addBankAccount(e: React.FormEvent) {
    e.preventDefault()
    setAddingBank(true)
    const res = await fetch('/api/dashboard/bank-accounts', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(newBank),
    })
    if (res.ok) {
      const account = await res.json()
      setSettings((s) => s ? { ...s, bankAccounts: [...s.bankAccounts, account] } : s)
      setNewBank({ bankCode: 'BCA', accountNumber: '', accountName: '' })
    }
    setAddingBank(false)
  }

  async function removeBank(id: string) {
    await fetch(`/api/dashboard/bank-accounts?id=${id}`, { method: 'DELETE' })
    setSettings((s) => s ? { ...s, bankAccounts: s.bankAccounts.filter((b) => b.id !== id) } : s)
  }

  if (!settings) return <div className="text-center py-20 text-gray-400">Memuat...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Pengaturan</h1>

      {/* Profile */}
      <form onSubmit={saveSettings} className="card p-6 space-y-4">
        <h2 className="font-semibold text-lg">Profil</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Nama Tampilan</label>
          <input className="input" value={settings.displayName}
            onChange={(e) => setSettings({ ...settings, displayName: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Bio <span className="text-gray-400 font-normal">(opsional)</span></label>
          <input className="input" value={settings.bio ?? ''}
            onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
            placeholder="Streamer FPS | Senin–Jumat 20.00 WIB" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Minimum Donasi</label>
          <div className="flex gap-2 flex-wrap">
            {[5000, 10000, 15000, 20000, 50000].map((v) => (
              <button key={v} type="button"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                  settings.minDonation === v
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-brand-400'
                }`}
                onClick={() => setSettings({ ...settings, minDonation: v })}
              >
                {formatRupiah(v)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Durasi Alert OBS <span className="text-gray-400">({settings.alertDuration} detik)</span></label>
          <input type="range" min="3" max="30" value={settings.alertDuration}
            onChange={(e) => setSettings({ ...settings, alertDuration: parseInt(e.target.value) })}
            className="w-full accent-brand-600" />
        </div>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saved ? '✓ Tersimpan' : saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </form>

      {/* Bank accounts */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-lg">Rekening Bank</h2>
        <p className="text-sm text-gray-500">Ditampilkan di halaman donasi sebagai referensi penonton.</p>

        {settings.bankAccounts.length > 0 && (
          <ul className="space-y-2">
            {settings.bankAccounts.map((b) => (
              <li key={b.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div>
                  <span className="font-medium">{b.bankCode}</span>
                  <span className="text-gray-400 mx-2">·</span>
                  <span className="font-mono text-sm">{b.accountNumber}</span>
                  <span className="text-gray-400 mx-2">·</span>
                  <span className="text-sm text-gray-600">{b.accountName}</span>
                </div>
                <button onClick={() => removeBank(b.id)} className="text-red-400 hover:text-red-600 text-sm">Hapus</button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={addBankAccount} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select className="input" value={newBank.bankCode}
            onChange={(e) => setNewBank({ ...newBank, bankCode: e.target.value })}>
            {BANKS.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
          </select>
          <input className="input" placeholder="No. Rekening" value={newBank.accountNumber}
            onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })} pattern="\d+" required />
          <input className="input" placeholder="Nama Pemilik" value={newBank.accountName}
            onChange={(e) => setNewBank({ ...newBank, accountName: e.target.value })} required />
          <button type="submit" className="btn-secondary sm:col-span-3 justify-center" disabled={addingBank}>
            {addingBank ? 'Menambahkan...' : '+ Tambah Rekening'}
          </button>
        </form>
      </div>
    </div>
  )
}
