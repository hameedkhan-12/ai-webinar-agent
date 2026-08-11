import { IntegrationAdapter, LeadSyncPayload } from '../types'

export const googleSheetsAdapter: IntegrationAdapter = {
  async syncLead(payload: LeadSyncPayload, config: Record<string, string>) {
    const { webhookUrl, sheetName } = config
    if (!webhookUrl) throw new Error('Google Sheets: webhookUrl is required')

    const row = {
      name: payload.attendeeName,
      email: payload.attendeeEmail,
      webinar: payload.webinarTitle,
      funnelStage: payload.attendedType,
      callStatus: payload.callStatus,
      tags: payload.tags.join(', '),
      syncedAt: payload.syncedAt.toISOString(),
      sheetName: sheetName || 'Sheet1',
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(row),
    })

    if (!res.ok) {
      if (res.status === 403) {
        throw new Error(
          "HTTP 403: Permission denied. In Apps Script, click Deploy -> Manage deployments -> set 'Who has access' to 'Anyone'.",
        )
      }
      const text = await res.text()
      throw new Error(`Google Sheets webhook failed (HTTP ${res.status}): ${text}`)
    }
  },

  async testConnection(config: Record<string, string>) {
    try {
      if (!config.webhookUrl) return { ok: false, error: 'Webhook URL is required' }

      const res = await fetch(config.webhookUrl, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          name: 'Test Connection',
          email: 'test@example.com',
          webinar: 'Test Webinar',
          funnelStage: 'REGISTERED',
          callStatus: 'PENDING',
          tags: 'test',
          syncedAt: new Date().toISOString(),
          sheetName: config.sheetName || 'Sheet1',
          _test: true,
        }),
      })

      if (res.status === 403) {
        return {
          ok: false,
          error:
            "HTTP 403 Access Denied: In Apps Script, click Deploy -> Manage deployments -> Edit ✏️ -> set 'Who has access' to 'Anyone'.",
        }
      }

      if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` }
      return { ok: true }
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  },
}
