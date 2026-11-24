"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === "dark"
  const label = isDark ? "Switch to light mode" : "Switch to dark mode"
  const Icon = isDark ? Sun : Moon

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className={
        compact
          ? "flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-300"
          : "ml-1 flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-emerald-300"
      }
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {compact ? <span>Theme</span> : <span>{isDark ? "Light mode" : "Dark mode"}</span>}
    </button>
  )
}
