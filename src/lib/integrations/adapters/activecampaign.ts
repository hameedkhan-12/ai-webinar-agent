import { IntegrationAdapter, LeadSyncPayload } from '../types'

export const activecampaignAdapter: IntegrationAdapter = {
  async syncLead(payload: LeadSyncPayload, config: Record<string, string>) {
    const { apiKey, apiUrl, listId } = config
    if (!apiKey || !apiUrl) throw new Error('ActiveCampaign: apiKey and apiUrl are required')

    const base = apiUrl.replace(/\/$/, '')

    // Upsert contact
    const contactRes = await fetch(`${base}/api/3/contact/sync`, {
      method: 'POST',
      headers: { 'Api-Token': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact: {
          email: payload.attendeeEmail,
          firstName: payload.attendeeName.split(' ')[0],
          lastName: payload.attendeeName.split(' ').slice(1).join(' '),
          fieldValues: [
            { field: 'WEBINAR_TITLE', value: payload.webinarTitle },
            { field: 'FUNNEL_STAGE', value: payload.attendedType },
            { field: 'CALL_STATUS', value: payload.callStatus },
          ],
        },
      }),
    })
    if (!contactRes.ok) {
      const err = await contactRes.json()
      throw new Error(`ActiveCampaign sync failed: ${JSON.stringify(err)}`)
    }
    const { contact } = await contactRes.json()
    const contactId = contact.id

    // Add to list if listId provided
    if (listId && contactId) {
      await fetch(`${base}/api/3/contactLists`, {
        method: 'POST',
        headers: { 'Api-Token': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactList: { list: listId, contact: contactId, status: 1 } }),
      })
    }

    // Apply tags
    for (const tag of payload.tags) {
      await fetch(`${base}/api/3/contactTags`, {
        method: 'POST',
        headers: { 'Api-Token': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactTag: { contact: contactId, tag } }),
      })
    }
  },

  async testConnection(config: Record<string, string>) {
    try {
      const base = config.apiUrl?.replace(/\/$/, '')
      const res = await fetch(`${base}/api/3/contacts?limit=1`, {
        headers: { 'Api-Token': config.apiKey },
      })
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
      return { ok: true }
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  },
}
