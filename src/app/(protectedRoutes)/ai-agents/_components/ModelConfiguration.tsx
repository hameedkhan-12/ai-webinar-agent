'use client'
import { updateAssistant } from '@/actions/vapi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAiAgentStore } from '@/store/useAiAgentStore'
import { Info, Loader2 } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import type { User } from '@/generated/prisma/client'
import ConfigField from './ConfigField'
import DropdownSelect from './DropdownSelect'
import VoicePicker from './VoicePicker'

type Props = {
  user: User
}

const ModelConfiguration = ({ user }: Props) => {
  const { assistant } = useAiAgentStore()
  const [firstMessage, setFirstMessage] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [customVoiceId, setCustomVoiceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  // Set once by the "Use on agent" link from the Voices page
  // (/ai-agents?voiceId=xyz) - captured on first render so it survives
  // even if no assistant is selected yet, then applied as soon as one is.
  const [pendingVoiceId, setPendingVoiceId] = useState(() =>
    searchParams.get('voiceId')
  )
  // While true, tells VoicePicker to trust customVoiceId as-is instead of
  // auto-syncing it from the assistant's currently saved voice - otherwise
  // that fetch (which resolves after this effect runs) would silently
  // overwrite the voice we just deep-linked in with whatever was already
  // saved on the server.
  const [skipServerVoiceSync, setSkipServerVoiceSync] = useState(false)

  useEffect(() => {
    if (assistant) {
      setFirstMessage(assistant?.firstMessage || '')
      setSystemPrompt(assistant?.model?.messages?.[0]?.content || '')

      if (pendingVoiceId) {
        // Reset on agent switch - VoicePicker will repopulate this from the
        // newly selected assistant's actual config via its own fetch,
        // unless we arrived here with a specific voice to apply (only
        // ever applied once, to whichever agent is selected first).
        setCustomVoiceId(pendingVoiceId)
        setSkipServerVoiceSync(true)
        toast.info(
          'Voice selected - click "Update Assistant" to apply it to this agent.'
        )
        setPendingVoiceId(null)
        // Strip the query param too, so refreshing doesn't re-trigger this.
        router.replace('/ai-agents', { scroll: false })
      } else {
        setCustomVoiceId(null)
        setSkipServerVoiceSync(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistant])

  if (!assistant) {
    return (
      <div className="flex justify-center items-center h-[500px] w-full">
        <div className="bg-neutral-900 rounded-xl p-6 w-full">
          <p className="text-primary/80 text-center">
            No assistant selected. Please select an assistant to configure the
            model settings.
          </p>
        </div>
      </div>
    )
  }

  const handleUpdateAssistant = async () => {
    setLoading(true)
    try {
      const res = await updateAssistant(
        assistant?.id,
        firstMessage,
        systemPrompt,
        customVoiceId
      )

      if (!res.success) {
        throw new Error(res.message)
      }

      toast.success('Assistant updated successfully')
    } catch (error) {
      console.error('Error updating assistant:', error)
      toast.error('Failed to update assistant')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-neutral-900 rounded-xl p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Model</h2>
        <Button
          onClick={handleUpdateAssistant}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2" />
              Updating...
            </>
          ) : (
            'Update Assistant'
          )}
        </Button>
      </div>
      <p className="text-neutral-400 mb-6">
        Configure the behavior of the assistant.
      </p>

      <div className="mb-6">
        <div className="flex items-center mb-2">
          <label className="font-medium">First Message</label>
          <Info className="h-4 w-4 text-neutral-500 ml-2" />
        </div>
        <Input
          value={firstMessage}
          onChange={(e) => setFirstMessage(e.target.value)}
          className="bg-primary/10 border-input"
        />
      </div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <label className="font-medium">System Prompt</label>
            <Info className="h-4 w-4 text-neutral-500 ml-2" />
          </div>
        </div>
        <Textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          className="min-h-[300px] max-h-[500px] bg-primary/10 border-input font-mono text-sm"
        />
      </div>

      <div className="mb-6">
        <VoicePicker
          user={user}
          assistantId={assistant.id}
          value={customVoiceId}
          onChange={setCustomVoiceId}
          skipServerSync={skipServerVoiceSync}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <ConfigField label="Provider">
          <DropdownSelect value={assistant.model?.provider || ''} />
        </ConfigField>

        <ConfigField
          label="Model"
          showInfo={true}
        >
          <DropdownSelect value={assistant.model?.model || ''} />
        </ConfigField>
      </div>
    </div>
  )
}

export default ModelConfiguration