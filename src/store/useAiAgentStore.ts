import type { VapiAssistantSummary } from '@/lib/vapi/types'
import { create } from 'zustand'


type AiAgentStore = {
  assistant: VapiAssistantSummary | null
  setAssistant: (assistant: VapiAssistantSummary) => void
  clearAiAssistant: () => void
}

export const useAiAgentStore = create<AiAgentStore>((set) => ({
  assistant: null,
  setAssistant: (assistant) => set({ assistant }),
  clearAiAssistant: () => set({ assistant: null }),
}))