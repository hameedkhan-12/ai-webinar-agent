'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@teispace/next-themes'
import { Moon, Sun } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()
  // Avoid a hydration mismatch - the real theme is only known client-side.
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="h-8 w-8" />
  }

  const isDark = theme === 'dark'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="flex items-center justify-center rounded-lg p-2 hover:cursor-pointer hover:bg-primary/10"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="h-4 w-4 opacity-80" />
            ) : (
              <Moon className="h-4 w-4 opacity-80" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <span className="text-sm">
            Switch to {isDark ? 'light' : 'dark'} mode
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default ThemeToggle