import Link from 'next/link'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type Props = {
  searchParams: Promise<{ status?: string }>
}

const CheckoutCompletePage = async ({ searchParams }: Props) => {
  const { status } = await searchParams
  const success = status === 'success'

  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <Card className="max-w-md w-full items-center text-center px-8">
        {success ? (
          <>
            <CheckCircle2 className="size-12 text-emerald-500" />
            <h1 className="text-xl font-semibold mt-2">You're all set</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your payment went through and your plan is now active. It may
              take a few seconds to reflect everywhere.
            </p>
          </>
        ) : (
          <>
            <XCircle className="size-12 text-destructive" />
            <h1 className="text-xl font-semibold mt-2">
              Checkout wasn't completed
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              The payment failed or was canceled. No charge was made - you
              can try again anytime.
            </p>
          </>
        )}

        <Button asChild className="mt-6">
          <Link href="/home">Back to dashboard</Link>
        </Button>
      </Card>
    </div>
  )
}

export default CheckoutCompletePage