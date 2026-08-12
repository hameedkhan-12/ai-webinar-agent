This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Required infrastructure

This app requires **PostgreSQL** and **Redis** — both are mandatory, not optional. If either is unreachable, affected routes fail fast (health check returns 503; no silent fallbacks).

For local development, start both services with Docker Compose:

```bash
docker compose up -d
```

Copy `.env.example` to `.env` and set `DATABASE_URL` and `REDIS_URL` (defaults work with the Docker Compose services above).

Verify connectivity:

```bash
curl http://localhost:3000/api/health
```

Expected response when healthy: `{"status":"ok","checks":{"database":"ok","redis":"ok"}}`

### Background worker (post-call processing)

The post-call pipeline (objection classification + follow-up) runs in a separate BullMQ worker process — not inside the Next.js server:

```bash
pnpm worker
```

Run this alongside `pnpm dev` whenever testing Vapi end-of-call webhooks.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
