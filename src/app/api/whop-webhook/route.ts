import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhook } from '@/lib/whop'
import { handleMembershipStatusChange } from '@/actions/whop'

const ACTIVATE_EVENTS = new Set(['membership.activated', 'payment.succeeded'])
const DEACTIVATE_EVENTS = new Set(['membership.deactivated'])

export async function POST(req: NextRequest) {
  const body = await req.text()

  try {
    const event = await verifyWebhook(body, req.headers)
    const eventType =
      (event as unknown as { type?: string; action?: string }).type ??
      (event as unknown as { type?: string; action?: string }).action ??
      'unknown'
      
    console.log('[whop-webhook] full event:', JSON.stringify(event))

    const isActivateEvent = ACTIVATE_EVENTS.has(eventType)
    const isDeactivateEvent = DEACTIVATE_EVENTS.has(eventType)

    if (!isActivateEvent && !isDeactivateEvent) {
      console.log('👉🏻 Unhandled irrelevant Whop event:', eventType)
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const data = event.data as unknown
    const metadata = (
      typeof data === 'object' && data !== null && 'metadata' in data
        ? (data.metadata as Record<string, string> | undefined) ?? {}
        : {}
    ) as Record<string, string>

    // TEMP DEBUG: confirm metadata actually arrived and has what we expect.
    console.log('[whop-webhook] resolved metadata:', metadata)

    await handleMembershipStatusChange(metadata, isActivateEvent)

    console.log('WHOP EVENT 💳', eventType, metadata.kind)
    return NextResponse.json({ received: true }, { status: 200 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Whop webhook processing error:', error)
    return new NextResponse(`Webhook Error: ${error.message}`, {
      status: 500,
    })
  }
}