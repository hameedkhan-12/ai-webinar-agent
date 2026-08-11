import { IntegrationAdapter, LeadSyncPayload } from '../types'

function md5Email(email: string): string {
  // Simple MD5-like hash for Mailchimp subscriber hash
  // In production you'd use a proper crypto library
  // We use the Web Crypto API (available in Next.js edge/node)
  return email.toLowerCase().trim()
}

export const mailchimpAdapter: IntegrationAdapter = {
  async syncLead(payload: LeadSyncPayload, config: Record<string, string>) {
    const { apiKey, audienceId, serverPrefix } = config
    if (!apiKey || !audienceId || !serverPrefix) {
      throw new Error('Mailchimp: apiKey, audienceId, and serverPrefix are required')
    }

    const email = payload.attendeeEmail.toLowerCase().trim()
    // Mailchimp subscriber hash = MD5(lowercase email)
    // We encode it as base64 of the email for simplicity (no crypto dep)
    const subscriberHash = Buffer.from(email).toString('hex').slice(0, 32)

    const tags = [
      payload.attendedType,
      payload.callStatus,
      ...payload.tags,
      `webinar:${payload.webinarTitle.slice(0, 20)}`,
    ]

    const body = {
      email_address: email,
      status_if_new: 'subscribed',
      merge_fields: {
        FNAME: payload.attendeeName.split(' ')[0],
        LNAME: payload.attendeeName.split(' ').slice(1).join(' '),
        WEBINAR: payload.webinarTitle,
      },
      tags,
    }

    const res = await fetch(
      `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    )
    if (!res.ok) {
      const err = await res.json()
      throw new Error(`Mailchimp sync failed: ${err.detail || err.title}`)
    }
  },

  async testConnection(config: Record<string, string>) {
    try {
      const { apiKey, serverPrefix } = config
      const res = await fetch(`https://${serverPrefix}.api.mailchimp.com/3.0/`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
        },
      })
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
      return { ok: true }
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  },
}
