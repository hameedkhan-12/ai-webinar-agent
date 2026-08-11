import { onAuthenticateUser } from '@/actions/auth'
import { getUserIntegrations } from '@/actions/integrations'
import { INTEGRATIONS } from '@/lib/integrations/registry'
import { IntegrationsClient } from './_components/IntegrationsClient'
import { redirect } from 'next/navigation'
import { Plug2, Sparkles } from 'lucide-react'

export const metadata = {
  title: 'Integrations | AI Webinar Platform',
  description:
    'Connect your webinar platform with CRMs, email marketing tools, automation platforms, and more.',
}

export default async function IntegrationsPage() {
  const auth = await onAuthenticateUser()
  if (!auth.user) redirect('/sign-in')

  const { data: rows } = await getUserIntegrations(auth.user.id)

  // Build a quick lookup: integrationId → { config, enabled }
  const connectedMap = Object.fromEntries(
    (rows || []).map((r: { integrationId: string; config: unknown; enabled: boolean }) => [
      r.integrationId,
      { config: r.config as Record<string, string>, enabled: r.enabled },
    ]),
  )

  const connectedCount = (rows || []).filter((r: { enabled: boolean }) => r.enabled).length

  return (
    <div className="min-h-screen">
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Plug2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Integrations</h1>
            <p className="text-sm text-muted-foreground">
              {connectedCount > 0
                ? `${connectedCount} integration${connectedCount > 1 ? 's' : ''} active`
                : 'Connect your favorite tools to automate your webinar workflow'}
            </p>
          </div>
        </div>

        {/* How it works banner */}
        <div className="mt-6 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-purple-500/10 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-blue-400">
            <Sparkles className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold text-sm">How it works</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Every time an attendee registers, joins, clicks your CTA, or completes an AI sales call,
            their data is automatically synced to all your connected platforms — no manual exports needed.
          </p>
        </div>
      </div>

      {/* ── Client Component (search, filter, grid, modals) ─────────────────── */}
      <IntegrationsClient
        integrations={INTEGRATIONS}
        connectedMap={connectedMap}
        userId={auth.user.id}
      />
    </div>
  )
}
