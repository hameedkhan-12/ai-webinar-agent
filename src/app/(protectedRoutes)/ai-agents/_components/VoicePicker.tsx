'use client'
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Lock, Mic, Plus } from 'lucide-react'
import type { User } from '@/generated/prisma/client'
import VoiceUploadModal from './VoiceUploadModal'
import CustomVoiceAddonModal from '@/components/ReusableComponent/CustomVoiceAddOnModel'

type VoiceSummary = {
  id: string
  name: string
}

type Props = {
  user: User
  /** Pass the assistant's Vapi ID when editing an existing agent, so the
   * picker can preload which cloned voice (if any) it currently uses. */
  assistantId?: string
  /** null = stock voice */
  value: string | null
  onChange: (voiceId: string | null) => void
}

const STOCK_VOICE_VALUE = '__stock__'

const VoicePicker = ({ user, assistantId, value, onChange }: Props) => {
  const [voices, setVoices] = useState<VoiceSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [addonModalOpen, setAddonModalOpen] = useState(false)
  const [hasAppliedServerValue, setHasAppliedServerValue] = useState(false)

  const fetchVoices = async () => {
    setLoading(true)
    try {
      const params = assistantId ? `?assistantId=${assistantId}` : ''
      const res = await fetch(`/api/voices${params}`)
      if (!res.ok) return

      const data: { voices: VoiceSummary[]; currentVoiceId: string | null } =
        await res.json()
      setVoices(data.voices)

      // Only auto-apply the server's current selection once, on first
      // load for the edit flow - don't stomp on a value the user then
      // changes themselves on a later refetch.
      if (assistantId && !hasAppliedServerValue) {
        if (data.currentVoiceId) onChange(data.currentVoiceId)
        setHasAppliedServerValue(true)
      }
    } catch (error) {
      console.error('Failed to load voices:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVoices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistantId])

  const handleSelectChange = (selected: string) => {
    onChange(selected === STOCK_VOICE_VALUE ? null : selected)
  }

  const handleUploadClick = () => {
    if (!user.customVoiceEnabled) {
      setAddonModalOpen(true)
      return
    }
    setUploadOpen(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="font-medium">Voice</label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleUploadClick}
          className="text-xs h-7"
        >
          {user.customVoiceEnabled ? (
            <>
              <Plus className="h-3 w-3 mr-1" />
              New cloned voice
            </>
          ) : (
            <>
              <Lock className="h-3 w-3 mr-1" />
              Unlock custom voice
            </>
          )}
        </Button>
      </div>

      <Select
        value={value ?? STOCK_VOICE_VALUE}
        onValueChange={handleSelectChange}
        disabled={loading}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a voice" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={STOCK_VOICE_VALUE}>
            <span className="flex items-center gap-2">
              <Mic className="h-3.5 w-3.5" />
              Stock voice (default)
            </span>
          </SelectItem>
          {voices.map((voice) => (
            <SelectItem
              key={voice.id}
              value={voice.id}
            >
              {voice.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!user.customVoiceEnabled && (
        <p className="text-xs text-muted-foreground mt-2">
          Custom cloned voices are a paid add-on, billed separately from your
          plan.
        </p>
      )}

      <VoiceUploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onCreated={(voice) => {
          setVoices((prev) => [{ id: voice.id, name: voice.name }, ...prev])
          onChange(voice.id)
        }}
        onSubscriptionRequired={() => setAddonModalOpen(true)}
      />

      {/* Explicitly no trigger - this instance is opened programmatically
          via addonModalOpen, from either the lock button above or from
          VoiceUploadModal hitting the SUBSCRIPTION_REQUIRED case. */}
      <CustomVoiceAddonModal
        user={user}
        trigger={null}
        open={addonModalOpen}
        onOpenChange={setAddonModalOpen}
        onSuccess={() => {
          setAddonModalOpen(false)
          fetchVoices()
        }}
      />
    </div>
  )
}

export default VoicePicker