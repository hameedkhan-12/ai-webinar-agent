import { prisma } from '@/lib/prismaClient'
import { resend, FOLLOW_UP_FROM_ADDRESS } from '@/lib/email/resendClient'

export type FollowUpEmailResult =
  | { sent: true }
  | { sent: false; reason: 'no_email' | 'no_objections_context' | 'send_failed'; detail?: string }

/**
 * Builds and sends a personalized post-call follow-up email for a single
 * attendance, referencing the specific objections the prospect raised on
 * the call and the webinar's CTA.
 *
 * Called from the call-processing pipeline (see callProcessingWorker.ts)
 * once objection classification has completed for the transcript.
 */
export async function sendPersonalizedFollowUpEmail(
  attendanceId: string,
  _transcriptId: string
): Promise<FollowUpEmailResult> {
  const attendance = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    include: {
      user: { select: { email: true, name: true } },
      webinar: { select: { title: true, ctaLabel: true, ctaUrl: true, ctaType: true } },
      objectionInstances: {
        include: { objection: { select: { label: true, description: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  })

  if (!attendance) {
    return { sent: false, reason: 'send_failed', detail: `Attendance ${attendanceId} not found` }
  }

  const { email, name } = attendance.user
  if (!email) {
    return { sent: false, reason: 'no_email' }
  }

  const objectionsRaised = attendance.objectionInstances.map((inst) => ({
    label: inst.objection.label,
    description: inst.objection.description,
    aiResponse: inst.aiResponse,
  }))

  const { subject, bodyHtml, bodyText } = await composeFollowUpEmail({
    attendeeName: name,
    webinarTitle: attendance.webinar.title,
    ctaLabel: attendance.webinar.ctaLabel,
    ctaUrl: attendance.webinar.ctaUrl,
    objectionsRaised,
  })

  try {
    const { error } = await resend.emails.send({
      from: FOLLOW_UP_FROM_ADDRESS,
      to: email,
      subject,
      html: bodyHtml,
      text: bodyText,
    })

    if (error) {
      return { sent: false, reason: 'send_failed', detail: error.message }
    }

    return { sent: true }
  } catch (err) {
    return {
      sent: false,
      reason: 'send_failed',
      detail: err instanceof Error ? err.message : String(err),
    }
  }
}

type ComposeInput = {
  attendeeName: string
  webinarTitle: string
  ctaLabel: string | null
  ctaUrl: string | null
  objectionsRaised: Array<{ label: string; description: string; aiResponse: string }>
}

type ComposedEmail = { subject: string; bodyHtml: string; bodyText: string }

/**
 * Uses the same Anthropic/OpenAI fallback pattern as analyzeObjectionsWithAI()
 * in src/actions/objections.ts. Falls back to a solid template if no AI key
 * is configured, so the pipeline still ships an email either way.
 */
async function composeFollowUpEmail(input: ComposeInput): Promise<ComposedEmail> {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY
  const openaiApiKey = process.env.OPENAI_API_KEY

  if (!anthropicApiKey && !openaiApiKey) {
    return templateFollowUpEmail(input)
  }

  const objectionsStr =
    input.objectionsRaised.length > 0
      ? input.objectionsRaised
          .map((o) => `- ${o.label}: ${o.description}\n  How the agent responded: ${o.aiResponse}`)
          .join('\n')
      : 'No specific objections were flagged on this call.'

  const prompt = `Write a short, warm, non-salesy follow-up email to a prospect named ${input.attendeeName || 'there'} who just attended a sales webinar/call about "${input.webinarTitle}".

During the call, they raised these objections (address the top 1-2 briefly and helpfully, don't be pushy):
${objectionsStr}

${input.ctaUrl ? `Include exactly one clear call-to-action: "${input.ctaLabel || 'Learn more'}" linking to ${input.ctaUrl}.` : 'Do not fabricate a call-to-action link.'}

Return ONLY valid, raw JSON matching this schema:
{
  "subject": "short email subject line, under 60 chars",
  "bodyText": "plain-text email body, 3-5 short paragraphs, no markdown"
}`

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
          max_tokens: 600,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      if (!res.ok) throw new Error(`Anthropic API returned status ${res.status}`)
      const data = await res.json()
      jsonText = data.content?.[0]?.text || ''
    } else if (openaiApiKey) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiApiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        }),
      })
      if (!res.ok) throw new Error(`OpenAI API returned status ${res.status}`)
      const data = await res.json()
      jsonText = data.choices?.[0]?.message?.content || ''
    }

    const cleaned = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim()
    const parsed = JSON.parse(cleaned) as { subject: string; bodyText: string }

    if (!parsed.subject || !parsed.bodyText) throw new Error('AI response missing required fields')

    return {
      subject: parsed.subject,
      bodyText: appendCta(parsed.bodyText, input),
      bodyHtml: toHtml(parsed.bodyText, input),
    }
  } catch (err) {
    console.error('[followUpEmail] AI composition failed, using template fallback:', err)
    return templateFollowUpEmail(input)
  }
}

/** Deterministic fallback used when no AI key is set, or the AI call fails. */
function templateFollowUpEmail(input: ComposeInput): ComposedEmail {
  const name = input.attendeeName || 'there'
  const topObjection = input.objectionsRaised[0]

  const objectionParagraph = topObjection
    ? `You mentioned during the call: "${topObjection.description}" — that's a completely fair question, and here's a quick recap of how we addressed it: ${topObjection.aiResponse}`
    : `Thanks again for taking the time to join and ask questions during the call.`

  const bodyText = [
    `Hi ${name},`,
    `Thanks for joining "${input.webinarTitle}" — it was great having you there.`,
    objectionParagraph,
    `If anything else comes to mind, just reply to this email and we'll get you an answer.`,
  ].join('\n\n')

  return {
    subject: `Following up on "${input.webinarTitle}"`,
    bodyText: appendCta(bodyText, input),
    bodyHtml: toHtml(bodyText, input),
  }
}

function appendCta(bodyText: string, input: ComposeInput): string {
  if (!input.ctaUrl) return bodyText
  return `${bodyText}\n\n${input.ctaLabel || 'Learn more'}: ${input.ctaUrl}`
}

function toHtml(bodyText: string, input: ComposeInput): string {
  const paragraphs = bodyText
    .split('\n\n')
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px 0;line-height:1.5;color:#111827;">${escapeHtml(p)}</p>`)
    .join('')

  const ctaButton = input.ctaUrl
    ? `<a href="${input.ctaUrl}" style="display:inline-block;margin-top:8px;padding:10px 20px;background:#2563EB;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">${escapeHtml(input.ctaLabel || 'Learn more')}</a>`
    : ''

  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;">${paragraphs}${ctaButton}</div>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
