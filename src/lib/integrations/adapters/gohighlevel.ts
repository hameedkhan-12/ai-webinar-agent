import { IntegrationAdapter, LeadSyncPayload } from '../types'

export const gohighlevelAdapter: IntegrationAdapter = {
  async syncLead(payload: LeadSyncPayload, config: Record<string, string>) {
    const { apiKey, locationId } = config
    if (!apiKey || !locationId) throw new Error('GoHighLevel: apiKey and locationId are required')

    const nameParts = payload.attendeeName.split(' ')
    const body = {
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' ') || '',
      email: payload.attendeeEmail,
      locationId,
      tags: [payload.attendedType, payload.callStatus, ...payload.tags],
      customFields: [
        { key: 'webinar_title', field_value: payload.webinarTitle },
        { key: 'webinar_funnel_stage', field_value: payload.attendedType },
        { key: 'ai_call_status', field_value: payload.callStatus },
      ],
      source: 'AI Webinar Platform',
    }

    const res = await fetch('https://rest.gohighlevel.com/v1/contacts/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(`GoHighLevel sync failed: ${err.message || JSON.stringify(err)}`)
    }
  },

  async testConnection(config: Record<string, string>) {
    try {
      const res = await fetch(
        `https://rest.gohighlevel.com/v1/contacts/?locationId=${config.locationId}&limit=1`,
        { headers: { Authorization: `Bearer ${config.apiKey}` } },
      )
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
      return { ok: true }
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  },
}
