'use server'

import { onAuthenticateUser } from './auth'
import { prisma } from '@/lib/prismaClient'
import Stripe from 'stripe'

export const activateSubscription = async () => {
  const currentUser = await onAuthenticateUser()
  if (!currentUser.user) {
    return { status: 401, success: false, message: 'Unauthorized' }
  }

  try {
    await prisma.user.update({
      where: { id: currentUser.user.id },
      data: { subscription: true },
    })

    return { status: 200, success: true }
  } catch (error) {
    console.error('Failed to activate subscription:', error)
    return { status: 500, success: false, message: 'Failed to activate subscription' }
  }
}

export const activateCustomVoiceAddon = async () => {
  const currentUser = await onAuthenticateUser()
  if (!currentUser.user) {
    return { status: 401, success: false, message: 'Unauthorized' }
  }

  try {
    await prisma.user.update({
      where: { id: currentUser.user.id },
      data: { customVoiceEnabled: true },
    })

    return { status: 200, success: true }
  } catch (error) {
    console.error('Failed to activate custom voice add-on:', error)
    return {
      status: 500,
      success: false,
      message: 'Failed to activate custom voice add-on',
    }
  }
}