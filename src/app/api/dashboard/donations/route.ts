import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page  = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = 20

  const [donations, total] = await Promise.all([
    prisma.donation.findMany({
      where:   { streamerId: session.user.id },
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
      select:  {
        id: true, donorName: true, message: true, amount: true,
        paymentMethod: true, status: true, paidAt: true, createdAt: true,
      },
    }),
    prisma.donation.count({ where: { streamerId: session.user.id } }),
  ])

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const todayStats = await prisma.donation.aggregate({
    where: { streamerId: session.user.id, status: 'PAID', paidAt: { gte: todayStart } },
    _sum:   { amount: true },
    _count: true,
  })

  const allTimeStats = await prisma.donation.aggregate({
    where:  { streamerId: session.user.id, status: 'PAID' },
    _sum:   { amount: true },
    _count: true,
  })

  return NextResponse.json({
    donations,
    pagination: { page, total, pages: Math.ceil(total / limit) },
    stats: {
      today:   { total: todayStats._sum.amount ?? 0,   count: todayStats._count },
      allTime: { total: allTimeStats._sum.amount ?? 0, count: allTimeStats._count },
    },
  })
}
