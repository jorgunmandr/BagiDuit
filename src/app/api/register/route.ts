import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  username:    z.string().min(3).max(30).regex(/^[a-z0-9_]+$/, 'Hanya huruf kecil, angka, dan underscore'),
  email:       z.string().email(),
  password:    z.string().min(8),
  displayName: z.string().min(2).max(50),
})

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const data   = schema.parse(body)
    const hashed = await bcrypt.hash(data.password, 12)

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
    })

    if (exists) {
      const field = exists.email === data.email ? 'Email' : 'Username'
      return NextResponse.json({ error: `${field} sudah digunakan` }, { status: 409 })
    }

    const user = await prisma.user.create({
      data: {
        username:    data.username,
        email:       data.email,
        password:    hashed,
        displayName: data.displayName,
      },
    })

    return NextResponse.json({ id: user.id, username: user.username }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
