'use client'

import { useState } from 'react'
import { IntegrationMeta } from '@/lib/integrations/types'
import { INTEGRATION_CATEGORIES } from '@/lib/integrations/registry'
import { IntegrationCard } from './IntegrationCard'
import { IntegrationConfigModal } from './IntegrationConfigModal'
import { Search, Plug2 } from 'lucide-react'

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

  return (
    <div className="space-y-8">
      {/* ── Hero Stats ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Available Integrations"
          value={integrations.length}
          icon="🔌"
          gradient="from-blue-500/20 to-indigo-500/20"
          border="border-blue-500/20"
        />
        <StatCard
          label="Connected"
          value={connectedCount}
          icon="✅"
          gradient="from-emerald-500/20 to-teal-500/20"
          border="border-emerald-500/20"
        />
        <StatCard
          label="Categories"
          value={INTEGRATION_CATEGORIES.length}
          icon="📂"
          gradient="from-purple-500/20 to-pink-500/20"
          border="border-purple-500/20"
        />
      </div>

      {/* ── Search + Filter ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search integrations…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition border ${activeCategory === cat
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 bg-card/40'
                }`}
            >
              {categoryLabel[cat] ?? cat}
              <span className="ml-1.5 opacity-60">({categoryCount(cat)})</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Integration Grid ─────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <Plug2 className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">No integrations found for &ldquo;{search}&rdquo;</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              isConnected={!!connected[integration.id]}
              isEnabled={connected[integration.id]?.enabled ?? false}
              onConfigure={() => setOpenModal(integration)}
            />
          ))}
        </div>
      )}

      {/* ── Config Modal ─────────────────────────────────────────────────────── */}
      {openModal && (
        <IntegrationConfigModal
          integration={openModal}
          userId={userId}
          existingConfig={connected[openModal.id]?.config ?? null}
          isEnabled={connected[openModal.id]?.enabled ?? false}
          onClose={() => setOpenModal(null)}
          onSaved={() => {
            // Refresh by reloading (server component will re-fetch)
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  gradient,
  border,
}: {
  label: string
  value: number
  icon: string
  gradient: string
  border: string
}) {
  return (
    <div
      className={`rounded-2xl border ${border} bg-gradient-to-br ${gradient} backdrop-blur-xl p-5 flex items-center gap-4`}
    >
      <div className="text-3xl">{icon}</div>
      <div>
        <div className="text-2xl font-bold text-foreground tabular-nums">{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </div>
    </div>
  )
}
