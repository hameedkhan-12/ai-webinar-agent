import { Worker, UnrecoverableError, type Job } from 'bullmq'
import { classifyTranscript } from '@/actions/objections'
import { CallTranscriptProcessingStatusEnum } from '@/generated/prisma/enums'
import { prisma } from '@/lib/prismaClient'
import { createBullMQConnection } from '@/lib/redis'
import type { CallProcessingJobData } from '@/lib/queues/callProcessingQueue'

const QUEUE_NAME = 'call-processing'

async function sendPersonalizedFollowUp(
  attendanceId: string,
  transcriptId: string
): Promise<void> {
  // TODO: generate personalized follow-up content and send via email provider
  console.log(
    `[call-processing] TODO: send personalized follow-up email for attendance ${attendanceId}, transcript ${transcriptId}`
  )
}

export async function processCallProcessingJob(
  data: CallProcessingJobData
): Promise<void> {
  const { attendanceId, vapiCallId } = data

  const transcript = await prisma.callTranscript.findUnique({
    where: { vapiCallId },
  })

  if (!transcript) {
    throw new Error(`CallTranscript not found for vapiCallId ${vapiCallId}`)
  }

  if (transcript.attendanceId !== attendanceId) {
    throw new Error(
      `Attendance mismatch for vapiCallId ${vapiCallId}: expected ${attendanceId}, got ${transcript.attendanceId}`
    )
  }

  let status = transcript.processingStatus

  if (status === CallTranscriptProcessingStatusEnum.FOLLOWED_UP) {
    console.log(`[call-processing] Job already complete for vapiCallId ${vapiCallId}`)
    return
  }

  if (status === CallTranscriptProcessingStatusEnum.TRANSCRIPT_SAVED) {
    const result = await classifyTranscript(transcript.id)

    if (!result.success) {
      if (result.status === 429) {
        throw new UnrecoverableError(result.message || 'Objection classification rate limited')
      }

      throw new Error(result.message || 'Objection classification failed')
    }

    await prisma.callTranscript.update({
      where: { id: transcript.id },
      data: { processingStatus: CallTranscriptProcessingStatusEnum.CLASSIFIED },
    })

    status = CallTranscriptProcessingStatusEnum.CLASSIFIED
    console.log(
      `[call-processing] Classified transcript ${transcript.id} (${result.classifiedCount ?? 0} objections)`
    )
  }

  if (status === CallTranscriptProcessingStatusEnum.CLASSIFIED) {
    await sendPersonalizedFollowUp(attendanceId, transcript.id)

    await prisma.callTranscript.update({
      where: { id: transcript.id },
      data: { processingStatus: CallTranscriptProcessingStatusEnum.FOLLOWED_UP },
    })

    console.log(`[call-processing] Follow-up step complete for vapiCallId ${vapiCallId}`)
  }
}

async function handleJob(job: Job<CallProcessingJobData>): Promise<void> {
  console.log(
    `[call-processing] Processing job ${job.id} (attempt ${job.attemptsMade + 1}/${job.opts.attempts ?? 1})`
  )
  await processCallProcessingJob(job.data)
}

export function startCallProcessingWorker(): Worker<CallProcessingJobData> {
  const connection = createBullMQConnection()

  const worker = new Worker<CallProcessingJobData>(QUEUE_NAME, handleJob, {
    connection,
    concurrency: 5,
  })

  worker.on('completed', (job) => {
    console.log(`[call-processing] Job ${job.id} completed`)
  })

  worker.on('failed', (job, error) => {
    console.error(`[call-processing] Job ${job?.id} failed:`, error)
  })

  worker.on('error', (error) => {
    console.error('[call-processing] Worker error:', error)
  })

  const shutdown = async (signal: string) => {
    console.log(`[call-processing] Received ${signal}, shutting down worker...`)
    await worker.close()
    await connection.quit()
    process.exit(0)
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))

  console.log('[call-processing] Worker started, waiting for jobs...')
  return worker
}
