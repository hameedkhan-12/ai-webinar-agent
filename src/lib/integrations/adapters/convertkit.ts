import { IntegrationAdapter, LeadSyncPayload } from '../types'

export const convertkitAdapter: IntegrationAdapter = {
  async syncLead(payload: LeadSyncPayload, config: Record<string, string>) {
    const { apiKey, formId } = config
    if (!apiKey) throw new Error('ConvertKit: apiKey is required')

    const nameParts = payload.attendeeName.split(' ')
    const body = {
      api_key: apiKey,
      email: payload.attendeeEmail,
      first_name: nameParts[0],
      tags: [payload.webinarTitle, payload.attendedType, payload.callStatus, ...payload.tags],
      fields: {
        webinar_title: payload.webinarTitle,
        funnel_stage: payload.attendedType,
        call_status: payload.callStatus,
      },
    }

    const endpoint = formId
      ? `https://api.convertkit.com/v3/forms/${formId}/subscribe`
      : `https://api.convertkit.com/v3/subscribers`

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(`ConvertKit sync failed: ${err.message || JSON.stringify(err)}`)
    }
  },

  async testConnection(config: Record<string, string>) {
    try {
      const res = await fetch(
        `https://api.convertkit.com/v3/account?api_key=${config.apiKey}`,
      )
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
      return { ok: true }
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  },
}
