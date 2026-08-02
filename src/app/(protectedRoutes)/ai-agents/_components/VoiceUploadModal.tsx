'use client'
import React, { useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { VOICE_CATEGORIES, VOICE_CATEGORY_LABELS } from '@/lib/voiceCategories'
import type { VoiceCategory } from '@/generated/prisma/enums'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (voice: { id: string; name: string }) => void
  onSubscriptionRequired: () => void
}

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024 // matches the API's own limit

const VoiceUploadModal = ({
  open,
  onOpenChange,
  onCreated,
  onSubscriptionRequired,
}: Props) => {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<VoiceCategory>('GENERAL')
  const [language, setLanguage] = useState('en-US')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const resetForm = () => {
    setName('')
    setCategory('GENERAL')
    setLanguage('en-US')
    setFile(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (!selected.type.startsWith('audio/')) {
      toast.error('Please choose an audio file')
      return
    }
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      toast.error('File is too large (20 MB max)')
      return
    }
    setFile(selected)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error('Please choose an audio sample to upload')
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        name,
        category,
        language,
      })

      const response = await fetch(`/api/voices/create?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      const result = await response.json()

      if (response.status === 403 && result.error === 'SUBSCRIPTION_REQUIRED') {
        onOpenChange(false)
        onSubscriptionRequired()
        return
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create voice')
      }

      toast.success('Voice created successfully')
      onCreated({ id: result.id, name: result.name })
      resetForm()
      onOpenChange(false)
    } catch (error) {
      console.error('Error uploading voice:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload voice'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Upload a Voice Sample</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            At least 10 seconds of clean, single-speaker audio. Used to clone
            this voice for your AI agents.
          </p>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="voice-name">Voice Name</Label>
            <Input
              id="voice-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Sales Voice"
              required
            />
          </div>

          <div>
            <Label htmlFor="voice-category">Category</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as VoiceCategory)}
            >
              <SelectTrigger id="voice-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOICE_CATEGORIES.map((cat) => (
                  <SelectItem
                    key={cat}
                    value={cat}
                  >
                    {VOICE_CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="voice-language">Language</Label>
            <Input
              id="voice-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="en-US"
              required
            />
          </div>

          <div>
            <Label htmlFor="voice-file">Audio Sample</Label>
            <Input
              id="voice-file"
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              required
            />
            {file && (
              <p className="text-xs text-muted-foreground mt-1">
                {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
              </p>
            )}
          </div>

          <DialogFooter className="gap-4 items-center pt-2">
            <DialogClose
              type="button"
              className="w-full sm:w-auto border border-border rounded-md px-3 py-2"
              disabled={loading}
            >
              Cancel
            </DialogClose>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={loading || !file}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Voice
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default VoiceUploadModal