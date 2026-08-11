'use client'

import { IntegrationMeta } from '@/lib/integrations/types'
import { IntegrationIcon } from './IntegrationIcon'
import { CheckCircle2, ChevronRight, Zap } from 'lucide-react'

type Props = {
  integration: IntegrationMeta
  isConnected: boolean
  isEnabled: boolean
  onConfigure: () => void
}

export function IntegrationCard({ integration, isConnected, isEnabled, onConfigure }: Props) {
  return (
    <div
      className={`group relative rounded-2xl border bg-card/50 backdrop-blur-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${isConnected
        ? 'border-emerald-500/30 shadow-sm shadow-emerald-500/10'
        : 'border-border hover:border-border/80'
        }`}
      onClick={onConfigure}
      style={{
        boxShadow: isConnected ? `0 0 20px ${integration.color}12` : undefined,
      }}
    >
      {/* Brand color top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 transition-all duration-300 group-hover:h-1"
        style={{ backgroundColor: integration.color }}
      />

      {/* Connected badge */}
      {isConnected && (
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-2 py-0.5">
          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
          <span className="text-[10px] font-medium text-emerald-400">Connected</span>
        </div>
      )}

      <div className="p-5">
        {/* Icon + Name */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
            style={{
              backgroundColor: `${integration.color}18`,
              border: `1.5px solid ${integration.color}35`,
            }}
          >
            <IntegrationIcon id={integration.iconUrl} color={integration.color} size={24} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground text-sm truncate">{integration.name}</h3>
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${integration.color}18`, color: integration.color }}
            >
              {integration.category}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-4">
          {integration.description}
        </p>

        {/* Feature list */}
        <ul className="space-y-1 mb-5">
          {integration.features.slice(0, 3).map((feature) => (
            <li key={feature} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Zap className="w-2.5 h-2.5 flex-shrink-0" style={{ color: integration.color }} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all duration-200"
          style={{
            backgroundColor: isConnected ? `${integration.color}15` : `${integration.color}20`,
            color: integration.color,
            border: `1px solid ${integration.color}35`,
          }}
          onClick={(e) => {
            e.stopPropagation()
            onConfigure()
          }}
        >
          {isConnected ? 'Configure' : 'Connect'}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
