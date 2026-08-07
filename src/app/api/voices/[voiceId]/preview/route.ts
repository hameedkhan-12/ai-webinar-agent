import { z } from 'zod'
import { prisma } from '@/lib/prismaClient'
import { onAuthenticateUser } from '@/actions/auth'
import { generateSpeech } from '@/lib/chatterbox'

const previewSchema = z.object({
  text: z.string().min(1).max(300),
})

const GENERATION_TIMEOUT_MS = 20000

export async function POST(
  request: Request,
  { params }: { params: Promise<{ voiceId: string }> }
) {
  const currentUser = await onAuthenticateUser()
  if (!currentUser.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!currentUser.user.customVoiceEnabled) {
    return Response.json({ error: 'SUBSCRIPTION_REQUIRED' }, { status: 403 })
  }

  const { voiceId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = previewSchema.safeParse(body)
  if (!validation.success) {
    return Response.json(
      { error: 'Invalid input', issues: validation.error.issues },
      { status: 400 }
    )
  }

  const voice = await prisma.voice.findUnique({
    where: { id: voiceId },
    select: { userId: true, variant: true, r2ObjectKey: true },
  })

  if (!voice) {
    return Response.json({ error: 'Voice not found' }, { status: 404 })
  }

  // SYSTEM (built-in) voices are shared - only CUSTOM (cloned) voices are
  // ownership-checked.
  if (voice.variant === 'CUSTOM' && voice.userId !== currentUser.user.id) {
    return Response.json({ error: 'Voice not found' }, { status: 404 })
  }

  if (!voice.r2ObjectKey) {
    return Response.json(
      { error: 'Voice audio is not available yet' },
      { status: 409 }
    )
  }

  try {
    const wavBuffer = await Promise.race([
      generateSpeech({
        prompt: validation.data.text,
        voiceKey: voice.r2ObjectKey,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Voice generation timed out')),
          GENERATION_TIMEOUT_MS
        )
      ),
    ])

    return new Response(new Uint8Array(wavBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error(`Voice preview generation failed for ${voiceId}:`, error)

    const message =
      error instanceof Error && error.message.includes('CHATTERBOX_API')
        ? error.message
        : 'Failed to generate preview. Please try again.'

    return Response.json({ error: message }, { status: 502 })
  }
}