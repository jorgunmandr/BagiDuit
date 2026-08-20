import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { username: string } }
) {
  const user = await prisma.user.findUnique({
    where:  { username: params.username.toLowerCase() },
    select: {
      id: true, username: true, displayName: true, bio: true,
      avatarUrl: true, minDonation: true,
    },
  })

  if (!user) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })
  return NextResponse.json(user)
}
