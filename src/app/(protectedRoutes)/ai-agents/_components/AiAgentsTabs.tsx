'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bot, AudioLines } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/ai-agents', label: 'Agents', icon: Bot },
  { href: '/ai-agents/voices', label: 'Voices', icon: AudioLines },
]

const AiAgentsTabs = () => {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-2 border-b border-border pb-2">
      {TABS.map((tab) => {
        const isActive =
          tab.href === '/ai-agents'
            ? pathname === '/ai-agents'
            : pathname.startsWith(tab.href)

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}

export default AiAgentsTabs