'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router  = useRouter()
  const [form,    setForm]    = useState({ username: '', email: '', password: '', displayName: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Terjadi kesalahan')
      setLoading(false)
      return
    }

    // Auto login after register
    await signIn('credentials', { email: form.email, password: form.password, redirect: false })
    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50 py-10">
      <div className="card w-full max-w-sm p-8">
        <Link href="/" className="text-2xl font-bold text-brand-700 block mb-6">💸 BagiDuit</Link>
        <h1 className="text-2xl font-bold mb-6">Daftar Akun</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nama Tampilan</label>
            <input type="text" className="input" placeholder="Nama kamu di stream" value={form.displayName} onChange={field('displayName')} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 bg-gray-100 text-gray-500 text-sm">
                bagiduit.com/
              </span>
              <input
                type="text" className="input rounded-l-none" placeholder="namastreamer"
                value={form.username} onChange={field('username')}
                pattern="[a-z0-9_]+" title="Hanya huruf kecil, angka, dan underscore"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" className="input" value={form.email} onChange={field('email')} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" className="input" placeholder="Minimal 8 karakter" value={form.password} onChange={field('password')} minLength={8} required />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Membuat akun...' : 'Daftar Sekarang'}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-gray-500">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-brand-600 font-medium hover:underline">Masuk</Link>
        </p>
      </div>
    </main>
  )
}
