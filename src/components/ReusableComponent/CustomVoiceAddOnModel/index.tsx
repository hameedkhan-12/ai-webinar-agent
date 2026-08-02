'use client'
import React, { useState } from 'react'
import { User } from '@/generated/prisma/client'
import { CardElement, useElements } from '@stripe/react-stripe-js'
import { useStripe } from '@stripe/react-stripe-js'
import { useRouter } from 'next/navigation'
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
import { onGetCustomVoiceAddonClientSecret } from '@/actions/stripe'
import { activateCustomVoiceAddon } from '@/actions/subscription'

type Props = {
  user: User
  trigger?: React.ReactNode | null
  onSuccess?: () => void
  /** Optional controlled mode - if provided, this component's open state
   * is driven externally instead of its own internal state + trigger. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const CustomVoiceAddonModal = ({
  user,
  trigger,
  onSuccess,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: Props) => {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [internalOpen, setInternalOpen] = useState(false)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen

  const handleConfirm = async () => {
    try {
      setLoading(true)
      if (!stripe || !elements) {
        return toast.error('Stripe not initialized')
      }

      const intent = await onGetCustomVoiceAddonClientSecret(user.email, user.id)

      if (!intent?.secret) {
        throw new Error('Failed to initialize payment')
      }

      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        intent.secret,
        { payment_method: { card: cardElement } }
      )

      if (error) {
        throw new Error(error.message)
      }

      if (paymentIntent?.status === 'succeeded') {
        const activateResult = await activateCustomVoiceAddon()
        if (!activateResult.success) {
          throw new Error(
            activateResult.message || 'Failed to activate custom voice add-on'
          )
        }
      }

      toast.success('Custom voice cloning unlocked')
      setOpen(false)
      router.refresh()
      onSuccess?.()
    } catch (error) {
      console.error('CUSTOM_VOICE_ADDON -->', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to unlock custom voice'
      )
    } finally {
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
            stock voice. Billed separately from your base plan.
          </p>
        </DialogHeader>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#B4B0AE',
                '::placeholder': { color: '#B4B0AE' },
              },
            },
          }}
          className="border-[1px] outline-none rounded-lg p-3 w-full"
        />

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
                Loading...
              </>
            ) : (
              'Unlock Custom Voice'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CustomVoiceAddonModal