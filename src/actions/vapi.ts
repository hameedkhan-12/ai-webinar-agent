'use server'

import { aiAgentPrompt } from '@/lib/data'
import { getVapiServer } from '@/lib/vapi/vapiServer'
import { prisma } from '@/lib/prismaClient'
import { onAuthenticateUser } from './auth'
import { getAssistantId, toAssistantSummary } from '@/lib/vapi/types'
import { STOCK_VOICE } from '@/lib/vapi/constants'

// Falls back to the stock voice mid-call if our custom-voice server is
// slow/unreachable (e.g. a Modal cold start), instead of the call going
// silent. Vapi enforces this timeout itself.
const CUSTOM_VOICE_TIMEOUT_SECONDS = 8

const buildCustomVoiceConfig = (assistantId: string) => ({
  provider: 'custom-voice' as const,
  server: {
    url: `${process.env.APP_URL}/api/vapi/voice/${assistantId}`,
    secret: process.env.VAPI_CUSTOM_VOICE_SECRET,
    timeoutSeconds: CUSTOM_VOICE_TIMEOUT_SECONDS,
  },
  fallbackPlan: {
    voices: [STOCK_VOICE],
  },
})

/**
 * Verifies the current user is entitled to use a given cloned voice
 * (owns it, and has the paid custom-voice add-on enabled).
 */
const assertCanUseCustomVoice = async (voiceId: string) => {
  const currentUser = await onAuthenticateUser()
  if (!currentUser.user) {
    throw new Error('Unauthorized')
  }
  if (!currentUser.user.customVoiceEnabled) {
    throw new Error(
      'Custom voice cloning is a paid add-on. Upgrade to use a cloned voice.'
    )
  }
  const voice = await prisma.voice.findUnique({ where: { id: voiceId } })
  if (!voice || voice.userId !== currentUser.user.id) {
    throw new Error('Voice not found')
  }
  return { userId: currentUser.user.id, voiceId }
}

export const getAllAssistants = async () => {
  try {
    const vapiServer = getVapiServer()
    const getAllAgents = await vapiServer.assistants.list()
    return {
      success: true,
      status: 200,
      data: getAllAgents.map(toAssistantSummary),
    }
  } catch (error) {
    console.error('Error fetching agents:', error)
    return {
      success: false,
      status: 500,
      message: 'Failed to fetch agents',
    }
  }
}
export const createAssistant = async (name: string, customVoiceId?: string) => {
  try {
    let entitlement: { userId: string; voiceId: string } | null = null
    if (customVoiceId) {
      entitlement = await assertCanUseCustomVoice(customVoiceId)
    }

    const vapiServer = getVapiServer()

    // Step 1: create with the stock voice - we don't know the assistant's
    // own ID until after creation, and the custom-voice server URL needs it.
    const created = await vapiServer.assistants.create({
      name,
      voice: STOCK_VOICE,
      firstMessage: `Hey how are you today?`,
      model: {
        model: 'gpt-4o',
        provider: 'openai',
        messages: [
          {
            role: 'system',
            content: aiAgentPrompt,
          },
        ],
        temperature: 0.5,
      },
      serverMessages: [],
    })

    const createdAssistantId = getAssistantId(created)

    // Step 2: if a custom voice was requested, patch the assistant with
    // its own voice server URL now that we know its ID.
    if (entitlement) {
      await vapiServer.assistants.update(createdAssistantId, {
        voice: buildCustomVoiceConfig(createdAssistantId),
        serverMessages: [],
      })
      await prisma.agentVoiceConfig.create({
        data: {
          assistantId: createdAssistantId,
          userId: entitlement.userId,
          voiceId: entitlement.voiceId,
        },
      })
    }

    return {
      success: true,
      status: 200,
      data: toAssistantSummary(created),
    }
  } catch (error) {
    console.error('Error creating assistant:', error)
    return {
      success: false,
      status: 500,
      message:
        error instanceof Error ? error.message : 'Failed to create assistant',
    }
  }
}

export const updateAssistant = async (
  assistantId: string,
  firstMessage: string,
  systemPrompt: string,
  customVoiceId?: string | null
) => {
  try {
    const vapiServer = getVapiServer()

    const voiceUpdate =
      customVoiceId === undefined
        ? undefined // leave voice untouched
        : customVoiceId === null
          ? STOCK_VOICE // explicit request to revert to stock voice
          : buildCustomVoiceConfig(assistantId)

    if (customVoiceId) {
      const entitlement = await assertCanUseCustomVoice(customVoiceId)
      await prisma.agentVoiceConfig.upsert({
        where: { assistantId },
        create: {
          assistantId,
          userId: entitlement.userId,
          voiceId: entitlement.voiceId,
        },
        update: { voiceId: entitlement.voiceId },
      })
    } else if (customVoiceId === null) {
      await prisma.agentVoiceConfig.deleteMany({ where: { assistantId } })
    }

    const updateAssistant = await vapiServer.assistants.update(assistantId, {
      firstMessage: firstMessage,
      model: {
        model: 'gpt-4o',
        provider: 'openai',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
        ],
      },
      ...(voiceUpdate ? { voice: voiceUpdate } : {}),
      serverMessages: [],
    })

    return {
      success: true,
      status: 200,
      data: toAssistantSummary(updateAssistant),
    }
  } catch (error) {
    console.error('Error updating assistant:', error)
    return {
      success: false,
      status: 500,
      message:
        error instanceof Error ? error.message : 'Failed to update assistant',
      error: error,
    }
  }
}