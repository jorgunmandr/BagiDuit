# BagiDuit

Streamer donation platform with Indonesian QRIS and bank VA payments.

## Stack
- **Next.js 14** (App Router, TypeScript)
- **PostgreSQL** + **Prisma ORM**
- **Midtrans** (payment gateway — QRIS + Virtual Account)
- **NextAuth.js** (credentials auth, JWT)
- **Tailwind CSS**
- **SSE** for real-time OBS donation alerts

## Key routes
| Path | Description |
|---|---|
| `/[username]` | Public donor page |
| `/[username]/pay/[orderId]` | Payment page (QR / VA display + status polling) |
| `/overlay/[streamerId]` | OBS browser source (SSE-driven alert overlay) |
| `/dashboard` | Streamer dashboard |
| `/dashboard/settings` | Profile + bank accounts |

## API routes
| Route | Description |
|---|---|
| `POST /api/register` | Create streamer account |
| `POST /api/donations/create` | Create Midtrans charge |
| `POST /api/donations/webhook` | Midtrans payment notification |
| `GET  /api/donations/status/[orderId]` | Poll payment status |
| `GET  /api/alerts/stream/[streamerId]` | SSE stream for OBS overlay |
| `GET  /api/dashboard/donations` | Dashboard donation list + stats |
| `GET/PUT /api/dashboard/settings` | Streamer settings |
| `POST/DELETE /api/dashboard/bank-accounts` | Manage bank accounts |

## Setup
```bash
cp .env.example .env
# Fill in DATABASE_URL, NEXTAUTH_SECRET, MIDTRANS keys

npm install
npx prisma migrate dev --name init
npm run dev
```

## Docker deploy
```bash
# Edit docker-compose.yml with real credentials
docker compose up -d
docker compose exec app npx prisma migrate deploy
```

## Midtrans webhook
Set notification URL in Midtrans dashboard:
`https://your-domain.com/api/donations/webhook`

## SSE note
The SSE alert system uses in-memory state. For multi-process deployments (PM2 cluster, multiple Docker replicas), replace `src/lib/sse.ts` with Redis Pub/Sub.
