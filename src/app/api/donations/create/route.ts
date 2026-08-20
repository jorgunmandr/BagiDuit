import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createQrisCharge, createVACharge, BANK_VA_MAP } from '@/lib/midtrans'

const schema = z.object({
  streamerId:    z.string(),
  donorName:     z.string().min(1).max(50),
  message:       z.string().max(200).optional(),
  amount:        z.number().int().min(1000).max(10_000_000),
  paymentMethod: z.enum(['QRIS', 'BCA_VA', 'BNI_VA', 'BRI_VA', 'MANDIRI_VA', 'PERMATA_VA']),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    const streamer = await prisma.user.findUnique({ where: { id: data.streamerId } })
    if (!streamer) return NextResponse.json({ error: 'Streamer tidak ditemukan' }, { status: 404 })

    if (data.amount < streamer.minDonation) {
      return NextResponse.json(
        { error: `Minimum donasi Rp ${streamer.minDonation.toLocaleString('id-ID')}` },
        { status: 400 }
      )
    }

    const orderId = `BD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    let qrString:  string | null = null
    let vaNumber:  string | null = null
    let expiredAt: Date

    if (data.paymentMethod === 'QRIS') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await createQrisCharge({
        orderId,
        amount:    data.amount,
        donorName: data.donorName,
      })
      qrString  = res.qr_string ?? null
      expiredAt = new Date(Date.now() + 15 * 60 * 1000)
    } else {
      const bank = BANK_VA_MAP[data.paymentMethod]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await createVACharge({
        orderId,
        amount:    data.amount,
        donorName: data.donorName,
        bank,
      })
      // Permata uses a different field name
      vaNumber  = res.permata_va_number ?? res.va_numbers?.[0]?.va_number ?? null
      expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    }

    const donation = await prisma.donation.create({
      data: {
        streamerId:      data.streamerId,
        donorName:       data.donorName,
        message:         data.message ?? null,
        amount:          data.amount,
        paymentMethod:   data.paymentMethod as never,
        midtransOrderId: orderId,
        qrString,
        vaNumber,
        expiredAt,
      },
    })

    return NextResponse.json({
      donationId:    donation.id,
      orderId,
      paymentMethod: data.paymentMethod,
      qrString,
      vaNumber,
      amount:        data.amount,
      expiredAt,
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error('Create donation error:', err)
    return NextResponse.json({ error: 'Gagal membuat pembayaran' }, { status: 500 })
  }
}
