/**
 * Manual end-to-end test for the post-call pipeline, including the new
 * follow-up email step.
 *
 * Usage:
 *   1. Make sure Postgres + Redis are running (docker compose up -d)
 *   2. Set RESEND_API_KEY (and ANTHROPIC_API_KEY or OPENAI_API_KEY) in .env
 *   3. In one terminal: pnpm worker
 *   4. In another terminal: tsx scripts/test-follow-up-pipeline.ts your-real-email@example.com
 *
 * This seeds a presenter, webinar, attendee (with the email you pass in),
 * attendance, and a call transcript containing a couple of realistic sales
 * objections, then enqueues a call-processing job exactly like the Vapi
 * webhook does. Watch the `pnpm worker` terminal for progress, and check
 * the inbox of the email you passed in.
 */
import 'dotenv/config'
import { prisma } from '@/lib/prismaClient'
import { enqueueCallProcessing } from '@/lib/queues/callProcessingQueue'

const SAMPLE_TRANSCRIPT = `
AI Agent: Hi! Thanks for joining today's webinar on scaling your sales pipeline. What questions do you have?
Prospect: This looks great, but honestly the price feels pretty high for where my business is right now.
AI Agent: Totally fair concern. Most customers at your stage start on our Starter plan, which is about a third of the price you saw on screen, and you can upgrade once you see results.
Prospect: Okay that helps. I'd also need to run this by my co-founder before committing to anything.
AI Agent: Makes sense for a decision like this. I can send over a one-pager summarizing today's call so you both can review it together.
Prospect: That would be great, thanks.
`.trim()

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: tsx scripts/test-follow-up-pipeline.ts <your-email@example.com>')
    process.exit(1)
  }

  console.log(`Seeding test data, follow-up email will be sent to: ${email}`)

  const presenter = await prisma.user.create({
    data: {
      name: 'Test Presenter',
      clerkId: `test_clerk_${Date.now()}`,
      email: `presenter+${Date.now()}@example.com`,
      profileImage: 'https://example.com/avatar.png',
    },
  })

  const webinar = await prisma.webinar.create({
    data: {
      title: 'Scaling Your Sales Pipeline with AI',
      presenterId: presenter.id,
      startTime: new Date(),
      ctaType: 'BOOK_A_CALL',
      ctaLabel: 'Book a strategy call',
      ctaUrl: 'https://example.com/book-a-call',
    },
  })

  const attendee = await prisma.attendee.upsert({
    where: { email },
    update: { name: 'Test Attendee' },
    create: {
      email,
      name: 'Test Attendee',
    },
  })

  const attendance = await prisma.attendance.create({
    data: {
      webinarId: webinar.id,
      attendeeId: attendee.id,
      attendedType: 'ATTENDED',
    },
  })

  const vapiCallId = `test-call-${Date.now()}`

  await prisma.callTranscript.create({
    data: {
      attendanceId: attendance.id,
      vapiCallId,
      transcript: SAMPLE_TRANSCRIPT,
      durationSeconds: 420,
      // processingStatus defaults to TRANSCRIPT_SAVED - the worker picks up from there
    },
  })

  console.log(`Seeded webinar=${webinar.id} attendance=${attendance.id} vapiCallId=${vapiCallId}`)
  console.log('Enqueuing call-processing job...')

  await enqueueCallProcessing({ attendanceId: attendance.id, vapiCallId })

  console.log('Job enqueued. Watch the `pnpm worker` terminal for progress:')
  console.log('  TRANSCRIPT_SAVED -> CLASSIFIED -> FOLLOWED_UP')
  console.log(`Then check the inbox for ${email}.`)

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
