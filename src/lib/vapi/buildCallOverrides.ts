import type { AssistantOverrides } from '@vapi-ai/web'


export function buildEngagementCallOverrides(
  engagementSummary: string | null | undefined
): AssistantOverrides | undefined {
  if (!engagementSummary) {
    return undefined
  }

  return {
    variableValues: {
      engagementContext: engagementSummary,
    },
    firstMessage: `Hey! Thanks for hopping on. Quick context on my end - ${lowercaseFirstWord(
      engagementSummary
    )} What questions can I help with?`,
  }
}

/** Lowercases just the first letter, so the summary reads naturally mid-sentence. */
function lowercaseFirstWord(text: string): string {
  if (!text) return text
  return text.charAt(0).toLowerCase() + text.slice(1)
}