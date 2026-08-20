import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyWebhookSignature } from '@/lib/midtrans'
import { broadcastDonationAlert } from '@/lib/sse'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = body

    if (!verifyWebhookSignature({ orderId: order_id, statusCode: status_code, grossAmount: gross_amount, signature: signature_key })) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const donation = await prisma.donation.findUnique({
      where: { midtransOrderId: order_id },
    })
    if (!donation) return NextResponse.json({ ok: true }) // idempotent

    const isPaid =
      (transaction_status === 'capture' && fraud_status === 'accept') ||
      transaction_status === 'settlement'

    if (isPaid && donation.status !== 'PAID') {
      await prisma.donation.update({
        where: { id: donation.id },
        data:  { status: 'PAID', paidAt: new Date() },
      })
      broadcastDonationAlert(donation.streamerId, {
        donorName: donation.donorName,
        amount:    donation.amount,
        message:   donation.message,
      })
    } else if (transaction_status === 'expire') {
      await prisma.donation.update({ where: { id: donation.id }, data: { status: 'EXPIRED' } })
    } else if (['deny', 'cancel', 'failure'].includes(transaction_status)) {
      await prisma.donation.update({ where: { id: donation.id }, data: { status: 'FAILED' } })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
