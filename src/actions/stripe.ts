'use server'

import { stripe } from '@/lib/stripe'
import { onAuthenticateUser } from './auth'
import Stripe from 'stripe'
import { prisma } from '@/lib/prismaClient'
import { subscriptionPriceId, customVoiceAddonPriceId } from '@/lib/data'
import { changeAttendanceType } from './attendance'

export const getAllProductsFromStripe = async () => {
  try {
    const currentUser = await onAuthenticateUser()
    if (!currentUser.user) {
      return {
        error: 'User not authenticated',
        status: 401,
        success: false,
      }
    }

    if (!currentUser.user.stripeConnectId) {
      return {
        error: 'User not connected to Stripe',
        status: 401,
        success: false,
      }
    }

    const products = await stripe.products.list(
      {},
      {
        stripeAccount: currentUser.user.stripeConnectId,
      }
    )

    return {
      products: products.data,
      status: 200,
      success: true,
    }
  } catch (error) {
    console.log('Error getting products from Stripe', error)
    return {
      error: 'Error getting products from Stripe',
      status: 500,
      success: false,
    }
  }
}

export const onGetStripeClientSecret = async (
  email: string,
  userId: string
) => {
  try {
    let customer: Stripe.Customer
    const existingCustomers = await stripe.customers.list({ email: email })
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
    } else {
      // Create a new customer if one doesn't exist
      customer = await stripe.customers.create({
        email: email,
        metadata: {
          userId: userId,
        },
      })
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeCustomerId: customer.id,
      },
    })

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: subscriptionPriceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: userId,
      },
    })

    const paymentIntent = (subscription.latest_invoice as Stripe.Invoice)
      .payment_intent as Stripe.PaymentIntent

    return {
      status: 200,
      secret: paymentIntent.client_secret,
      customerId: customer.id,
    }
  } catch (error) {
    console.error('Subscription creation error:', error)
    return { status: 400, message: 'Failed to create subscription' }
  }
}

export const onGetCustomVoiceAddonClientSecret = async (
  email: string,
  userId: string
) => {
  if (customVoiceAddonPriceId === 'price_REPLACE_WITH_REAL_ADDON_PRICE_ID') {
    return {
      status: 400,
      message:
        'customVoiceAddonPriceId in src/lib/data.ts is still a placeholder - create the real Price in your Stripe dashboard and paste its ID in.',
    }
  }

  try {
    let customer: Stripe.Customer
    const existingCustomers = await stripe.customers.list({ email: email })
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
    } else {
      customer = await stripe.customers.create({
        email: email,
        metadata: { userId: userId },
      })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    })

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: customVoiceAddonPriceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: userId,
        addon: 'custom_voice',
      },
    })

    const paymentIntent = (subscription.latest_invoice as Stripe.Invoice)
      .payment_intent as Stripe.PaymentIntent

    return {
      status: 200,
      secret: paymentIntent.client_secret,
      customerId: customer.id,
    }
  } catch (error) {
    console.error('Custom voice add-on subscription creation error:', error)
    return {
      status: 400,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to create add-on subscription',
    }
  }
}

export const updateSubscription = async (subscription: Stripe.Subscription) => {
  try {
    const userId = subscription.metadata.userId
    const isActive = subscription.status === 'active'

    if (subscription.metadata.addon === 'custom_voice') {
      await prisma.user.update({
        where: { id: userId },
        data: { customVoiceEnabled: isActive },
      })
      return
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscription: isActive,
      },
    })
  } catch (error) {
    console.error('Error updating subscription:', error)
  }
}

export const createCheckoutLink = async (
  priceId: string,
  stripeId: string,
  attendeeId: string,
  webinarId: string,
  bookCall: boolean = false
) => {
  try {
    const session = await stripe.checkout.sessions.create(
      {
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
        metadata: {
          attendeeId: attendeeId,
          webinarId: webinarId,
        },
      },
      {
        stripeAccount: stripeId,
      }
    )

    if (bookCall) {
      await changeAttendanceType(attendeeId, webinarId, 'ADDED_TO_CART')
    }

    return {
      sessionUrl: session.url,
      status: 200,
      success: true,
    }
  } catch (error) {
    console.log('Error creating checkout link', error)
    return {
      error: 'Error creating checkout link',
      status: 500,
      success: false,
    }
  }
}