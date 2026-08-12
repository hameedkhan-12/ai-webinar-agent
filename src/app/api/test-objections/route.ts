import { prisma } from '@/lib/prismaClient'
import { NextRequest, NextResponse } from 'next/server'
import { classifyTranscript } from '@/actions/objections'

/**
 * TEST-ONLY endpoint — seeds a fake transcript + objections so you can
 * verify the Objection Intelligence dashboard without a real Vapi call.
 *
 * Usage (GET in browser):
 *   http://localhost:3000/api/test-objections?webinarId=<your-webinar-id>
 *
 * REMOVE this file before going to production.
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const webinarId = searchParams.get('webinarId')

  try {
    // --- 1. Find a real Attendance record to link to ---
    const attendance = await prisma.attendance.findFirst({
      where: webinarId ? { webinarId } : undefined,
      include: { webinar: { select: { id: true, title: true, price: true } } },
    })

    if (!attendance) {
      return NextResponse.json({
        error: 'No Attendance records found.',
        tip: 'Register as an attendee on a live webinar first, then re-run this endpoint.',
        hint: 'Or pass ?webinarId=<your-webinar-id> if you know it.',
      }, { status: 404 })
    }

    // --- 2. Seed a realistic fake transcript ---
    const fakeTranscript = `
Agent: Hey! Thanks for hopping on the call today. How are you doing?
Prospect: Good, good. I watched the webinar earlier.
Agent: Awesome! What stood out to you the most?
Prospect: Honestly, the idea of 1-on-1 mentorship sounds great. But I'm a bit worried about the price. It feels like a lot right now.
Agent: I completely understand. Budget is something a lot of people think about. Can I ask — if the price wasn't a concern, is this the kind of program you'd be excited to jump into?
Prospect: Yeah, honestly yes. But I also need to talk to my wife before making a financial commitment this big.
Agent: That makes total sense, and I respect that. When you talk to her, here's what I'd highlight — this is a one-time investment that replaces ongoing subscription costs. Would it help if I sent a quick breakdown you could share with her?
Prospect: Yeah that could work actually.
Agent: Perfect. And just to be clear — the price covers everything: unlimited courses, the software, and the mentorship. Nothing extra.
Prospect: Okay, I'm actually starting to feel more confident about it. Can you walk me through the onboarding process?
Agent: Absolutely! Once you click Buy Now, you'll get immediate access...
`

    const vapiCallId = `test-call-${Date.now()}`

    const callTranscript = await prisma.callTranscript.upsert({
      where: { vapiCallId },
      create: {
        vapiCallId,
        attendanceId: attendance.id,
        transcript: fakeTranscript.trim(),
        durationSeconds: 420,
      },
      update: {
        transcript: fakeTranscript.trim(),
        durationSeconds: 420,
      },
    })

    // --- 3. Run classification ---
    const result = await classifyTranscript(callTranscript.id)

    // --- 4. Count what was created ---
    const objectionCount = await prisma.objection.count({
      where: { webinarId: attendance.webinarId },
    })
    const instanceCount = await prisma.objectionInstance.count({
      where: { attendance: { webinarId: attendance.webinarId } },
    })

    return NextResponse.json({
      success: true,
      message: '✅ Test data seeded successfully!',
      transcriptId: callTranscript.id,
      attendanceId: attendance.id,
      webinarId: attendance.webinarId,
      webinarTitle: attendance.webinar?.title,
      classificationResult: result,
      stats: {
        objectionsInDB: objectionCount,
        instancesInDB: instanceCount,
      },
      nextStep: `Open http://localhost:3000/webinars/${attendance.webinarId}/insights to see the Objection Intelligence Dashboard!`,
    })
  } catch (error) {
    console.error('[test-objections]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
