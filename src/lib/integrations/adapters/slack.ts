import { IntegrationAdapter, LeadSyncPayload } from '../types'

const STAGE_EMOJI: Record<string, string> = {
  REGISTERED: '📋',
  ATTENDED: '👁️',
  ADDED_TO_CART: '🛒',
  FOLLOW_UP: '📞',
  BREAKOUT_ROOM: '🚪',
  CONVERTED: '🎉',
}

const CALL_EMOJI: Record<string, string> = {
  PENDING: '⏳',
  InProgress: '🔴',
  COMPLETED: '✅',
}

export const slackAdapter: IntegrationAdapter = {
  async syncLead(payload: LeadSyncPayload, config: Record<string, string>) {
    const { webhookUrl, channel } = config
    if (!webhookUrl) throw new Error('Slack: webhookUrl is required')

    const stageEmoji = STAGE_EMOJI[payload.attendedType] ?? '📌'
    const callEmoji = CALL_EMOJI[payload.callStatus] ?? '❓'

    const body: Record<string, unknown> = {
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: `${stageEmoji} New Webinar Lead`, emoji: true },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Name:*\n${payload.attendeeName}` },
            { type: 'mrkdwn', text: `*Email:*\n${payload.attendeeEmail}` },
            { type: 'mrkdwn', text: `*Webinar:*\n${payload.webinarTitle}` },
            { type: 'mrkdwn', text: `*Funnel Stage:*\n${stageEmoji} ${payload.attendedType}` },
            { type: 'mrkdwn', text: `*AI Call:*\n${callEmoji} ${payload.callStatus}` },
            {
              type: 'mrkdwn',
              text: `*Tags:*\n${payload.tags.length ? payload.tags.join(', ') : '—'}`,
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Synced at ${payload.syncedAt.toLocaleString()}`,
            },
          ],
        },
      ],
    }

    if (channel) body.channel = channel

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Slack webhook failed: ${text}`)
    }
  },

  async testConnection(config: Record<string, string>) {
    try {
      const body: Record<string, unknown> = {
        text: '✅ AI Webinar Platform connected successfully! You will receive lead notifications here.',
      }
      if (config.channel) body.channel = config.channel

      const res = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) return { ok: false, error: await res.text() }
      return { ok: true }
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  },
}
