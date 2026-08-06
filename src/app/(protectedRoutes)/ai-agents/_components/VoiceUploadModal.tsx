'use client'
import React, { useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { VoiceCreateForm } from '@/features/voices/components/voice-create-form'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (voice: { id: string; name: string }) => void
  onSubscriptionRequired: () => void
}

/**
 * Thin dialog wrapper around the shared VoiceCreateForm (same form used on
 * the dedicated /ai-agents/voices page) so the upload/record UX stays in
 * one place instead of being duplicated between the two surfaces.
 */
const VoiceUploadModal = ({
  open,
  onOpenChange,
  onCreated,
  onSubscriptionRequired,
}: Props) => {
  const handleError = useCallback(
    (message: string) => {
      if (message === 'SUBSCRIPTION_REQUIRED') {
        onOpenChange(false)
        onSubscriptionRequired()
      } else {
        toast.error(message)
      }
    },
    [onOpenChange, onSubscriptionRequired]
  )

  const handleCreated = useCallback(
    (voice: { id: string; name: string }) => {
      onCreated(voice)
      onOpenChange(false)
    },
    [onCreated, onOpenChange]
  )

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-110 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create custom voice</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Upload or record at least 10 seconds of clean, single-speaker
            audio. Used to clone this voice for your AI agents.
          </p>
        </DialogHeader>

        <VoiceCreateForm onError={handleError} onCreated={handleCreated} />
      </DialogContent>
    </Dialog>
  )
}

export default VoiceUploadModal