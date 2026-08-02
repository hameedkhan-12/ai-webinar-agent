export interface VapiAssistantSummary {
  id: string
  name?: string
  firstMessage?: string
  model?: {
    provider?: string
    model?: string
    messages?: { role: string; content: string }[]
  }
  voice?: Record<string, unknown>
}

export function getAssistantId(raw: unknown): string {
  if (typeof raw !== 'object' || raw === null) {
    return ''
  }

  const candidate = raw as Record<string, unknown>
  const directId = candidate.id
  if (typeof directId === 'string' && directId.trim()) {
    return directId
  }

  const assistantId = candidate.assistantId
  if (typeof assistantId === 'string' && assistantId.trim()) {
    return assistantId
  }

  return ''
}

export function toAssistantSummary(raw: unknown): VapiAssistantSummary {
  const obj = raw as {
    id?: string
    assistantId?: string
    name?: string
    firstMessage?: string
    model?: unknown
    voice?: unknown
  }
  const assistantId = getAssistantId(raw)

  if (!assistantId && process.env.NODE_ENV !== 'production') {
    console.warn(
      'toAssistantSummary: received an assistant object with no `id` or `assistantId`. ' +
        'This usually means the Vapi SDK response shape changed - check ' +
        'the raw object.',
      raw
    )
  }

  return {
    id: assistantId || obj.id || obj.assistantId || '',
    name: obj.name,
    firstMessage: obj.firstMessage,
    model: obj.model as VapiAssistantSummary['model'],
    voice: obj.voice as VapiAssistantSummary['voice'],
  }
}