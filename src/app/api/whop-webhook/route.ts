import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhook } from '@/lib/whop'
import { handleMembershipStatusChange } from '@/actions/whop'

const ACTIVATE_EVENTS = new Set(['membership_activated', 'invoice_paid'])
const DEACTIVATE_EVENTS = new Set(['membership_deactivated'])

export async function POST(req: NextRequest) {
  const body = await req.text()

  try {
    const event = await verifyWebhook(body, req.headers)

    const isActivateEvent = ACTIVATE_EVENTS.has(event.type)
    const isDeactivateEvent = DEACTIVATE_EVENTS.has(event.type)

    if (!isActivateEvent && !isDeactivateEvent) {
      console.log('👉🏻 Unhandled irrelevant Whop event:', event.type)
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const data = event.data as unknown
    const metadata = (
      typeof data === 'object' && data !== null && 'metadata' in data
        ? (data.metadata as Record<string, string> | undefined) ?? {}
        : {}
    ) as Record<string, string>

    await handleMembershipStatusChange(metadata, isActivateEvent)

    console.log('WHOP EVENT 💳', event.type, metadata.kind)
    return NextResponse.json({ received: true }, { status: 200 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Whop webhook processing error:', error)
    return new NextResponse(`Webhook Error: ${error.message}`, {
      status: 500,
    })
  }
}