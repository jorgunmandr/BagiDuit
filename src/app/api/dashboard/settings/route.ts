import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: {
      id: true, username: true, email: true, displayName: true,
      bio: true, minDonation: true, alertDuration: true,
      bankAccounts: {
        where: { isActive: true },
        select: { id: true, bankCode: true, bankName: true, accountNumber: true, accountName: true },
      },
    },
  })

  return NextResponse.json(user)
}

const updateSchema = z.object({
  displayName:   z.string().min(2).max(50).optional(),
  bio:           z.string().max(200).optional(),
  minDonation:   z.number().int().min(1000).max(1_000_000).optional(),
  alertDuration: z.number().int().min(3).max(30).optional(),
})

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
    })

    return NextResponse.json({ ok: true, displayName: user.displayName })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
