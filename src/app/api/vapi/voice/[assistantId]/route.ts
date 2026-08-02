import { prisma } from '@/lib/prismaClient'
import { generateSpeech } from '@/lib/chatterbox'
import { wavToPcm16 } from '@/lib/wavToPcm'
import { NextRequest } from 'next/server'

type VapiVoiceRequestBody = {
  message: {
    type: 'voice-request'
    text: string
    sampleRate: number
  }
}

// Keep this well under the timeoutSeconds we configure on the assistant's
// voice.server.timeoutSeconds, so we fail fast and let Vapi's
// fallbackPlan take over instead of the call going silent.
const GENERATION_TIMEOUT_MS = 6000

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assistantId: string }> }
) {
  // Verify this request actually came from Vapi.
  const vapiSecret = request.headers.get('x-vapi-secret')
  if (
    !process.env.VAPI_CUSTOM_VOICE_SECRET ||
    vapiSecret !== process.env.VAPI_CUSTOM_VOICE_SECRET
  ) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { assistantId } = await params

  let body: VapiVoiceRequestBody
  try {
    body = await request.json()
  } catch {
    return new Response('Invalid JSON body', { status: 400 })
  }

  if (body.message?.type !== 'voice-request') {
    return new Response('Unsupported message type', { status: 400 })
  }

  const { text, sampleRate } = body.message

  if (!text || !sampleRate) {
    return new Response('Missing text or sampleRate', { status: 400 })
  }

  const config = await prisma.agentVoiceConfig.findUnique({
    where: { assistantId },
    include: { voice: true },
  })

  if (!config || !config.voice.r2ObjectKey) {
    return new Response('No custom voice configured for this assistant', {
      status: 404,
    })
  }

  try {
    const wavBuffer = await Promise.race([
      generateSpeech({ prompt: text, voiceKey: config.voice.r2ObjectKey }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Chatterbox generation timed out')),
          GENERATION_TIMEOUT_MS
        )
      ),
    ])

    const pcmBuffer = wavToPcm16(wavBuffer, sampleRate)

    return new Response(pcmBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    })
  } catch (error) {
    console.error(
      `Custom voice generation failed for assistant ${assistantId}:`,
      error
    )
    // Non-2xx here triggers Vapi's fallbackPlan (stock voice) for this
    // turn rather than leaving the call silent.
    return new Response('Voice generation failed', { status: 500 })
  }
}