'use client'
import React, { useState } from 'react'
import type { User } from '@/generated/prisma/client'
import {
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Dialog } from '@/components/ui/dialog'
import { Loader2, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { onGetPlatformSubscriptionCheckoutUrl } from '@/actions/whop'

type Props = {
  user: User
}

/**
 * With Whop's hosted checkout, we don't collect card details ourselves -
 * confirming just redirects to Whop's checkout page. The actual
 * `subscription` flag flips via the whop-webhook route once Whop
 * confirms payment (membership.went_valid), not synchronously here.
 */
const SubscriptionModal = ({ user }: Props) => {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const result = await onGetPlatformSubscriptionCheckoutUrl(
        user.email,
        user.id
      )

      if (!result?.checkoutUrl) {
        throw new Error(result?.message || 'Failed to start checkout')
      }

      window.location.href = result.checkoutUrl
    } catch (error) {
      console.error('SUBSCRIPTION-->', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to start checkout'
      )
      setLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="rounded-xl flex gap-2 items-center hover:cursor-pointer px-4 py-2 border border-border bg-primary/10 backdrop-blur-sm text-sm font-normal text-primary hover:bg-primary-20">
          <PlusIcon />
          Create Webinar
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Spotlight Subscription</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            You&apos;ll be redirected to Whop to complete your subscription.
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

export default SubscriptionModal