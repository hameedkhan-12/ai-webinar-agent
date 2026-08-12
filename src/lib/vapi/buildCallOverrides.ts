import type { vapi } from './vapiclient'

export type AssistantOverrides = NonNullable<Parameters<typeof vapi.start>[1]>

/**
 * Formats top 3-5 high-converting objection insights into a concise
 * playbook string suitable for AI call context.
 */
export function buildObjectionPlaybookString(
  insights?: Array<{ label: string; bestResponse: string }> | null
): string | undefined {
  if (!insights || insights.length === 0) {
    return undefined
  }

  // Cap at top 5 entries max, formatted concisely per entry
  const topInsights = insights
    .filter((item) => item.bestResponse && item.bestResponse.trim().length > 0)
    .slice(0, 5)

  if (topInsights.length === 0) {
    return undefined
  }

  const lines = topInsights.map(
    (item) => `- [${item.label}]: ${item.bestResponse.trim()}`
  )

  return `Known Objection Playbook:\n${lines.join('\n')}`
}

/**
 * Extends call overrides to inject engagement context and top objection playbook
 * into Vapi assistant's variableValues.
 */
export function buildEngagementCallOverrides(
  engagementSummary?: string | null,
  objectionPlaybook?: string | null
): AssistantOverrides | undefined {
  if (!engagementSummary && !objectionPlaybook) {
    return undefined
  }

  const variableValues: Record<string, string> = {}

  if (engagementSummary) {
    variableValues.engagementContext = engagementSummary
  }

  if (objectionPlaybook) {
    variableValues.objectionPlaybook = objectionPlaybook
  }

  const firstMessage = engagementSummary
    ? `Hey! Thanks for hopping on. Quick context on my end - ${lowercaseFirstWord(
        engagementSummary
      )} What questions can I help with?`
    : undefined

  return {
    variableValues,
    ...(firstMessage ? { firstMessage } : {}),
  }
}

/** Lowercases just the first letter, so the summary reads naturally mid-sentence. */
function lowercaseFirstWord(text: string): string {
  if (!text) return text
  return text.charAt(0).toLowerCase() + text.slice(1)
}