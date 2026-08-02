import type { AssistantOverrides } from '@vapi-ai/web'

/**
 * Builds per-call overrides that inject engagement context into the AI
 * agent's conversation. Two mechanisms, both supported natively by Vapi:
 *
 * 1. `variableValues.engagementContext` - available for use inside the
 *    agent's system prompt via `{{engagementContext}}` templating, for
 *    hosts who want to control exactly where/how it's referenced.
 * 2. `firstMessage` - a ready-to-use opening line that directly
 *    references the context, for hosts who don't customize their prompt
 *    to use the template variable. This is what makes the feature work
 *    out of the box with zero prompt-editing required.
 *
 * If there's no meaningful engagement summary (e.g. the lookup failed,
 * or this is truly the attendee's first interaction), this returns
 * undefined so the call falls back to the agent's own default
 * firstMessage untouched - never inject a broken/empty override.
 */
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