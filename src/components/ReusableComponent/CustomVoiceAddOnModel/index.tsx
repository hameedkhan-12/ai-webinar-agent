'use client'
import React, { useState } from 'react'
import type { User } from '@/generated/prisma/client'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Loader2, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { onGetCustomVoiceAddonCheckoutUrl } from '@/actions/whop'

type Props = {
  user: User
  trigger?: React.ReactNode | null
  onSuccess?: () => void
  /** Optional controlled mode - if provided, this component's open state
   * is driven externally instead of its own internal state + trigger. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * With Whop's hosted checkout, confirming just redirects to Whop's
 * checkout page - no card collection happens in this app at all.
 * customVoiceEnabled flips via the whop-webhook route once Whop confirms
 * payment, not synchronously here, so onSuccess is really just used to
 * close/refresh the picker UI on return, not a guarantee entitlement is
 * live yet (there can be a brief lag until the webhook lands).
 */
const CustomVoiceAddonModal = ({
  user,
  trigger,
  onSuccess,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: Props) => {
  const [loading, setLoading] = useState(false)
  const [internalOpen, setInternalOpen] = useState(false)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const result = await onGetCustomVoiceAddonCheckoutUrl(
        user.email,
        user.id
      )

      if (!result?.checkoutUrl) {
        throw new Error(result?.message || 'Failed to start checkout')
      }

      onSuccess?.()
      window.location.href = result.checkoutUrl
    } catch (error) {
      console.error('CUSTOM_VOICE_ADDON -->', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to start checkout'
      )
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger ?? (
            <button className="rounded-xl flex gap-2 items-center hover:cursor-pointer px-4 py-2 border border-border bg-primary/10 backdrop-blur-sm text-sm font-normal text-primary hover:bg-primary-20">
              <Mic className="h-4 w-4" />
              Unlock Custom Voice
            </button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Custom Voice Cloning Add-on</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Let your AI agents speak in a cloned human voice instead of the
            stock voice. Billed separately from your base plan. You&apos;ll be
            redirected to Whop to complete checkout.
          </p>
        </DialogHeader>

        <DialogFooter className="gap-4 items-center">
          <DialogClose
            className="w-full sm:w-auto border border-border rounded-md px-3 py-2"
            disabled={loading}
          >
            Cancel
          </DialogClose>
          <Button
            type="submit"
            className="w-full sm:w-auto"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Redirecting...
              </>
            ) : (
              'Continue to Checkout'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CustomVoiceAddonModal