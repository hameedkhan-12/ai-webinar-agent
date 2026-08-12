import { Queue } from 'bullmq'
import { createBullMQConnection } from '@/lib/redis'

export type CallProcessingJobData = {
  attendanceId: string
  vapiCallId: string
}

const QUEUE_NAME = 'call-processing'

const globalForQueue = globalThis as unknown as {
  callProcessingQueue: Queue<CallProcessingJobData> | undefined
}

function getCallProcessingQueue(): Queue<CallProcessingJobData> {
  if (!globalForQueue.callProcessingQueue) {
    globalForQueue.callProcessingQueue = new Queue<CallProcessingJobData>(QUEUE_NAME, {
      connection: createBullMQConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    })
  }

  return globalForQueue.callProcessingQueue
}

export async function enqueueCallProcessing(job: CallProcessingJobData): Promise<void> {
  const queue = getCallProcessingQueue()

  await queue.add('process-call', job, {
    jobId: `call-${job.vapiCallId}`,
  })
}
