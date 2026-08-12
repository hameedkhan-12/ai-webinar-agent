'use server'

import { AttendedTypeEnum } from '@/generated/prisma/enums'
import { prisma } from '@/lib/prismaClient'
import {
  getCachedObjectionInsights,
  invalidateObjectionInsights,
  objectionInsightsKey,
  presenterObjectionInsightsKey,
  setCachedObjectionInsights,
} from '@/lib/redis/objectionInsightsCache'
import {
  enforceObjectionClassificationRateLimit,
  RateLimitExceededError,
} from '@/lib/redis/rateLimit'
import { onAuthenticateUser } from './auth'

type ExtractedObjection = {
  label: string
  description: string
  transcriptExcerpt: string
  aiResponse: string
}

/**
 * Server Action: Classifies objections in a CallTranscript and links them
 * to the Attendance record and outcome (converted status).
 */
export async function classifyTranscript(transcriptId: string) {
  try {
    const callTranscript = await prisma.callTranscript.findUnique({
      where: { id: transcriptId },
      include: {
        attendance: {
          select: {
            id: true,
            webinarId: true,
            attendedType: true,
            webinar: {
              select: { presenterId: true },
            },
          },
        },
      },
    })

    if (!callTranscript || !callTranscript.transcript?.trim()) {
      return {
        success: false,
        status: 404,
        message: 'Call transcript not found or transcript text is empty',
      }
    }

    const { attendance } = callTranscript
    const { webinarId } = attendance
    const isConverted = attendance.attendedType === AttendedTypeEnum.CONVERTED

    // Load existing objections for this webinar to encourage label reuse
    const existingObjections = await prisma.objection.findMany({
      where: { webinarId },
      select: { label: true, description: true },
    })

    await enforceObjectionClassificationRateLimit(webinarId)

    // Call AI to extract structured objections from transcript
    const extractedItems = await analyzeObjectionsWithAI(
      callTranscript.transcript,
      existingObjections
    )

    if (extractedItems.length === 0) {
      return {
        success: true,
        status: 200,
        message: 'No objections detected in transcript',
        classifiedCount: 0,
      }
    }

    const createdInstances = []

    for (const item of extractedItems) {
      const normalizedLabel = (item.label || 'general_pushback')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9_]/g, '_')

      // Upsert Objection row per webinarId + label
      const objection = await prisma.objection.upsert({
        where: {
          webinarId_label: {
            webinarId,
            label: normalizedLabel,
          },
        },
        create: {
          webinarId,
          label: normalizedLabel,
          description: item.description || 'Customer raised hesitation during sales call',
        },
        update: {},
      })

      // Create ObjectionInstance row
      const instance = await prisma.objectionInstance.create({
        data: {
          objectionId: objection.id,
          attendanceId: attendance.id,
          transcriptExcerpt: item.transcriptExcerpt || '',
          aiResponse: item.aiResponse || '',
          converted: isConverted,
        },
      })

      createdInstances.push(instance)
    }

    await invalidateObjectionInsights(
      webinarId,
      attendance.webinar.presenterId
    )

    return {
      success: true,
      status: 200,
      message: `Successfully classified ${createdInstances.length} objections`,
      classifiedCount: createdInstances.length,
    }
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return {
        success: false,
        status: 429,
        message: error.message,
      }
    }

    console.error('[classifyTranscript] Error:', error)
    return {
      success: false,
      status: 500,
      message: error instanceof Error ? error.message : 'Failed to classify transcript',
    }
  }
}

/**
 * Uses Anthropic API (or OpenAI fallback) to parse call transcript into structured objections.
 */
