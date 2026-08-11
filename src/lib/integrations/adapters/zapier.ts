import { IntegrationAdapter, LeadSyncPayload } from '../types'

export const zapierAdapter: IntegrationAdapter = {
  async syncLead(payload: LeadSyncPayload, config: Record<string, string>) {
    const { webhookUrl, secret } = config
    if (!webhookUrl) throw new Error('Zapier: webhookUrl is required')

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (secret) headers['X-Webhook-Secret'] = secret

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        event: 'webinar_lead_sync',
        attendeeId: payload.attendeeId,
        attendeeEmail: payload.attendeeEmail,
        attendeeName: payload.attendeeName,
        webinarId: payload.webinarId,
        webinarTitle: payload.webinarTitle,
        funnelStage: payload.attendedType,
        callStatus: payload.callStatus,
        tags: payload.tags,
        syncedAt: payload.syncedAt.toISOString(),
      }),
    })

    if (!res.ok) throw new Error(`Zapier webhook returned HTTP ${res.status}`)
  },

  async testConnection(config: Record<string, string>) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (config.secret) headers['X-Webhook-Secret'] = config.secret

      const res = await fetch(config.webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ event: 'test_connection', timestamp: new Date().toISOString() }),
      })
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
      return { ok: true }
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  },
}
