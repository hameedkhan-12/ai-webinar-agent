'use server'

import { aiAgentPrompt } from '@/lib/data'
import { getVapiServer } from '@/lib/vapi/vapiServer'

export const getAllAssistants = async () => {
  try {
    const vapiServer = getVapiServer()
    const getAllAgents = await vapiServer.assistants.list()
    return {
      success: true,
      status: 200,
      data: getAllAgents,
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
export const createAssistant = async (name: string) => {
  try {
    const vapiServer = getVapiServer()
    const createAssistant = await vapiServer.assistants.create({
      name,
      voice: {
        provider: 'vapi',
        voiceId: 'Cole',
      },
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
      serverMessages: [], // Added missing required field
    })

    return {
      success: true,
      status: 200,
      data: createAssistant,
    }
  } catch (error) {
    console.error('Error creating assistant:', error)
    return {
      success: false,
      status: 500,
      message: 'Failed to create assistant',
    }
  }
}

export const updateAssistant = async (
  assistantId: string,
  firstMessage: string,
  systemPrompt: string
) => {
  try {
    const vapiServer = getVapiServer()
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
      serverMessages: [],
    })
    console.log('Assistant updated:', updateAssistant)

    return {
      success: true,
      status: 200,
      data: updateAssistant,
    }
  } catch (error) {
    console.error('Error updating assistant:', error)
    return {
      success: false,
      status: 500,
      message: 'Failed to update assistant',
      error: error,
    }
  }
}
