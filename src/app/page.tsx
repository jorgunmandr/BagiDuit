import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 to-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <span className="text-2xl font-bold text-brand-700">💸 BagiDuit</span>
        <div className="flex gap-3">
          <Link href="/login"    className="btn-secondary text-sm py-2 px-4">Masuk</Link>
          <Link href="/register" className="btn-primary  text-sm py-2 px-4">Daftar Gratis</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center py-24 px-4">
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-4">
          Terima donasi dari <span className="text-brand-600">penonton</span> kamu,<br />
          langsung masuk rekening.
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-xl mx-auto">
          Bayar via QRIS atau transfer bank — alert langsung muncul di layar streaming kamu.
        </p>
        <Link href="/register" className="btn-primary text-lg px-8 py-4">
          Mulai Sekarang — Gratis
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { icon: '📱', title: 'QRIS',             desc: 'Penonton bayar pakai GoPay, OVO, DANA, atau m-Banking apapun.' },
          { icon: '🏦', title: 'Transfer Bank',    desc: 'Virtual Account BCA, BNI, BRI, Mandiri, dan Permata.' },
          { icon: '🎙️', title: 'Live OBS Alert',   desc: 'Notifikasi muncul real-time di layar OBS atau XSplit kamu.' },
        ].map((f) => (
          <div key={f.title} className="card p-6 text-center">
            <div className="text-4xl mb-3">{f.icon}</div>
            <h3 className="font-bold text-lg mb-1">{f.title}</h3>
            <p className="text-gray-500 text-sm">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-center mb-10">Cara Kerja</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { step: '1', text: 'Daftar & dapatkan link donasi kamu' },
            { step: '2', text: 'Share link ke penonton di chat' },
            { step: '3', text: 'Penonton bayar via QRIS atau VA' },
            { step: '4', text: 'Alert muncul langsung di OBS!' },
          ].map((s) => (
            <div key={s.step} className="card p-5 text-center">
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-bold text-lg flex items-center justify-center mx-auto mb-3">
                {s.step}
              </div>
              <p className="text-sm text-gray-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-8 text-gray-400 text-sm">
        © {new Date().getFullYear()} BagiDuit · Dibuat dengan ❤️ untuk streamer Indonesia
      </footer>
    </main>
  )
}
