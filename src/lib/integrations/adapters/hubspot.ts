import { IntegrationAdapter, LeadSyncPayload } from '../types'

export const hubspotAdapter: IntegrationAdapter = {
  async syncLead(payload: LeadSyncPayload, config: Record<string, string>) {
    const { accessToken } = config
    if (!accessToken) throw new Error('HubSpot: accessToken is required')

    const properties = {
      email: payload.attendeeEmail,
      firstname: payload.attendeeName.split(' ')[0] ?? payload.attendeeName,
      lastname: payload.attendeeName.split(' ').slice(1).join(' ') || '',
      webinar_attended: payload.webinarTitle,
      webinar_funnel_stage: payload.attendedType,
      ai_call_status: payload.callStatus,
      webinar_tags: payload.tags.join(', '),
    }

    const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties }),
    })

    // 409 = contact already exists — update instead
    if (res.status === 409) {
      const existing = await res.json()
      const contactId = existing.message?.match(/ID:\s*(\d+)/)?.[1]
      if (contactId) {
        const updateRes = await fetch(
          `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ properties }),
          },
        )
        if (!updateRes.ok) {
          const err = await updateRes.json()
          throw new Error(`HubSpot update failed: ${err.message}`)
        }
      }
      return
    }

    if (!res.ok) {
      const err = await res.json()
      throw new Error(`HubSpot sync failed: ${err.message}`)
    }
  },

  async testConnection(config: Record<string, string>) {
    try {
      const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
        headers: { Authorization: `Bearer ${config.accessToken}` },
      })
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` }
      return { ok: true }
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  },
}
