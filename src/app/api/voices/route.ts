import { prisma } from '@/lib/prismaClient'
import { onAuthenticateUser } from '@/actions/auth'

export async function GET(request: Request) {
  const currentUser = await onAuthenticateUser()
  if (!currentUser.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const assistantId = url.searchParams.get('assistantId')

  const [voices, currentConfig] = await Promise.all([
    prisma.voice.findMany({
      where: { userId: currentUser.user.id, variant: 'CUSTOM' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        language: true,
        createdAt: true,
      },
    }),
    assistantId
      ? prisma.agentVoiceConfig.findUnique({
          where: { assistantId },
          select: { voiceId: true, userId: true },
        })
      : Promise.resolve(null),
  ])

  const currentVoiceId =
    currentConfig && currentConfig.userId === currentUser.user.id
      ? currentConfig.voiceId
      : null

  return Response.json({ voices, currentVoiceId }, { status: 200 })
}