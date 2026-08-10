import 'dotenv/config'
import { getVapiServer } from '../src/lib/vapi/vapiServer'
import { prisma } from '../src/lib/prismaClient'

const CUSTOM_VOICE_TIMEOUT_SECONDS = 30
const getAppUrl = () => (process.env.APP_URL ?? '').replace(/\/+$/, '')

const buildCustomVoiceConfig = (assistantId: string) => ({
  provider: 'custom-voice' as const,
  server: {
    url: `${getAppUrl()}/api/vapi/voice/${assistantId}`,
    secret: process.env.VAPI_CUSTOM_VOICE_SECRET,
    timeoutSeconds: CUSTOM_VOICE_TIMEOUT_SECONDS,
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
  },
  fallbackPlan: {
    voices: [{ provider: 'vapi' as const, voiceId: 'Elliot' as const, version: 2 as const }],
  },
})

async function main() {
  const [assistantId, voiceId] = process.argv.slice(2)
  if (!assistantId || !voiceId) {
    console.error('Usage: npx tsx scripts/repair-voice-config.ts <assistantId> <voiceId>')
    process.exit(1)
  }

  const voice = await prisma.voice.findUnique({ where: { id: voiceId } })
  if (!voice) {
    console.error(`Voice ${voiceId} not found`)
    process.exit(1)
  }
  if (voice.variant === 'CUSTOM' && !voice.userId) {
    console.error(`Custom voice ${voiceId} has no owning userId`)
    process.exit(1)
  }

  const vapiServer = getVapiServer()
  const updated = await vapiServer.assistants.update(assistantId, {
    voice: buildCustomVoiceConfig(assistantId),
    serverMessages: [],
  })
  console.log('Pushed updated voice config to Vapi:', JSON.stringify(updated.voice, null, 2))

  const userId = voice.userId
  if (!userId) {
    console.log('SYSTEM voice - no AgentVoiceConfig row needed beyond what already exists.')
    return
  }

  const config = await prisma.agentVoiceConfig.upsert({
    where: { assistantId },
    create: { assistantId, userId, voiceId },
    update: { voiceId },
  })
  console.log('AgentVoiceConfig row:', config)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
    .finally(() => process.exit(0))
