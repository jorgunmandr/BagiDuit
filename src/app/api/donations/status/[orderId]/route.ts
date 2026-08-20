import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const donation = await prisma.donation.findUnique({
    where: { midtransOrderId: params.orderId },
    select: { status: true, paidAt: true, expiredAt: true, donorName: true, amount: true },
  })

  if (!donation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(donation)
}
