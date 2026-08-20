import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { SignOutButton } from './SignOutButton'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const donationLink = `${appUrl}/${session.user.username}`

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-brand-700">💸 BagiDuit</Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard"          className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
            <Link href="/dashboard/settings" className="text-sm text-gray-600 hover:text-gray-900">Pengaturan</Link>
            <a href={donationLink} target="_blank" rel="noreferrer"
               className="text-sm text-brand-600 font-medium hover:underline">
              Link Donasi ↗
            </a>
            <SignOutButton />
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
