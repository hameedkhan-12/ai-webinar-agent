'use server'

import { prisma } from '@/lib/prismaClient'
import { currentUser } from '@clerk/nextjs/server'

export async function onAuthenticateUser() {
  try {
    const user = await currentUser()
    if (!user) {
      return { status: 403 }
    }

    const userExists = await prisma.user.findUnique({
      where: { clerkId: user.id },
    })

    if (userExists) {
      const updatedUser = await prisma.user.update({
        where: { clerkId: user.id },
        data: { lastLoginAt: new Date() },
      })
      return { status: 200, user: updatedUser }
    }

    const primaryEmail =
      user.emailAddresses.find(
        (email) => email.id === user.primaryEmailAddressId
      )?.emailAddress || user.emailAddresses[0]?.emailAddress

    if (!primaryEmail) {
      return { status: 400, message: 'No email address found for this user' }
    }

    try {
      const newUser = await prisma.user.create({
        data: {
          clerkId: user.id,
          email: primaryEmail,
          name: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Unnamed User',
          profileImage: user.imageUrl,
          lastLoginAt: new Date(),
        },
      })
      return { status: 201, user: newUser }
    } catch (createError: any) {
      if (createError.code === 'P2002') {
        const conflictField = createError.meta?.target?.[0]

        if (conflictField === 'email') {
          const reconciledUser = await prisma.user.update({
            where: { email: primaryEmail },
            data: { clerkId: user.id, lastLoginAt: new Date() },
          })
          return { status: 200, user: reconciledUser }
        }

        const existing = await prisma.user.findUnique({ where: { clerkId: user.id } })
        if (existing) {
          return { status: 200, user: existing }
        }
      }
      throw createError
    }
  } catch (error: any) {
    console.error('🔴 AUTHENTICATION ERROR:', error)
    return {
      status: 500,
      error: error?.message || 'Internal Server Error during user authentication',
    }
  }
}