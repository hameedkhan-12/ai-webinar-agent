import { prisma } from '@/lib/prismaClient'
import { onAuthenticateUser } from '@/actions/auth'
import { getVapiServer } from '@/lib/vapi/vapiServer'
import { STOCK_VOICE } from '@/lib/vapi/constants'
import { deleteAudio, getSignedAudioUrl } from '@/lib/r2'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ voiceId: string }> }
) {
  const currentUser = await onAuthenticateUser()
  if (!currentUser.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { voiceId } = await params

  const voice = await prisma.voice.findUnique({
    where: { id: voiceId },
    select: { userId: true, r2ObjectKey: true },
  })

  if (!voice || voice.userId !== currentUser.user.id) {
    return new Response('Not found', { status: 404 })
  }

  if (!voice.r2ObjectKey) {
    return new Response('Voice audio is not available yet', { status: 409 })
  }

  const signedUrl = await getSignedAudioUrl(voice.r2ObjectKey)
  const audioResponse = await fetch(signedUrl)

  if (!audioResponse.ok) {
    return new Response('Failed to fetch voice audio', { status: 502 })
  }

  const contentType = audioResponse.headers.get('content-type') || 'audio/wav'

  return new Response(audioResponse.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ voiceId: string }> }
) {
  const currentUser = await onAuthenticateUser()
  if (!currentUser.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { voiceId } = await params

  const voice = await prisma.voice.findUnique({
    where: { id: voiceId },
    include: { agentVoiceConfigs: true },
  })

  if (!voice || voice.userId !== currentUser.user.id) {
    return Response.json({ error: 'Voice not found' }, { status: 404 })
  }

  // Revert any assistants currently using this voice back to stock BEFORE
  // deleting it, so they don't end up silently pointing at a cloned voice
  // that no longer exists (which would just fail mid-call every time).
  if (voice.agentVoiceConfigs.length > 0) {
    const vapiServer = getVapiServer()
    await Promise.allSettled(
      voice.agentVoiceConfigs.map((config) =>
        vapiServer.assistants.update(config.assistantId, {
          voice: STOCK_VOICE,
        })
      )
    )
  }

  if (voice.r2ObjectKey) {
    await deleteAudio(voice.r2ObjectKey).catch((error) => {
      console.error('Failed to delete voice sample from R2:', error)
      // Non-fatal - proceed with deleting the DB record regardless, an
      // orphaned R2 object is a minor cleanup issue, not a correctness one.
    })
  }

  // Cascades delete of any remaining AgentVoiceConfig rows automatically.
  await prisma.voice.delete({ where: { id: voiceId } })

  return Response.json({ message: 'Voice deleted successfully' }, { status: 200 })
}