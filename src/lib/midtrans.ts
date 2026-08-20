import { CoreApi } from 'midtrans-client'
import crypto from 'crypto'

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true'

export const coreApi = new CoreApi({
  isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!,
})

export const BANK_VA_MAP: Record<string, string> = {
  BCA_VA:     'bca',
  BNI_VA:     'bni',
  BRI_VA:     'bri',
  MANDIRI_VA: 'mandiri',
  PERMATA_VA: 'permata',
}

export async function createQrisCharge(params: {
  orderId: string
  amount: number
  donorName: string
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response: any = await coreApi.charge({
    payment_type: 'qris',
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.amount,
    },
    customer_details: {
      first_name: params.donorName,
    },
    custom_expiry: {
      unit: 'minute',
      expiry_duration: 15,
    },
  })
  return response
}

export async function createVACharge(params: {
  orderId: string
  amount: number
  donorName: string
  bank: string
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response: any = await coreApi.charge({
    payment_type: 'bank_transfer',
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.amount,
    },
    customer_details: {
      first_name: params.donorName,
    },
    bank_transfer: {
      bank: params.bank,
    },
    custom_expiry: {
      unit: 'hour',
      expiry_duration: 24,
    },
  })
  return response
}

export function verifyWebhookSignature(params: {
  orderId: string
  statusCode: string
  grossAmount: string
  signature: string
}): boolean {
  const raw = params.orderId + params.statusCode + params.grossAmount + process.env.MIDTRANS_SERVER_KEY!
  const hash = crypto.createHash('sha512').update(raw).digest('hex')
  return hash === params.signature
}