async function analyzeObjectionsWithAI(
  transcriptText: string,
  existingObjections: Array<{ label: string; description: string }>
): Promise<ExtractedObjection[]> {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY
  const openaiApiKey = process.env.OPENAI_API_KEY

  const existingListStr =
    existingObjections.length > 0
      ? existingObjections
          .map((o) => `- "${o.label}": ${o.description}`)
          .join('\n')
      : 'None yet recorded.'

  const prompt = `You are a sales intelligence analyst. Analyze the following transcript of a voice sales call between a prospect and an AI sales assistant.

Extract all customer objections, doubts, budget concerns, timing stalls, or pushbacks raised by the prospect during the call.

Existing Objection Labels for this Webinar:
${existingListStr}

Instructions:
1. Re-use an existing label from the list above if the objection matches. Otherwise, create a concise, snake_case label (e.g. "price_too_high", "needs_partner_approval", "no_time_now", "doubts_guarantee").
2. Provide a clear, 1-sentence description of the objection.
3. Extract the exact transcript snippet (transcriptExcerpt) where the customer stated their objection.
4. Extract the AI agent's response (aiResponse) where the agent answered or handled the objection.

Return ONLY valid, raw JSON matching this schema:
{
  "objections": [
    {
      "label": "price_too_high",
      "description": "Prospect feels the program cost is too high or out of budget.",
      "transcriptExcerpt": "Quote of prospect",
      "aiResponse": "Quote of AI response"
    }
  ]
}

If no objections or pushbacks were raised by the prospect, return { "objections": [] }.

Transcript:
"""
${transcriptText}
"""`

  try {
    let jsonText = ''

    if (anthropicApiKey) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!res.ok) {
        throw new Error(`Anthropic API returned status ${res.status}`)
      }

      const data = await res.json()
      jsonText = data.content?.[0]?.text || ''
    } else if (openaiApiKey) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        }),
      })

      if (!res.ok) {
        throw new Error(`OpenAI API returned status ${res.status}`)
      }

      const data = await res.json()
      jsonText = data.choices?.[0]?.message?.content || ''
    } else {
      console.warn(
        '[objections] Neither ANTHROPIC_API_KEY nor OPENAI_API_KEY is set. Running rule-based fallback classification.'
      )
      return fallbackHeuristicExtraction(transcriptText)
    }

    // Clean JSON markdown blocks if present
    const cleanedJson = jsonText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/```$/, '')
      .trim()

    const parsed = JSON.parse(cleanedJson)
    if (Array.isArray(parsed.objections)) {
      return parsed.objections
    }
    return []
  } catch (err) {
    console.error('[analyzeObjectionsWithAI] Error parsing AI response:', err)
    return fallbackHeuristicExtraction(transcriptText)
  }
}

/**
 * Fallback parser in case AI API key is not configured or network call fails.
 */
function fallbackHeuristicExtraction(transcriptText: string): ExtractedObjection[] {
  const text = transcriptText.toLowerCase()
  const objections: ExtractedObjection[] = []

  if (text.includes('price') || text.includes('expensive') || text.includes('cost') || text.includes('afford')) {
    objections.push({
      label: 'price_too_high',
      description: 'Prospect raised concerns regarding pricing, cost, or affordability.',
      transcriptExcerpt: 'Prospect mentioned pricing or affordability concerns.',
      aiResponse: 'AI agent explained payment options and offered program value breakdown.',
    })
  }

  if (text.includes('think about it') || text.includes('time to consider') || text.includes('later')) {
    objections.push({
      label: 'needs_time_to_think',
      description: 'Prospect wants time to consider the offer before deciding.',
      transcriptExcerpt: 'Prospect expressed needing time to think about it.',
      aiResponse: 'AI agent asked what specific details needed clarification.',
    })
  }

  if (text.includes('partner') || text.includes('spouse') || text.includes('team') || text.includes('boss')) {
    objections.push({
      label: 'partner_approval_needed',
      description: 'Prospect needs to consult a decision maker before purchasing.',
      transcriptExcerpt: 'Prospect mentioned consulting partner or manager.',
      aiResponse: 'AI agent reviewed core benefits to share with decision maker.',
    })
  }

  return objections
}

export type ObjectionInsight = {
  id: string
  webinarId: string
  webinarTitle?: string
  label: string
  description: string
  timesRaised: number
  convertedCount: number
  conversionRateWhenRaised: number
  webinarPrice: number
  estimatedRevenueImpact: number
  bestResponse: string
  createdAt: string
}

async function computeObjectionInsights(
  userId: string,
  webinarId?: string
): Promise<ObjectionInsight[]> {
  const whereCondition = webinarId
    ? { webinarId }
    : { webinar: { presenterId: userId } }

  const objections = await prisma.objection.findMany({
    where: whereCondition,
    include: {
      webinar: {
        select: {
          id: true,
          title: true,
          price: true,
        },
      },
      instances: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          converted: true,
          aiResponse: true,
          transcriptExcerpt: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const insights: ObjectionInsight[] = objections.map((obj) => {
    const timesRaised = obj.instances.length
    const convertedInstances = obj.instances.filter((inst) => inst.converted)
    const convertedCount = convertedInstances.length
    const conversionRateWhenRaised =
      timesRaised > 0 ? Math.round((convertedCount / timesRaised) * 100) : 0

    const price = Number(obj.webinar?.price?.toString() || '0')
    const estimatedRevenueImpact = convertedCount * price

    const bestResponseInst =
      convertedInstances.find((i) => i.aiResponse && i.aiResponse.trim().length > 0) ||
      obj.instances.find((i) => i.aiResponse && i.aiResponse.trim().length > 0)

    const bestResponse = bestResponseInst?.aiResponse || 'No specific agent response recorded yet.'

    return {
      id: obj.id,
      webinarId: obj.webinarId,
      webinarTitle: obj.webinar?.title,
      label: obj.label,
      description: obj.description,
      timesRaised,
      convertedCount,
      conversionRateWhenRaised,
      webinarPrice: price,
      estimatedRevenueImpact,
      bestResponse,
      createdAt: obj.createdAt.toISOString(),
    }
  })

  insights.sort((a, b) => {
    if (b.estimatedRevenueImpact !== a.estimatedRevenueImpact) {
      return b.estimatedRevenueImpact - a.estimatedRevenueImpact
    }
    return b.timesRaised - a.timesRaised
  })

  return insights
}

/**
 * Server Action: Calculates objection performance, conversion rate when raised,
 * estimated revenue impact (converted count * webinar price), and best response.
 */
export async function getObjectionInsights(webinarId?: string) {
  try {
    const checkUser = await onAuthenticateUser()
    if (!checkUser?.user) {
      return { success: false, status: 401, message: 'Unauthorized', data: [] }
    }

    const cacheKey = webinarId
      ? objectionInsightsKey(webinarId)
      : presenterObjectionInsightsKey(checkUser.user.id)

    const cached = await getCachedObjectionInsights<ObjectionInsight[]>(cacheKey)

    if (cached) {
      return {
        success: true,
        status: 200,
        data: cached,
      }
    }

    const insights = await computeObjectionInsights(checkUser.user.id, webinarId)
    await setCachedObjectionInsights(cacheKey, insights)

    return {
      success: true,
      status: 200,
      data: insights,
    }
  } catch (error) {
    console.error('[getObjectionInsights] Error:', error)
    return {
      success: false,
      status: 500,
      message: 'Failed to fetch objection insights',
      data: [],
    }
  }
}
