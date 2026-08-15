'use server'

import { createCheckout } from '@/lib/whop'
import { prisma } from '@/lib/prismaClient'
import { changeAttendanceType } from './attendance'

// Platform's own pricing, in whole dollars. No pre-created dashboard
// "Price" objects needed - Whop creates the checkout plan inline from
// these amounts each time, unlike Stripe's model.
const PLATFORM_SUBSCRIPTION_PRICE_USD = 29
const CUSTOM_VOICE_ADDON_PRICE_USD = 15

// Platform's cut of every BUY_NOW sale a host makes through the webinar
// funnel, taken via Whop's application_fee_percent - the equivalent of
// Stripe Connect's application_fee_amount. Adjust to your actual pricing.
const MARKETPLACE_APPLICATION_FEE_PERCENT = 10

export const onGetPlatformSubscriptionCheckoutUrl = async (
  email: string,
  userId: string
) => {
  try {
    const { checkoutUrl } = await createCheckout({
      companyId: process.env.WHOP_COMPANY_ID!,
      price: PLATFORM_SUBSCRIPTION_PRICE_USD,
      planType: 'renewal',
      productTitle: 'Voxinar Platform Subscription',
      productDescription: 'Monthly access to host live webinars with AI agents.',
      productExternalId: 'voxinar-platform-subscription',
      metadata: {
        userId,
        email,
        kind: 'platform_subscription',
      },
    })

    return { status: 200, checkoutUrl }
  } catch (error) {
    console.error('Platform subscription checkout creation error:', error)
    return {
      status: 400,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to create subscription checkout',
    }
  }
}

export const onGetCustomVoiceAddonCheckoutUrl = async (
  email: string,
  userId: string
) => {
  try {
    const { checkoutUrl } = await createCheckout({
      companyId: process.env.WHOP_COMPANY_ID!,
      price: CUSTOM_VOICE_ADDON_PRICE_USD,
      planType: 'renewal',
      productTitle: 'Custom Voice Cloning Add-on',
      productDescription:
        'Lets your AI agents speak in a cloned human voice instead of the stock voice.',
      productExternalId: 'voxinar-custom-voice-addon',
      metadata: {
        userId,
        email,
        kind: 'custom_voice_addon',
      },
    })

    return { status: 200, checkoutUrl }
  } catch (error) {
    console.error('Custom voice add-on checkout creation error:', error)
    return {
      status: 400,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to create add-on checkout',
    }
  }
}

/**
 * Called from the webhook when a membership goes valid/invalid. Branches
 * on the `kind` we tagged the checkout with at creation time, since a
 * single webhook endpoint handles platform subscription, add-on, and
 * marketplace BUY_NOW events all together.
 */
export const handleMembershipStatusChange = async (
  metadata: Record<string, string>,
  isActive: boolean
) => {
  try {
    if (metadata.kind === 'platform_subscription' && metadata.userId) {
      await prisma.user.update({
        where: { id: metadata.userId },
        data: { subscription: isActive },
      })
      return
    }

    if (metadata.kind === 'custom_voice_addon' && metadata.userId) {
      await prisma.user.update({
        where: { id: metadata.userId },
        data: { customVoiceEnabled: isActive },
      })
      return
    }

    if (
      metadata.kind === 'buy_now' &&
      isActive &&
      metadata.attendeeId &&
      metadata.webinarId
    ) {
      await changeAttendanceType(
        metadata.attendeeId,
        metadata.webinarId,
        'CONVERTED'
      )
    }
  } catch (error) {
    console.error('Error handling membership status change:', error)
  }
}

/**
 * Saves the host's own Whop company ID, connecting their business as the
 * payout destination for their BUY_NOW sales. Unlike Stripe Connect's
 * OAuth redirect flow, Whop's "payments for platforms" model expects the
 * host to copy their company_id directly from their own Whop dashboard -
 * there's no confirmed OAuth-style connect flow for this at build time,
 * so this is the safe, docs-supported approach. If Whop does add a nicer
 * OAuth connect flow later, this is the one place to swap it in.
 */
export const saveWhopCompanyId = async (userId: string, companyId: string) => {
  const trimmed = companyId.trim()
  if (!trimmed) {
    return { success: false, status: 400, message: 'Company ID is required' }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { whopCompanyId: trimmed },
    })
    return { success: true, status: 200 }
  } catch (error) {
    console.error('Error saving Whop company ID:', error)
    return {
      success: false,
      status: 500,
      message: 'Failed to save Whop company ID',
    }
  }
}

/**
 * Creates a BUY_NOW checkout for an attendee purchasing a host's product.
 * Money goes to the host's own Whop company (whopCompanyId), with the
 * platform taking its application fee cut automatically - this is the
 * Whop equivalent of what Stripe Connect + application_fee_amount did.
 */
export const createCheckoutLink = async (
  price: number,
  hostWhopCompanyId: string,
  attendeeId: string,
  webinarId: string,
  bookCall: boolean = false
) => {
  try {
    const { checkoutUrl } = await createCheckout({
      companyId: hostWhopCompanyId,
      price,
      planType: 'one_time',
      applicationFeeAmount:
        Math.round(price * (MARKETPLACE_APPLICATION_FEE_PERCENT / 100) * 100) /
        100,
      metadata: {
        attendeeId,
        webinarId,
        kind: 'buy_now',
      },
    })

    if (bookCall) {
      await changeAttendanceType(attendeeId, webinarId, 'ADDED_TO_CART')
    }

    return {
      sessionUrl: checkoutUrl,
      status: 200,
      success: true,
    }
  } catch (error) {
    console.error('Error creating checkout link', error)
    return {
      error: 'Error creating checkout link',
      status: 500,
      success: false,
    }
  }
}