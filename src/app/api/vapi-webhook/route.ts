import { prisma } from '@/lib/prismaClient'
import { enqueueCallProcessing } from '@/lib/queues/callProcessingQueue'
import { markCallEnded } from '@/lib/redis/presence'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Vapi webhook secret header if configured
    const vapiSecret = request.headers.get('x-vapi-secret')
    const configuredSecret = process.env.VAPI_WEBHOOK_SECRET

    if (configuredSecret && vapiSecret !== configuredSecret) {
      console.warn('[vapi-webhook] Unauthorized webhook attempt: secret mismatch')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    let body: any
    try {
      body = await request.json()
    } catch {
      return new NextResponse('Invalid JSON body', { status: 400 })
    }

    const message = body.message || body
    const messageType = message.type

    // We specifically handle the 'end-of-call-report' message type
    if (messageType !== 'end-of-call-report') {
      return NextResponse.json({ status: 'ignored', messageType })
    }

    const call = message.call || body.call || {}
    const vapiCallId: string = call.id || message.callId || body.callId

    if (!vapiCallId) {
      console.error('[vapi-webhook] Missing call ID in end-of-call-report')
      return new NextResponse('Missing call ID', { status: 400 })
    }

    // Extract transcript text
    const transcriptText: string =
      message.transcript ||
      call.transcript ||
      message.artifact?.transcript ||
      call.artifact?.transcript ||
      ''

    // Resolve attendanceId from call metadata or variableValues
    const attendanceId: string | undefined =
      call.metadata?.attendanceId ||
      call.variableValues?.attendanceId ||
      message.metadata?.attendanceId ||
      message.variableValues?.attendanceId

    let resolvedAttendanceId = attendanceId

    // Fallback: If attendanceId wasn't passed in metadata, check if there's an InProgress attendance
    if (!resolvedAttendanceId) {
      const recentAttendance = await prisma.attendance.findFirst({
        where: { callStatus: 'InProgress' },
        orderBy: { updatedAt: 'desc' },
      })
      if (recentAttendance) {
        resolvedAttendanceId = recentAttendance.id
      }
    }

    if (!resolvedAttendanceId) {
      console.error(
        `[vapi-webhook] Could not resolve Attendance for vapiCallId ${vapiCallId}`
      )
      return NextResponse.json(
        { error: 'Could not resolve Attendance for call' },
        { status: 400 }
      )
    }

    const attendance = await prisma.attendance.findUnique({
      where: { id: resolvedAttendanceId },
      select: { webinarId: true },
    })

    if (!attendance) {
      console.error(
        `[vapi-webhook] Attendance ${resolvedAttendanceId} not found for vapiCallId ${vapiCallId}`
      )
      return NextResponse.json({ error: 'Attendance not found' }, { status: 400 })
    }

    await markCallEnded(resolvedAttendanceId, attendance.webinarId)

    // Extract duration
    let durationSeconds: number | null = null
    if (typeof message.durationSeconds === 'number') {
      durationSeconds = Math.round(message.durationSeconds)
    } else if (typeof call.durationSeconds === 'number') {
      durationSeconds = Math.round(call.durationSeconds)
    } else if (call.startedAt && call.endedAt) {
      const start = new Date(call.startedAt).getTime()
      const end = new Date(call.endedAt).getTime()
      if (!isNaN(start) && !isNaN(end)) {
        durationSeconds = Math.max(0, Math.round((end - start) / 1000))
      }
    }

    // Upsert CallTranscript record
    const callTranscript = await prisma.callTranscript.upsert({
      where: { vapiCallId },
      create: {
        vapiCallId,
        attendanceId: resolvedAttendanceId,
        transcript: transcriptText,
        durationSeconds,
      },
      update: {
        transcript: transcriptText,
        durationSeconds,
      },
    })

    console.log(
      `[vapi-webhook] Saved transcript for call ${vapiCallId} (Attendance: ${resolvedAttendanceId})`
    )

    await enqueueCallProcessing({
      attendanceId: resolvedAttendanceId,
      vapiCallId,
    })

    console.log(`[vapi-webhook] Enqueued call-processing job for ${vapiCallId}`)

    return NextResponse.json({
      success: true,
      transcriptId: callTranscript.id,
    })
  } catch (error) {
    console.error('[vapi-webhook] Error processing end-of-call-report:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
