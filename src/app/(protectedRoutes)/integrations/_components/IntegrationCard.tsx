'use client'

import { IntegrationMeta } from '@/lib/integrations/types'
import { IntegrationIcon } from './IntegrationIcon'
import { Switch } from '@/components/ui/switch'
import { ArrowLeftRight, ExternalLink } from 'lucide-react'

type Props = {
  integration: IntegrationMeta
  isConnected: boolean
  isEnabled: boolean
  onConfigure: () => void
  onToggle?: (enabled: boolean) => void
  isToggling?: boolean
}

export function IntegrationCard({
  integration,
  isConnected,
  isEnabled,
  onConfigure,
  onToggle,
  isToggling = false,
}: Props) {
  return (
    <div className="flex flex-col rounded-xl border border-border/80 bg-card overflow-hidden transition-shadow duration-200 hover:shadow-md hover:border-border">
      {/* Main content */}
      <div className="flex flex-1 flex-col p-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `${integration.color}14`,
              border: `1px solid ${integration.color}28`,
            }}
          >
            <IntegrationIcon id={integration.iconUrl} color={integration.color} size={22} />
          </div>

          <button
            type="button"
            onClick={onConfigure}
            className="rounded-lg p-1.5 text-muted-foreground/70 transition-colors hover:bg-secondary hover:text-foreground"
            aria-label={`Open ${integration.name} settings`}
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>

        <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
          {integration.name}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3">
          {integration.description}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 border-t border-border/70 px-5 py-3.5">
        <button
          type="button"
          onClick={onConfigure}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
        >
          <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          {isConnected ? 'Configure' : 'Connect'}
        </button>

        <Switch
          checked={isConnected && isEnabled}
          disabled={!isConnected || isToggling}
          onCheckedChange={(checked) => onToggle?.(checked)}
          className="h-6 w-11 shrink-0 p-0.5 data-[state=checked]:bg-accent-primary data-[state=unchecked]:bg-muted [&_[data-slot=switch-thumb]]:size-5 [&_[data-slot=switch-thumb]]:data-[state=unchecked]:!translate-x-0 [&_[data-slot=switch-thumb]]:data-[state=checked]:!translate-x-5"
          aria-label={`Toggle ${integration.name}`}
        />
      </div>
    </div>
  )
}
