import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const BANK_NAMES: Record<string, string> = {
  BCA:     'Bank Central Asia (BCA)',
  BNI:     'Bank Negara Indonesia (BNI)',
  BRI:     'Bank Rakyat Indonesia (BRI)',
  MANDIRI: 'Bank Mandiri',
  PERMATA: 'Bank Permata',
  CIMB:    'CIMB Niaga',
  DANAMON: 'Bank Danamon',
  BSI:     'Bank Syariah Indonesia (BSI)',
}

const createSchema = z.object({
  bankCode:      z.string().min(2).max(20).toUpperCase(),
  accountNumber: z.string().min(5).max(20).regex(/^\d+$/, 'Hanya angka'),
  accountName:   z.string().min(2).max(100),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const account = await prisma.bankAccount.create({
      data: {
        userId:        session.user.id,
        bankCode:      data.bankCode,
        bankName:      BANK_NAMES[data.bankCode] ?? data.bankCode,
        accountNumber: data.accountNumber,
        accountName:   data.accountName,
      },
    })

    return NextResponse.json(account, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await prisma.bankAccount.updateMany({
    where: { id, userId: session.user.id },
    data:  { isActive: false },
  })

  return NextResponse.json({ ok: true })
}
