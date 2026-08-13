'use client'

import { useState, useTransition } from 'react'
import { IntegrationMeta } from '@/lib/integrations/types'
import { INTEGRATION_CATEGORIES } from '@/lib/integrations/registry'
import { IntegrationCard } from './IntegrationCard'
import { IntegrationConfigModal } from './IntegrationConfigModal'
import { StatCard } from './StatCard'
import { toggleIntegration } from '@/actions/integrations'
import { Search, Plug2, Link2, Layers3 } from 'lucide-react'
import { toast } from 'sonner'

type ConnectedMap = Record<string, { config: Record<string, string>; enabled: boolean }>

type Props = {
  integrations: IntegrationMeta[]
  connectedMap: ConnectedMap
  userId: string
}

export function IntegrationsClient({ integrations, connectedMap, userId }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [openModal, setOpenModal] = useState<IntegrationMeta | null>(null)
  const [connected, setConnected] = useState<ConnectedMap>(connectedMap)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [, startToggle] = useTransition()

  const filtered = integrations.filter((i) => {
    const matchesCategory = activeCategory === 'ALL' || i.category === activeCategory
    const matchesSearch =
      !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const connectedCount = Object.keys(connected).length
  const enabledCount = Object.values(connected).filter((c) => c.enabled).length
  const categories: string[] = ['ALL', ...INTEGRATION_CATEGORIES]

  const categoryLabel: Record<string, string> = {
    ALL: 'All',
    CRM: 'CRM',
    EMAIL: 'Email',
    AUTOMATION: 'Automation',
    NOTIFICATIONS: 'Notifications',
    SPREADSHEETS: 'Spreadsheets',
  }

  const categoryCount = (cat: string) =>
    cat === 'ALL'
      ? integrations.length
      : integrations.filter((i) => i.category === cat).length

  const handleToggle = (integrationId: string, enabled: boolean) => {
    setTogglingId(integrationId)
    startToggle(async () => {
      const { error } = await toggleIntegration(userId, integrationId, enabled)
      setTogglingId(null)

      if (error) {
        toast.error(error)
        return
      }

      setConnected((prev) => ({
        ...prev,
        [integrationId]: {
          ...prev[integrationId],
          enabled,
        },
      }))
    })
  }

  return (
    <div className="space-y-8">
      {/* Hero stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Available Integrations"
          value={integrations.length}
          icon={Plug2}
          iconClassName="text-blue-500"
          iconBgClassName="bg-blue-500/10 border-blue-500/20"
        />
        <StatCard
          label="Connected"
          value={connectedCount}
          icon={Link2}
          iconClassName="text-emerald-500"
          iconBgClassName="bg-emerald-500/10 border-emerald-500/20"
        />
        <StatCard
          label="Active Syncs"
          value={enabledCount}
          icon={Layers3}
          iconClassName="text-violet-500"
          iconBgClassName="bg-violet-500/10 border-violet-500/20"
        />
      </div>

      {/* Search + filter */}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search integrations…"
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                activeCategory === cat
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground'
              }`}
            >
              {categoryLabel[cat] ?? cat}
              <span className="ml-1.5 opacity-60">({categoryCount(cat)})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Integration grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <Plug2 className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">No integrations found for &ldquo;{search}&rdquo;</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              isConnected={!!connected[integration.id]}
              isEnabled={connected[integration.id]?.enabled ?? false}
              isToggling={togglingId === integration.id}
              onConfigure={() => setOpenModal(integration)}
              onToggle={(enabled) => handleToggle(integration.id, enabled)}
            />
          ))}
        </div>
      )}

      {openModal && (
        <IntegrationConfigModal
          integration={openModal}
          userId={userId}
          existingConfig={connected[openModal.id]?.config ?? null}
          isEnabled={connected[openModal.id]?.enabled ?? false}
          onClose={() => setOpenModal(null)}
          onSaved={() => {
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
