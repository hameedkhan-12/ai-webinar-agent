'use server'

import { WebinarFormState } from '@/store/useWebinarStore'
import { onAuthenticateUser } from './auth'
import { prisma } from '@/lib/prismaClient'
import { invalidateDashboardMetrics } from '@/lib/redis/dashboardMetricsCache'
import { revalidatePath } from 'next/cache'
import { WebinarStatusEnum } from '@/generated/prisma/enums'

function combineDateTime(
  dateInput: Date | string,
  timeStr: string,
  timeFormat: 'AM' | 'PM'
): Date {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput

  const [hoursStr, minutesStr] = timeStr.split(':')
  let hours = Number.parseInt(hoursStr || '0', 10)
  const minutes = Number.parseInt(minutesStr || '0', 10)

  // Convert to 24-hour format
  if (timeFormat === 'PM' && hours < 12) {
    hours += 12
  } else if (timeFormat === 'AM' && hours === 12) {
    hours = 0
  }

  // date.getTime() represents client local midnight (or start of day).
  // Adding (hours * 3600 + minutes * 60) * 1000 computes the exact timestamp
  // for the user's selected time on their chosen date.
  const timeOffsetMs = (hours * 3600 + minutes * 60) * 1000
  return new Date(date.getTime() + timeOffsetMs)
}

export const createWebinar = async (formData: WebinarFormState) => {
  try {
    const user = await onAuthenticateUser()
    if (!user.user) {
      return { status: 401, message: 'Unauthorized' }
    }

    if (!user.user.subscription) {
      return { status: 402, message: 'Subscription required' }
    }
    const presenterId = user.user.id

    if (!formData.basicInfo.webinarName) {
      return { status: 404, message: 'Webinar name is required' }
    }

    if (!formData.basicInfo.date) {
      return { status: 404, message: 'Webinar date is required' }
    }

    if (!formData.basicInfo.time) {
      return { status: 404, message: 'Webinar time is required' }
    }

    const combinedDateTime = combineDateTime(
      formData.basicInfo.date,
      formData.basicInfo.time,
      formData.basicInfo.timeFormat || 'AM'
    )

    // Allow 15 minutes grace period for clock skew / creation delay
    const gracePeriodMs = 15 * 60 * 1000
    if (combinedDateTime.getTime() < Date.now() - gracePeriodMs) {
      return {
        status: 400,
        message: 'Webinar date and time cannot be in the past',
      }
    }

    const webinar = await prisma.webinar.create({
      data: {
        title: formData.basicInfo.webinarName,
        description: formData.basicInfo.description || '',
        startTime: combinedDateTime,
        tags: formData.cta.tags || [],
        ctaLabel: formData.cta.ctaLabel,
        ctaType: formData.cta.ctaType,
        aiAgentId: formData.cta.aiAgent || null,
        price: formData.cta.price ?? null,
        lockChat: formData.additionalInfo.lockChat || false,
        couponCode: formData.additionalInfo.couponEnabled
          ? formData.additionalInfo.couponCode
          : null,
        couponEnabled: formData.additionalInfo.couponEnabled || false,
        presenterId: presenterId,
      },
    })
    await invalidateDashboardMetrics(presenterId)
    revalidatePath('/')
    return {
      status: 200,
      message: 'Webinar created successfully',
      webinarId: webinar.id,
      webinarLink: `/webinar/${webinar.id}`,
    }
  } catch (error) {
    console.error('Error creating webinar:', error)
    return {
      status: 500,
      message: 'Failed to create webinar. Please try again.',
    }
  }
}
//TODO: update frontend to pass webinarStatus
export const getWebinarByPresenterId = async (
  presenterId: string,
  webinarStatus?: string
) => {
  try {
    let statusFilter: WebinarStatusEnum | undefined

    switch (webinarStatus) {
      case 'upcoming':
        statusFilter = WebinarStatusEnum.SCHEDULED
        break
      case 'ended':
        statusFilter = WebinarStatusEnum.ENDED
        break
      default:
        statusFilter = undefined
    }

    const webinars = await prisma.webinar.findMany({
      where: { presenterId, webinarStatus: statusFilter },
      include: {
        presenter: {
          select: {
            name: true,
            whopCompanyId: true,
            id: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return webinars
  } catch (error) {
    console.error('Error getting webinars:', error)
    return []
  }
}

export const getWebinarById = async (webinarId: string) => {
  try {
    const webinar = await prisma.webinar.findUnique({
      where: { id: webinarId },
      include: {
        presenter: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            whopCompanyId: true,
          },
        },
      },
    })

    return webinar
  } catch (error) {
    console.error('Error fetching webinar:', error)
    throw new Error('Failed to fetch webinar')
  }
}

export const changeWebinarStatus = async (
  webinarId: string,
  status: WebinarStatusEnum
) => {
  try {
    const webinar = await prisma.webinar.update({
      where: {
        id: webinarId,
      },
      data: {
        webinarStatus: status,
      },
    })

    return {
      status: 200,
      success: true,
      message: 'Webinar status updated successfully',
      data: webinar,
    }
  } catch (error) {
    console.error('Error updating webinar status:', error)
    return {
      status: 500,
      success: false,
      message: 'Failed to update webinar status. Please try again.',
    }
  }
}